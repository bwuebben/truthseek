import json
from datetime import UTC, datetime, timedelta
from uuid import UUID

import redis.asyncio as redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.agent import Agent
from app.models.claim import Claim, ClaimVote
from app.models.expertise import AgentExpertise


class LearningScoreService:
    """
    Service for calculating and managing agent learning scores and expertise.

    Learning Score Algorithm:
    - 50% accuracy rate (correct_resolved_votes / total_resolved_votes)
    - 25% consistency (low variance in accuracy over time windows)
    - 25% improvement trajectory (slope of accuracy trend)
    """

    CACHE_PREFIX = "learning:"
    CACHE_TTL = 300  # 5 minutes

    def __init__(self, db: AsyncSession, redis_client: redis.Redis):
        self.db = db
        self.redis = redis_client

    async def calculate_learning_score(self, agent_id: UUID) -> float:
        """
        Compute the learning score for an agent.

        Returns a score between 0 and 1, where:
        - 0.5 is the starting score for new agents
        - Higher scores indicate better accuracy and improvement
        """
        cache_key = f"{self.CACHE_PREFIX}score:{agent_id}"

        cached = await self.redis.get(cache_key)
        if cached is not None:
            return float(cached)

        # Get agent
        result = await self.db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()

        if not agent:
            return 0.5

        # If no resolved votes yet, return default score
        if agent.total_resolved_votes == 0:
            return 0.5

        # 50% weight: Accuracy rate
        accuracy_rate = agent.accuracy_rate or 0.5
        accuracy_component = accuracy_rate * 0.5

        # 25% weight: Consistency (based on variance in recent accuracy)
        consistency = await self._calculate_consistency(agent_id)
        consistency_component = consistency * 0.25

        # 25% weight: Improvement trajectory
        trajectory = await self._calculate_trajectory(agent_id)
        trajectory_component = trajectory * 0.25

        learning_score = accuracy_component + consistency_component + trajectory_component

        # Ensure score is between 0 and 1
        learning_score = max(0.0, min(1.0, learning_score))

        # Update agent's learning score
        agent.learning_score = learning_score

        # Cache the result
        await self.redis.setex(cache_key, self.CACHE_TTL, str(learning_score))

        return learning_score

    async def _calculate_consistency(self, agent_id: UUID) -> float:
        """
        Calculate consistency score based on variance in accuracy over time windows.
        Higher consistency (lower variance) = higher score.

        Returns a value between 0 and 1.
        """
        # Get resolved votes from different time windows
        now = datetime.now(UTC)
        windows = [
            (now - timedelta(days=30), now),
            (now - timedelta(days=60), now - timedelta(days=30)),
            (now - timedelta(days=90), now - timedelta(days=60)),
        ]

        accuracies = []
        for start, end in windows:
            # Query resolved votes in this window
            result = await self.db.execute(
                select(ClaimVote)
                .join(Claim)
                .where(
                    ClaimVote.agent_id == agent_id,
                    ClaimVote.created_at >= start,
                    ClaimVote.created_at < end,
                    # Consider "resolved" as gradient > 0.8 or < 0.2
                    ((Claim.gradient > 0.8) | (Claim.gradient < 0.2))
                )
            )
            votes = list(result.scalars().all())

            if not votes:
                continue

            # Calculate accuracy for this window
            correct = 0
            for vote in votes:
                result = await self.db.execute(
                    select(Claim.gradient).where(Claim.id == vote.claim_id)
                )
                gradient = result.scalar()
                if gradient is not None:
                    is_correct = (
                        (vote.value > 0.5 and gradient > 0.8) or
                        (vote.value < 0.5 and gradient < 0.2)
                    )
                    if is_correct:
                        correct += 1

            if votes:
                accuracies.append(correct / len(votes))

        if len(accuracies) < 2:
            return 0.5  # Not enough data for consistency measurement

        # Calculate variance
        mean_accuracy = sum(accuracies) / len(accuracies)
        variance = sum((a - mean_accuracy) ** 2 for a in accuracies) / len(accuracies)

        # Convert variance to consistency score (lower variance = higher score)
        # Max variance for accuracy values is 0.25 (when alternating between 0 and 1)
        consistency = 1.0 - min(1.0, variance * 4)

        return consistency

    async def _calculate_trajectory(self, agent_id: UUID) -> float:
        """
        Calculate improvement trajectory based on recent accuracy trend.
        Positive slope = higher score.

        Returns a value between 0 and 1, where 0.5 is neutral.
        """
        # Get votes from last 90 days, split into 3 periods
        now = datetime.now(UTC)
        periods = [
            (now - timedelta(days=90), now - timedelta(days=60)),
            (now - timedelta(days=60), now - timedelta(days=30)),
            (now - timedelta(days=30), now),
        ]

        accuracies = []
        for start, end in periods:
            result = await self.db.execute(
                select(ClaimVote)
                .join(Claim)
                .where(
                    ClaimVote.agent_id == agent_id,
                    ClaimVote.created_at >= start,
                    ClaimVote.created_at < end,
                    ((Claim.gradient > 0.8) | (Claim.gradient < 0.2))
                )
            )
            votes = list(result.scalars().all())

            if not votes:
                accuracies.append(None)
                continue

            correct = 0
            for vote in votes:
                result = await self.db.execute(
                    select(Claim.gradient).where(Claim.id == vote.claim_id)
                )
                gradient = result.scalar()
                if gradient is not None:
                    is_correct = (
                        (vote.value > 0.5 and gradient > 0.8) or
                        (vote.value < 0.5 and gradient < 0.2)
                    )
                    if is_correct:
                        correct += 1

            accuracies.append(correct / len(votes))

        # Filter out None values
        valid_accuracies = [(i, a) for i, a in enumerate(accuracies) if a is not None]

        if len(valid_accuracies) < 2:
            return 0.5  # Not enough data

        # Calculate simple linear regression slope
        n = len(valid_accuracies)
        sum_x = sum(i for i, _ in valid_accuracies)
        sum_y = sum(a for _, a in valid_accuracies)
        sum_xy = sum(i * a for i, a in valid_accuracies)
        sum_x2 = sum(i * i for i, _ in valid_accuracies)

        # Slope calculation
        denominator = n * sum_x2 - sum_x * sum_x
        if denominator == 0:
            return 0.5

        slope = (n * sum_xy - sum_x * sum_y) / denominator

        # Convert slope to score (slope of 0.1 per period is strong improvement)
        # slope range: roughly -0.5 to 0.5, map to 0-1
        trajectory = 0.5 + slope
        trajectory = max(0.0, min(1.0, trajectory))

        return trajectory

    async def update_on_claim_resolved(
        self,
        claim_id: UUID,
        final_gradient: float,
    ) -> dict[UUID, float]:
        """
        Update learning scores for all voters when a claim reaches consensus.

        A claim is considered resolved when gradient > 0.8 (true) or < 0.2 (false).

        Returns dict of agent_id -> new_learning_score.
        """
        results = {}

        # Only process if claim has reached consensus
        if not (final_gradient > 0.8 or final_gradient < 0.2):
            return results

        consensus_is_true = final_gradient > 0.8

        # Get all votes on this claim
        result = await self.db.execute(
            select(ClaimVote).where(ClaimVote.claim_id == claim_id)
        )
        votes = list(result.scalars().all())

        # Get claim tags for expertise tracking
        claim_result = await self.db.execute(
            select(Claim.tags).where(Claim.id == claim_id)
        )
        tags = claim_result.scalar() or []

        for vote in votes:
            agent_id = vote.agent_id

            # Determine if vote was correct
            vote_predicted_true = vote.value > 0.5
            is_correct = vote_predicted_true == consensus_is_true

            # Update agent's resolved vote counts
            result = await self.db.execute(select(Agent).where(Agent.id == agent_id))
            agent = result.scalar_one_or_none()

            if not agent:
                continue

            agent.total_resolved_votes += 1
            if is_correct:
                agent.correct_resolved_votes += 1

            # Update accuracy rate
            if agent.total_resolved_votes > 0:
                agent.accuracy_rate = agent.correct_resolved_votes / agent.total_resolved_votes

            # Update expertise tracking for each tag
            await self._update_expertise(agent_id, tags, is_correct)

            # Recalculate learning score
            # Invalidate cache first
            cache_key = f"{self.CACHE_PREFIX}score:{agent_id}"
            await self.redis.delete(cache_key)

            new_score = await self.calculate_learning_score(agent_id)
            results[agent_id] = new_score

        return results

    async def _update_expertise(
        self,
        agent_id: UUID,
        tags: list[str],
        is_correct: bool,
    ) -> None:
        """Update expertise tracking for an agent's vote on tagged claim."""
        for tag in tags:
            # Get or create expertise record
            result = await self.db.execute(
                select(AgentExpertise).where(
                    AgentExpertise.agent_id == agent_id,
                    AgentExpertise.tag == tag,
                )
            )
            expertise = result.scalar_one_or_none()

            if expertise:
                expertise.engagement_count += 1
                expertise.last_activity_at = datetime.now(UTC)

                # Update accuracy in tag (running average)
                if expertise.accuracy_in_tag is None:
                    expertise.accuracy_in_tag = 1.0 if is_correct else 0.0
                else:
                    # Weighted update: newer results matter more
                    expertise.accuracy_in_tag = (
                        expertise.accuracy_in_tag * 0.9 + (1.0 if is_correct else 0.0) * 0.1
                    )
            else:
                expertise = AgentExpertise(
                    agent_id=agent_id,
                    tag=tag,
                    engagement_count=1,
                    accuracy_in_tag=1.0 if is_correct else 0.0,
                    last_activity_at=datetime.now(UTC),
                )
                self.db.add(expertise)

    async def get_expertise_areas(
        self,
        agent_id: UUID,
        limit: int = 5,
    ) -> list[dict]:
        """
        Get an agent's top expertise areas by engagement and accuracy.

        Returns list of dicts with: tag, engagement_count, accuracy_in_tag
        """
        cache_key = f"{self.CACHE_PREFIX}expertise:{agent_id}"

        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Query expertise, ordered by engagement with minimum threshold
        result = await self.db.execute(
            select(AgentExpertise)
            .where(
                AgentExpertise.agent_id == agent_id,
                AgentExpertise.engagement_count >= 3,  # Minimum engagement
            )
            .order_by(
                AgentExpertise.engagement_count.desc(),
                AgentExpertise.accuracy_in_tag.desc().nulls_last(),
            )
            .limit(limit)
        )
        expertise_list = list(result.scalars().all())

        areas = [
            {
                "tag": e.tag,
                "engagement_count": e.engagement_count,
                "accuracy": round(e.accuracy_in_tag * 100, 1) if e.accuracy_in_tag else None,
            }
            for e in expertise_list
        ]

        await self.redis.setex(cache_key, self.CACHE_TTL, json.dumps(areas))

        return areas

    async def track_activity(self, agent_id: UUID, tags: list[str]) -> None:
        """
        Track an agent's activity on claims with specific tags.
        This updates first_activity_at if not set and engagement counts.
        """
        # Update first_activity_at if not set
        result = await self.db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()

        if agent and not agent.first_activity_at:
            agent.first_activity_at = datetime.now(UTC)

        # Update expertise engagement counts
        for tag in tags:
            result = await self.db.execute(
                select(AgentExpertise).where(
                    AgentExpertise.agent_id == agent_id,
                    AgentExpertise.tag == tag,
                )
            )
            expertise = result.scalar_one_or_none()

            if expertise:
                expertise.engagement_count += 1
                expertise.last_activity_at = datetime.now(UTC)
            else:
                expertise = AgentExpertise(
                    agent_id=agent_id,
                    tag=tag,
                    engagement_count=1,
                    last_activity_at=datetime.now(UTC),
                )
                self.db.add(expertise)

    async def invalidate_cache(self, agent_id: UUID) -> None:
        """Invalidate all learning score caches for an agent."""
        await self.redis.delete(f"{self.CACHE_PREFIX}score:{agent_id}")
        await self.redis.delete(f"{self.CACHE_PREFIX}expertise:{agent_id}")
