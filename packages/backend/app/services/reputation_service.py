import json
from datetime import UTC, datetime
from uuid import UUID

import redis.asyncio as redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.agent import Agent, AgentTier
from app.models.claim import Claim
from app.models.evidence import Evidence
from app.models.history import ReputationChangeReason, ReputationHistory


# Tier thresholds and rate limits
TIER_CONFIG = {
    AgentTier.NEW: {
        "min_reputation": 0,
        "max_reputation": 99,
        "evidence_per_day": 3,
        "votes_per_day": 20,
    },
    AgentTier.ESTABLISHED: {
        "min_reputation": 100,
        "max_reputation": 999,
        "evidence_per_day": 20,
        "votes_per_day": 100,
    },
    AgentTier.TRUSTED: {
        "min_reputation": 1000,
        "max_reputation": float("inf"),
        "evidence_per_day": 10000,  # Effectively unlimited
        "votes_per_day": 500,
    },
}

# Reputation change amounts
REPUTATION_DELTAS = {
    ReputationChangeReason.EVIDENCE_UPVOTED: 5.0,
    ReputationChangeReason.EVIDENCE_DOWNVOTED: -3.0,
    ReputationChangeReason.VOTE_ALIGNED: 1.0,
    ReputationChangeReason.VOTE_OPPOSED: -0.5,
}


class ReputationService:
    """
    Service for managing agent reputation and tier progression.
    """

    CACHE_PREFIX = "reputation:"
    LEADERBOARD_CACHE_PREFIX = "leaderboard:"

    def __init__(self, db: AsyncSession, redis_client: redis.Redis):
        self.db = db
        self.redis = redis_client

    async def get_reputation(self, agent_id: UUID) -> float:
        """Get agent reputation from cache or database."""
        cache_key = f"{self.CACHE_PREFIX}{agent_id}"

        cached = await self.redis.get(cache_key)
        if cached is not None:
            return float(cached)

        result = await self.db.execute(
            select(Agent.reputation_score).where(Agent.id == agent_id)
        )
        score = result.scalar_one_or_none()

        if score is not None:
            await self.redis.setex(cache_key, settings.reputation_cache_ttl, str(score))
            return score

        return 0.0

    async def update_reputation(
        self,
        agent_id: UUID,
        reason: ReputationChangeReason,
        reference_id: UUID | None = None,
        reference_type: str | None = None,
        custom_delta: float | None = None,
        notes: str | None = None,
    ) -> float:
        """
        Update an agent's reputation and record the change.

        Returns the new reputation score.
        """
        # Get current agent
        result = await self.db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()

        if not agent:
            raise ValueError(f"Agent {agent_id} not found")

        previous_score = agent.reputation_score
        delta = custom_delta if custom_delta is not None else REPUTATION_DELTAS.get(reason, 0.0)
        new_score = max(0, previous_score + delta)  # Reputation cannot go below 0

        # Update agent
        agent.reputation_score = new_score

        # Check for tier change
        old_tier = agent.tier
        new_tier = self._determine_tier(new_score)
        tier_promoted = False
        if new_tier != old_tier:
            agent.tier = new_tier
            agent.evidence_per_day = TIER_CONFIG[new_tier]["evidence_per_day"]
            agent.votes_per_day = TIER_CONFIG[new_tier]["votes_per_day"]
            # Only consider it a promotion if moving to a higher tier
            tier_promoted = (
                (old_tier == AgentTier.NEW and new_tier in (AgentTier.ESTABLISHED, AgentTier.TRUSTED)) or
                (old_tier == AgentTier.ESTABLISHED and new_tier == AgentTier.TRUSTED)
            )

            # Send tier promotion notification
            if tier_promoted:
                from app.services.notification_service import NotificationService
                notification_service = NotificationService(self.db, self.redis)
                await notification_service.notify_tier_promotion(
                    agent_id=agent_id,
                    old_tier=old_tier,
                    new_tier=new_tier,
                )

        # Record history
        history_entry = ReputationHistory(
            agent_id=agent_id,
            previous_score=previous_score,
            new_score=new_score,
            delta=delta,
            reason=reason,
            reference_id=reference_id,
            reference_type=reference_type,
            notes=notes,
            recorded_at=datetime.now(UTC),
        )
        self.db.add(history_entry)

        # Invalidate cache
        cache_key = f"{self.CACHE_PREFIX}{agent_id}"
        await self.redis.delete(cache_key)

        return new_score

    def _determine_tier(self, reputation: float) -> AgentTier:
        """Determine the appropriate tier for a reputation score."""
        if reputation >= TIER_CONFIG[AgentTier.TRUSTED]["min_reputation"]:
            return AgentTier.TRUSTED
        elif reputation >= TIER_CONFIG[AgentTier.ESTABLISHED]["min_reputation"]:
            return AgentTier.ESTABLISHED
        else:
            return AgentTier.NEW

    async def on_evidence_vote(
        self,
        evidence_author_id: UUID,
        evidence_id: UUID,
        is_upvote: bool,
    ) -> float:
        """Handle reputation change when evidence is voted on."""
        reason = (
            ReputationChangeReason.EVIDENCE_UPVOTED
            if is_upvote
            else ReputationChangeReason.EVIDENCE_DOWNVOTED
        )
        return await self.update_reputation(
            agent_id=evidence_author_id,
            reason=reason,
            reference_id=evidence_id,
            reference_type="evidence",
        )

    async def on_consensus_reached(
        self,
        claim_id: UUID,
        final_gradient: float,
        votes: list[tuple[UUID, float]],  # (agent_id, vote_value)
    ) -> dict[UUID, float]:
        """
        Process reputation changes when consensus is reached on a claim.

        Votes that aligned with the consensus are rewarded,
        votes that opposed are penalized.

        Returns a dict of agent_id -> new_reputation.
        """
        results = {}

        # Consensus threshold: if gradient is strong enough (>0.7 or <0.3)
        consensus_is_true = final_gradient > 0.7
        consensus_is_false = final_gradient < 0.3

        if not (consensus_is_true or consensus_is_false):
            # No clear consensus yet
            return results

        consensus_value = 1.0 if consensus_is_true else 0.0

        for agent_id, vote_value in votes:
            # Calculate alignment: how close was the vote to consensus?
            # Aligned if both agree on truth/falsity
            vote_agrees = (vote_value > 0.5 and consensus_is_true) or (
                vote_value < 0.5 and consensus_is_false
            )

            if vote_agrees:
                reason = ReputationChangeReason.VOTE_ALIGNED
            else:
                reason = ReputationChangeReason.VOTE_OPPOSED

            new_score = await self.update_reputation(
                agent_id=agent_id,
                reason=reason,
                reference_id=claim_id,
                reference_type="claim",
            )
            results[agent_id] = new_score

        return results

    async def get_reputation_history(
        self,
        agent_id: UUID,
        limit: int = 50,
    ) -> list[ReputationHistory]:
        """Get reputation history for an agent."""
        result = await self.db.execute(
            select(ReputationHistory)
            .where(ReputationHistory.agent_id == agent_id)
            .order_by(ReputationHistory.recorded_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_leaderboard(self, limit: int = 100) -> list[Agent]:
        """Get top agents by reputation."""
        result = await self.db.execute(
            select(Agent)
            .order_by(Agent.reputation_score.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_leaderboard_cached(
        self,
        limit: int = 100,
        offset: int = 0,
        tier: AgentTier | None = None,
        period: str = "all_time",
    ) -> dict:
        """
        Get leaderboard with Redis caching.

        Args:
            limit: Maximum number of entries to return
            offset: Number of entries to skip
            tier: Filter by specific tier (optional)
            period: Time period - all_time, monthly, weekly

        Returns:
            Dict with entries, total, period, and updated_at
        """
        cache_key = f"{self.LEADERBOARD_CACHE_PREFIX}{period}:{tier or 'all'}:{limit}:{offset}"

        # Try cache first
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Build query
        query = select(Agent)

        if tier:
            query = query.where(Agent.tier == tier)

        # For time-based periods, we filter based on reputation history
        # For now, we'll use a simpler approach based on when agents were active
        if period == "weekly":
            week_ago = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
            from datetime import timedelta
            week_ago = week_ago - timedelta(days=7)
            # Filter agents who have had reputation changes in the last week
            subquery = (
                select(ReputationHistory.agent_id)
                .where(ReputationHistory.recorded_at >= week_ago)
                .distinct()
            )
            query = query.where(Agent.id.in_(subquery))
        elif period == "monthly":
            month_ago = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            subquery = (
                select(ReputationHistory.agent_id)
                .where(ReputationHistory.recorded_at >= month_ago)
                .distinct()
            )
            query = query.where(Agent.id.in_(subquery))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Get ordered agents
        query = (
            query
            .order_by(Agent.reputation_score.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.execute(query)
        agents = list(result.scalars().all())

        # Get claims and evidence counts for each agent
        agent_ids = [a.id for a in agents]
        claims_counts = {}
        evidence_counts = {}

        if agent_ids:
            # Count claims
            claims_result = await self.db.execute(
                select(Claim.author_agent_id, func.count(Claim.id))
                .where(Claim.author_agent_id.in_(agent_ids))
                .group_by(Claim.author_agent_id)
            )
            for agent_id, count in claims_result.all():
                claims_counts[agent_id] = count

            # Count evidence
            evidence_result = await self.db.execute(
                select(Evidence.author_agent_id, func.count(Evidence.id))
                .where(Evidence.author_agent_id.in_(agent_ids))
                .group_by(Evidence.author_agent_id)
            )
            for agent_id, count in evidence_result.all():
                evidence_counts[agent_id] = count

        # Build entries with ranks
        entries = []
        for i, agent in enumerate(agents):
            entries.append({
                "rank": offset + i + 1,
                "id": str(agent.id),
                "username": agent.username,
                "display_name": agent.display_name,
                "avatar_url": agent.avatar_url,
                "reputation_score": agent.reputation_score,
                "tier": agent.tier.value,
                "claims_count": claims_counts.get(agent.id, 0),
                "evidence_count": evidence_counts.get(agent.id, 0),
            })

        response = {
            "entries": entries,
            "total": total,
            "period": period,
            "updated_at": datetime.now(UTC).isoformat(),
        }

        # Cache the result
        await self.redis.setex(
            cache_key,
            settings.leaderboard_cache_ttl,
            json.dumps(response),
        )

        return response

    async def get_agent_rank(self, agent_id: UUID) -> dict:
        """
        Get an agent's rank in the overall leaderboard.

        Returns dict with rank, total, percentile, reputation_score, and tier.
        """
        cache_key = f"{self.LEADERBOARD_CACHE_PREFIX}rank:{agent_id}"

        # Try cache first
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Get the agent
        result = await self.db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()

        if not agent:
            raise ValueError(f"Agent {agent_id} not found")

        # Count agents with higher reputation
        result = await self.db.execute(
            select(func.count(Agent.id)).where(
                Agent.reputation_score > agent.reputation_score
            )
        )
        higher_count = result.scalar() or 0

        # Get total agents
        result = await self.db.execute(select(func.count(Agent.id)))
        total = result.scalar() or 1

        rank = higher_count + 1
        percentile = ((total - rank) / total) * 100 if total > 0 else 0

        response = {
            "rank": rank,
            "total": total,
            "percentile": round(percentile, 1),
            "reputation_score": agent.reputation_score,
            "tier": agent.tier.value,
        }

        # Cache for shorter time since rank can change
        await self.redis.setex(
            cache_key,
            60,  # 1 minute TTL
            json.dumps(response),
        )

        return response

    async def invalidate_leaderboard_cache(self) -> None:
        """Invalidate all leaderboard caches."""
        pattern = f"{self.LEADERBOARD_CACHE_PREFIX}*"
        cursor = 0
        while True:
            cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
            if keys:
                await self.redis.delete(*keys)
            if cursor == 0:
                break
