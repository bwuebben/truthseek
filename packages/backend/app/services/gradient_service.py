import json
import math
from datetime import UTC, datetime
from uuid import UUID

import redis.asyncio as redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.agent import Agent
from app.models.claim import Claim, ClaimVote
from app.models.history import GradientHistory


class GradientService:
    """
    Service for computing and caching claim gradients.

    The gradient represents epistemic confidence in a claim's truth value,
    ranging from 0 (definitely false) to 1 (definitely true), with 0.5
    representing maximum uncertainty.
    """

    CACHE_PREFIX = "gradient:"

    def __init__(self, db: AsyncSession, redis_client: redis.Redis):
        self.db = db
        self.redis = redis_client

    async def get_gradient(self, claim_id: UUID) -> float:
        """Get gradient from cache or compute if not cached."""
        cache_key = f"{self.CACHE_PREFIX}{claim_id}"

        # Try cache first
        cached = await self.redis.get(cache_key)
        if cached is not None:
            return float(cached)

        # Compute gradient
        gradient = await self.compute_gradient(claim_id)

        # Cache the result
        await self.redis.setex(cache_key, settings.gradient_cache_ttl, str(gradient))

        return gradient

    async def compute_gradient(self, claim_id: UUID) -> float:
        """
        Compute the weighted gradient for a claim based on votes.

        Formula:
            gradient = sum(log(1 + rep(agent)) * vote_value) / sum(log(1 + rep(agent)))

        Where rep(agent) is the agent's reputation score.
        Returns 0.5 (uncertain) if no votes exist.
        """
        # Fetch all votes with agent reputation
        result = await self.db.execute(
            select(ClaimVote.value, Agent.reputation_score)
            .join(Agent, ClaimVote.agent_id == Agent.id)
            .where(ClaimVote.claim_id == claim_id)
        )
        votes = result.all()

        if not votes:
            return 0.5  # Default: uncertain

        weighted_sum = 0.0
        weight_total = 0.0

        for vote_value, reputation_score in votes:
            # Use log(1 + reputation) to weight votes
            # This gives diminishing returns for very high reputation
            weight = math.log(1 + max(0, reputation_score))
            if weight < 0.1:
                weight = 0.1  # Minimum weight for new agents

            weighted_sum += weight * vote_value
            weight_total += weight

        if weight_total <= 0:
            return 0.5

        return weighted_sum / weight_total

    async def invalidate_cache(self, claim_id: UUID) -> None:
        """Invalidate the cached gradient for a claim."""
        cache_key = f"{self.CACHE_PREFIX}{claim_id}"
        await self.redis.delete(cache_key)

    async def update_gradient(self, claim_id: UUID) -> float:
        """
        Recompute gradient, update the claim, record history, and refresh cache.
        """
        gradient = await self.compute_gradient(claim_id)

        # Update claim's gradient
        result = await self.db.execute(select(Claim).where(Claim.id == claim_id))
        claim = result.scalar_one_or_none()

        if claim:
            claim.gradient = gradient

            # Record history entry
            history_entry = GradientHistory(
                claim_id=claim_id,
                gradient=gradient,
                vote_count=claim.vote_count,
                recorded_at=datetime.now(UTC),
            )
            self.db.add(history_entry)

        # Update cache
        cache_key = f"{self.CACHE_PREFIX}{claim_id}"
        await self.redis.setex(cache_key, settings.gradient_cache_ttl, str(gradient))

        return gradient

    async def get_gradient_history(
        self, claim_id: UUID, limit: int = 100
    ) -> list[dict]:
        """Get gradient history for a claim."""
        cache_key = f"gradient_history:{claim_id}"

        # Try cache
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Fetch from database
        result = await self.db.execute(
            select(GradientHistory)
            .where(GradientHistory.claim_id == claim_id)
            .order_by(GradientHistory.recorded_at.desc())
            .limit(limit)
        )
        history = result.scalars().all()

        history_data = [
            {
                "gradient": h.gradient,
                "vote_count": h.vote_count,
                "recorded_at": h.recorded_at.isoformat(),
            }
            for h in history
        ]

        # Cache for shorter duration
        await self.redis.setex(cache_key, 60, json.dumps(history_data))

        return history_data

    async def get_batch_gradients(self, claim_ids: list[UUID]) -> dict[UUID, float]:
        """Get gradients for multiple claims efficiently."""
        gradients = {}

        # Check cache for all claims
        cache_keys = [f"{self.CACHE_PREFIX}{cid}" for cid in claim_ids]
        cached_values = await self.redis.mget(cache_keys)

        uncached_ids = []
        for i, (claim_id, cached) in enumerate(zip(claim_ids, cached_values)):
            if cached is not None:
                gradients[claim_id] = float(cached)
            else:
                uncached_ids.append(claim_id)

        # Compute uncached gradients
        if uncached_ids:
            # Batch fetch all votes for uncached claims
            result = await self.db.execute(
                select(
                    ClaimVote.claim_id,
                    ClaimVote.value,
                    Agent.reputation_score,
                )
                .join(Agent, ClaimVote.agent_id == Agent.id)
                .where(ClaimVote.claim_id.in_(uncached_ids))
            )
            votes = result.all()

            # Group votes by claim
            votes_by_claim: dict[UUID, list[tuple[float, float]]] = {}
            for claim_id, vote_value, rep_score in votes:
                if claim_id not in votes_by_claim:
                    votes_by_claim[claim_id] = []
                votes_by_claim[claim_id].append((vote_value, rep_score))

            # Compute gradients for each claim
            pipeline = self.redis.pipeline()
            for claim_id in uncached_ids:
                claim_votes = votes_by_claim.get(claim_id, [])
                if not claim_votes:
                    gradient = 0.5
                else:
                    weighted_sum = 0.0
                    weight_total = 0.0
                    for vote_value, rep_score in claim_votes:
                        weight = max(0.1, math.log(1 + max(0, rep_score)))
                        weighted_sum += weight * vote_value
                        weight_total += weight
                    gradient = weighted_sum / weight_total if weight_total > 0 else 0.5

                gradients[claim_id] = gradient
                pipeline.setex(
                    f"{self.CACHE_PREFIX}{claim_id}",
                    settings.gradient_cache_ttl,
                    str(gradient),
                )

            await pipeline.execute()

        return gradients
