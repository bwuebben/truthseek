from datetime import UTC, date, datetime
from uuid import UUID

import redis.asyncio as redis
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentTier
from app.models.rate_limit import ActionType, RateLimitCounter
from app.services.reputation_service import TIER_CONFIG


class RateLimitExceeded(Exception):
    """Raised when an agent exceeds their rate limit."""

    def __init__(self, action_type: ActionType, current: int, limit: int):
        self.action_type = action_type
        self.current = current
        self.limit = limit
        super().__init__(
            f"Rate limit exceeded for {action_type.value}: {current}/{limit}"
        )


class RateLimiterService:
    """
    Service for enforcing rate limits based on agent tier.

    Uses Redis for fast counting with PostgreSQL as backup/audit.
    """

    CACHE_PREFIX = "rate_limit:"
    CACHE_TTL = 86400  # 24 hours

    def __init__(self, db: AsyncSession, redis_client: redis.Redis):
        self.db = db
        self.redis = redis_client

    def _get_cache_key(self, agent_id: UUID, action_type: ActionType) -> str:
        """Generate Redis cache key for rate limit counter."""
        today = date.today().isoformat()
        return f"{self.CACHE_PREFIX}{agent_id}:{action_type.value}:{today}"

    async def get_limit_for_action(self, agent: Agent, action_type: ActionType) -> int:
        """Get the rate limit for an agent's tier and action type."""
        tier_config = TIER_CONFIG[agent.tier]

        if action_type in (ActionType.CLAIM_VOTE, ActionType.EVIDENCE_VOTE):
            return tier_config["votes_per_day"]
        elif action_type == ActionType.EVIDENCE_SUBMIT:
            return tier_config["evidence_per_day"]
        elif action_type == ActionType.CLAIM_CREATE:
            # Claims have their own limits (could be configurable)
            return {
                AgentTier.NEW: 5,
                AgentTier.ESTABLISHED: 20,
                AgentTier.TRUSTED: 100,
            }[agent.tier]
        elif action_type == ActionType.COMMENT_CREATE:
            # Comments have their own limits
            return {
                AgentTier.NEW: 10,
                AgentTier.ESTABLISHED: 50,
                AgentTier.TRUSTED: 200,
            }[agent.tier]

        return 0

    async def check_rate_limit(
        self,
        agent: Agent,
        action_type: ActionType,
    ) -> tuple[bool, int, int]:
        """
        Check if an agent can perform an action.

        Returns:
            (allowed, current_count, limit)
        """
        limit = await self.get_limit_for_action(agent, action_type)
        cache_key = self._get_cache_key(agent.id, action_type)

        # Get current count from Redis
        current = await self.redis.get(cache_key)
        current_count = int(current) if current else 0

        allowed = current_count < limit
        return allowed, current_count, limit

    async def increment(
        self,
        agent: Agent,
        action_type: ActionType,
        check_first: bool = True,
    ) -> int:
        """
        Increment the rate limit counter for an action.

        Args:
            agent: The agent performing the action
            action_type: Type of action being performed
            check_first: If True, check limit before incrementing

        Returns:
            New count after increment

        Raises:
            RateLimitExceeded: If the rate limit would be exceeded
        """
        if check_first:
            allowed, current, limit = await self.check_rate_limit(agent, action_type)
            if not allowed:
                raise RateLimitExceeded(action_type, current, limit)

        cache_key = self._get_cache_key(agent.id, action_type)

        # Increment in Redis
        new_count = await self.redis.incr(cache_key)

        # Set expiry if this is the first increment today
        if new_count == 1:
            # Calculate seconds until midnight UTC
            now = datetime.now(UTC)
            midnight = datetime(now.year, now.month, now.day, tzinfo=UTC)
            from datetime import timedelta
            next_midnight = midnight + timedelta(days=1)
            seconds_until_midnight = int((next_midnight - now).total_seconds())
            await self.redis.expire(cache_key, seconds_until_midnight)

        # Also update PostgreSQL for audit/backup
        await self._update_db_counter(agent.id, action_type)

        return new_count

    async def _update_db_counter(
        self,
        agent_id: UUID,
        action_type: ActionType,
    ) -> None:
        """Update the database counter (for backup/audit)."""
        today = date.today()

        stmt = insert(RateLimitCounter).values(
            agent_id=agent_id,
            action_type=action_type,
            count=1,
            date=today,
        ).on_conflict_do_update(
            index_elements=["agent_id", "action_type", "date"],
            set_={"count": RateLimitCounter.count + 1},
        )
        await self.db.execute(stmt)

    async def get_remaining(
        self,
        agent: Agent,
        action_type: ActionType,
    ) -> int:
        """Get remaining actions allowed for today."""
        allowed, current, limit = await self.check_rate_limit(agent, action_type)
        return max(0, limit - current)

    async def get_all_limits(self, agent: Agent) -> dict[str, dict]:
        """Get all rate limit statuses for an agent."""
        results = {}

        for action_type in ActionType:
            allowed, current, limit = await self.check_rate_limit(agent, action_type)
            results[action_type.value] = {
                "current": current,
                "limit": limit,
                "remaining": max(0, limit - current),
                "exceeded": not allowed,
            }

        return results

    async def reset_limits(self, agent_id: UUID) -> None:
        """Reset all rate limits for an agent (admin action)."""
        today = date.today().isoformat()
        pattern = f"{self.CACHE_PREFIX}{agent_id}:*:{today}"

        # Delete matching keys
        cursor = 0
        while True:
            cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
            if keys:
                await self.redis.delete(*keys)
            if cursor == 0:
                break
