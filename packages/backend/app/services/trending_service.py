import json
from datetime import UTC, datetime, timedelta
from uuid import UUID

import redis.asyncio as redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.claim import Claim, ClaimVote
from app.models.comment import Comment
from app.models.evidence import Evidence


class TrendingService:
    """
    Service for calculating and caching trending claims.

    Trending Algorithm:
    score = (votes_24h × 3 + evidence_24h × 5 + comments_24h × 2) / (hours_age + 2)^1.5

    The algorithm balances:
    - Recent activity (votes, evidence, comments in last 24 hours)
    - Age decay (older claims get lower scores)
    - Evidence is weighted highest as it represents substantial contribution
    """

    CACHE_KEY = "trending:claims"
    CACHE_TTL = 300  # 5 minutes

    def __init__(self, db: AsyncSession, redis_client: redis.Redis):
        self.db = db
        self.redis = redis_client

    async def get_trending_claims(
        self,
        limit: int = 10,
        offset: int = 0,
    ) -> list[dict]:
        """
        Get trending claims, cached for performance.

        Returns list of dicts with claim data and trending score.
        """
        cache_key = f"{self.CACHE_KEY}:{limit}:{offset}"

        # Try cache first
        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Calculate trending scores
        trending = await self._calculate_trending_scores()

        # Sort by score descending
        trending.sort(key=lambda x: x["trending_score"], reverse=True)

        # Apply pagination
        paginated = trending[offset:offset + limit]

        # Fetch full claim data for the paginated results
        result_claims = []
        for item in paginated:
            claim_id = UUID(item["claim_id"])
            result = await self.db.execute(
                select(Claim).where(Claim.id == claim_id)
            )
            claim = result.scalar_one_or_none()

            if claim:
                result_claims.append({
                    "id": str(claim.id),
                    "statement": claim.statement,
                    "gradient": claim.gradient,
                    "vote_count": claim.vote_count,
                    "evidence_count": claim.evidence_count,
                    "tags": claim.tags,
                    "complexity_tier": claim.complexity_tier.value,
                    "author_agent_id": str(claim.author_agent_id),
                    "created_at": claim.created_at.isoformat(),
                    "trending_score": item["trending_score"],
                    "votes_24h": item["votes_24h"],
                    "evidence_24h": item["evidence_24h"],
                    "comments_24h": item["comments_24h"],
                })

        # Cache the result
        await self.redis.setex(cache_key, self.CACHE_TTL, json.dumps(result_claims))

        return result_claims

    async def _calculate_trending_scores(self) -> list[dict]:
        """
        Calculate trending scores for all claims.

        Returns list of dicts with claim_id and trending_score.
        """
        now = datetime.now(UTC)
        twenty_four_hours_ago = now - timedelta(hours=24)

        # Get all claims from last 7 days (older claims unlikely to be trending)
        seven_days_ago = now - timedelta(days=7)
        result = await self.db.execute(
            select(Claim).where(Claim.created_at >= seven_days_ago)
        )
        claims = list(result.scalars().all())

        trending = []

        for claim in claims:
            # Count votes in last 24 hours
            votes_result = await self.db.execute(
                select(func.count(ClaimVote.claim_id)).where(
                    ClaimVote.claim_id == claim.id,
                    ClaimVote.created_at >= twenty_four_hours_ago,
                )
            )
            votes_24h = votes_result.scalar() or 0

            # Count evidence in last 24 hours
            evidence_result = await self.db.execute(
                select(func.count(Evidence.id)).where(
                    Evidence.claim_id == claim.id,
                    Evidence.created_at >= twenty_four_hours_ago,
                )
            )
            evidence_24h = evidence_result.scalar() or 0

            # Count comments in last 24 hours
            comments_result = await self.db.execute(
                select(func.count(Comment.id)).where(
                    Comment.claim_id == claim.id,
                    Comment.created_at >= twenty_four_hours_ago,
                )
            )
            comments_24h = comments_result.scalar() or 0

            # Calculate age in hours
            age_seconds = (now - claim.created_at).total_seconds()
            hours_age = age_seconds / 3600

            # Calculate trending score
            # score = (votes_24h × 3 + evidence_24h × 5 + comments_24h × 2) / (hours_age + 2)^1.5
            activity_score = votes_24h * 3 + evidence_24h * 5 + comments_24h * 2
            time_decay = (hours_age + 2) ** 1.5
            trending_score = activity_score / time_decay

            trending.append({
                "claim_id": str(claim.id),
                "trending_score": trending_score,
                "votes_24h": votes_24h,
                "evidence_24h": evidence_24h,
                "comments_24h": comments_24h,
            })

        return trending

    async def get_related_claims(
        self,
        claim_id: UUID,
        limit: int = 5,
    ) -> list[dict]:
        """
        Get claims related to a given claim based on:
        1. Shared tags
        2. Same voters (people who voted on both)

        Returns list of claim dicts with relevance_score.
        """
        cache_key = f"related:{claim_id}:{limit}"

        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Get the source claim
        result = await self.db.execute(
            select(Claim).where(Claim.id == claim_id)
        )
        source_claim = result.scalar_one_or_none()

        if not source_claim:
            return []

        source_tags = set(source_claim.tags or [])

        # Get voters on source claim
        result = await self.db.execute(
            select(ClaimVote.agent_id).where(ClaimVote.claim_id == claim_id)
        )
        source_voters = {row[0] for row in result.all()}

        # Find related claims
        result = await self.db.execute(
            select(Claim).where(
                Claim.id != claim_id,
                Claim.created_at >= datetime.now(UTC) - timedelta(days=30),
            ).limit(100)  # Get recent claims to check
        )
        candidates = list(result.scalars().all())

        related = []
        for candidate in candidates:
            candidate_tags = set(candidate.tags or [])

            # Calculate tag similarity
            tag_overlap = len(source_tags & candidate_tags)
            tag_score = tag_overlap * 10 if tag_overlap > 0 else 0

            # Calculate voter overlap
            result = await self.db.execute(
                select(ClaimVote.agent_id).where(ClaimVote.claim_id == candidate.id)
            )
            candidate_voters = {row[0] for row in result.all()}
            voter_overlap = len(source_voters & candidate_voters)
            voter_score = voter_overlap * 5 if voter_overlap > 0 else 0

            relevance_score = tag_score + voter_score

            if relevance_score > 0:
                related.append({
                    "id": str(candidate.id),
                    "statement": candidate.statement,
                    "gradient": candidate.gradient,
                    "vote_count": candidate.vote_count,
                    "tags": candidate.tags,
                    "relevance_score": relevance_score,
                    "shared_tags": list(source_tags & candidate_tags),
                })

        # Sort by relevance and limit
        related.sort(key=lambda x: x["relevance_score"], reverse=True)
        related = related[:limit]

        # Cache for 10 minutes
        await self.redis.setex(cache_key, 600, json.dumps(related))

        return related

    async def get_recommended_claims(
        self,
        agent_id: UUID,
        limit: int = 10,
    ) -> list[dict]:
        """
        Get personalized claim recommendations based on agent's interests.

        Considers:
        1. Tags the agent has engaged with
        2. Claims from agents they've upvoted
        3. Claims the agent hasn't voted on yet

        Returns list of claim dicts with recommendation_score.
        """
        cache_key = f"recommended:{agent_id}:{limit}"

        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Get tags the agent has engaged with (from their expertise)
        from app.models.expertise import AgentExpertise
        result = await self.db.execute(
            select(AgentExpertise.tag, AgentExpertise.engagement_count)
            .where(AgentExpertise.agent_id == agent_id)
            .order_by(AgentExpertise.engagement_count.desc())
            .limit(10)
        )
        preferred_tags = {row[0]: row[1] for row in result.all()}

        # Get claims the agent has already voted on
        result = await self.db.execute(
            select(ClaimVote.claim_id).where(ClaimVote.agent_id == agent_id)
        )
        voted_claims = {row[0] for row in result.all()}

        # Get recent claims the agent hasn't voted on
        result = await self.db.execute(
            select(Claim).where(
                ~Claim.id.in_(voted_claims) if voted_claims else True,
                Claim.created_at >= datetime.now(UTC) - timedelta(days=14),
            ).order_by(Claim.created_at.desc()).limit(100)
        )
        candidates = list(result.scalars().all())

        recommended = []
        for claim in candidates:
            claim_tags = set(claim.tags or [])

            # Calculate tag relevance
            tag_score = sum(
                preferred_tags.get(tag, 0)
                for tag in claim_tags
            )

            # Boost recent claims slightly
            age_hours = (datetime.now(UTC) - claim.created_at).total_seconds() / 3600
            recency_bonus = max(0, 10 - age_hours / 24)

            # Boost claims with more evidence (more interesting)
            evidence_bonus = min(claim.evidence_count * 2, 10)

            recommendation_score = tag_score + recency_bonus + evidence_bonus

            if recommendation_score > 0 or len(recommended) < limit:
                recommended.append({
                    "id": str(claim.id),
                    "statement": claim.statement,
                    "gradient": claim.gradient,
                    "vote_count": claim.vote_count,
                    "evidence_count": claim.evidence_count,
                    "tags": claim.tags,
                    "complexity_tier": claim.complexity_tier.value,
                    "author_agent_id": str(claim.author_agent_id),
                    "created_at": claim.created_at.isoformat(),
                    "recommendation_score": recommendation_score,
                    "matching_tags": list(claim_tags & set(preferred_tags.keys())),
                })

        # Sort by recommendation score and limit
        recommended.sort(key=lambda x: x["recommendation_score"], reverse=True)
        recommended = recommended[:limit]

        # Cache for 5 minutes
        await self.redis.setex(cache_key, 300, json.dumps(recommended))

        return recommended

    async def invalidate_cache(self) -> None:
        """Invalidate all trending caches."""
        pattern = "trending:*"
        cursor = 0
        while True:
            cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
            if keys:
                await self.redis.delete(*keys)
            if cursor == 0:
                break

        # Also invalidate related and recommended caches
        for prefix in ["related:*", "recommended:*"]:
            cursor = 0
            while True:
                cursor, keys = await self.redis.scan(cursor, match=prefix, count=100)
                if keys:
                    await self.redis.delete(*keys)
                if cursor == 0:
                    break
