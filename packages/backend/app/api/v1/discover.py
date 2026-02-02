from datetime import UTC, datetime, timedelta
from uuid import UUID

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_agent, get_current_agent_optional
from app.core.database import get_db
from app.core.redis import get_redis
from app.models.agent import Agent
from app.models.claim import Claim, ClaimVote
from app.models.comment import Comment
from app.models.evidence import Evidence
from app.schemas.discover import (
    ActivityFeedResponse,
    ActivityItem,
    RecommendedClaim,
    RecommendedResponse,
    RelatedClaim,
    RelatedClaimsResponse,
    TopicClaimsResponse,
    TopicInfo,
    TopicsResponse,
    TrendingClaim,
    TrendingResponse,
)
from app.services.trending_service import TrendingService

router = APIRouter()


@router.get("/trending", response_model=TrendingResponse)
async def get_trending_claims(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get trending claims based on recent activity.

    Trending score considers votes, evidence, and comments in the last 24 hours,
    with time decay for older claims.
    """
    trending_service = TrendingService(db, redis_client)
    trending_data = await trending_service.get_trending_claims(limit=limit, offset=offset)

    claims = [
        TrendingClaim(
            id=UUID(c["id"]),
            statement=c["statement"],
            gradient=c["gradient"],
            vote_count=c["vote_count"],
            evidence_count=c["evidence_count"],
            tags=c["tags"],
            complexity_tier=c["complexity_tier"],
            author_agent_id=UUID(c["author_agent_id"]),
            created_at=datetime.fromisoformat(c["created_at"]),
            trending_score=c["trending_score"],
            votes_24h=c["votes_24h"],
            evidence_24h=c["evidence_24h"],
            comments_24h=c["comments_24h"],
        )
        for c in trending_data
    ]

    return TrendingResponse(
        claims=claims,
        updated_at=datetime.now(UTC),
    )


@router.get("/related/{claim_id}", response_model=RelatedClaimsResponse)
async def get_related_claims(
    claim_id: UUID,
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get claims related to a specific claim.

    Relatedness is based on shared tags and common voters.
    """
    # Verify claim exists
    result = await db.execute(select(Claim.id).where(Claim.id == claim_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    trending_service = TrendingService(db, redis_client)
    related_data = await trending_service.get_related_claims(claim_id, limit=limit)

    related = [
        RelatedClaim(
            id=UUID(c["id"]),
            statement=c["statement"],
            gradient=c["gradient"],
            vote_count=c["vote_count"],
            tags=c["tags"],
            relevance_score=c["relevance_score"],
            shared_tags=c["shared_tags"],
        )
        for c in related_data
    ]

    return RelatedClaimsResponse(
        source_claim_id=claim_id,
        related=related,
    )


@router.get("/recommended", response_model=RecommendedResponse)
async def get_recommended_claims(
    limit: int = Query(default=10, ge=1, le=50),
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get personalized claim recommendations based on user interests.

    Requires authentication. Recommendations are based on:
    - Tags the user has engaged with
    - Claims they haven't voted on yet
    """
    trending_service = TrendingService(db, redis_client)
    recommended_data = await trending_service.get_recommended_claims(
        current_agent.id, limit=limit
    )

    # Get user's preferred tags for response
    from app.models.expertise import AgentExpertise
    result = await db.execute(
        select(AgentExpertise.tag)
        .where(AgentExpertise.agent_id == current_agent.id)
        .order_by(AgentExpertise.engagement_count.desc())
        .limit(5)
    )
    preferred_tags = [row[0] for row in result.all()]

    claims = [
        RecommendedClaim(
            id=UUID(c["id"]),
            statement=c["statement"],
            gradient=c["gradient"],
            vote_count=c["vote_count"],
            evidence_count=c["evidence_count"],
            tags=c["tags"],
            complexity_tier=c["complexity_tier"],
            author_agent_id=UUID(c["author_agent_id"]),
            created_at=datetime.fromisoformat(c["created_at"]),
            recommendation_score=c["recommendation_score"],
            matching_tags=c["matching_tags"],
        )
        for c in recommended_data
    ]

    return RecommendedResponse(
        claims=claims,
        based_on_tags=preferred_tags,
    )


@router.get("/topics", response_model=TopicsResponse)
async def get_topics(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all topics/tags with claim counts.

    Returns topics sorted by total claim count.
    """
    # Get all unique tags with counts
    # Using unnest to expand the tags array and count
    result = await db.execute(
        text("""
            SELECT tag, COUNT(*) as claim_count
            FROM claims, unnest(tags) as tag
            GROUP BY tag
            ORDER BY claim_count DESC
            LIMIT :limit
        """),
        {"limit": limit}
    )
    tag_counts = result.all()

    # Get recent activity for each tag (claims in last 7 days)
    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    topics = []

    for tag, count in tag_counts:
        result = await db.execute(
            text("""
                SELECT COUNT(*) FROM claims
                WHERE :tag = ANY(tags) AND created_at >= :since
            """),
            {"tag": tag, "since": seven_days_ago}
        )
        recent_count = result.scalar() or 0

        topics.append(
            TopicInfo(
                tag=tag,
                claim_count=count,
                recent_activity=recent_count,
            )
        )

    return TopicsResponse(
        topics=topics,
        total=len(topics),
    )


@router.get("/topics/{tag}", response_model=TopicClaimsResponse)
async def get_topic_claims(
    tag: str,
    sort: str = Query(default="recent", pattern="^(recent|gradient|votes)$"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get claims for a specific topic/tag.

    Sort options: recent, gradient, votes
    """
    # Build query
    query = select(Claim).where(Claim.tags.contains([tag]))

    # Apply sorting
    if sort == "recent":
        query = query.order_by(Claim.created_at.desc())
    elif sort == "gradient":
        query = query.order_by(Claim.gradient.desc())
    elif sort == "votes":
        query = query.order_by(Claim.vote_count.desc())

    # Get total count
    count_result = await db.execute(
        select(func.count(Claim.id)).where(Claim.tags.contains([tag]))
    )
    total = count_result.scalar() or 0

    # Apply pagination
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    claims = list(result.scalars().all())

    # Convert to response format
    claim_responses = [
        TrendingClaim(
            id=c.id,
            statement=c.statement,
            gradient=c.gradient,
            vote_count=c.vote_count,
            evidence_count=c.evidence_count,
            tags=c.tags,
            complexity_tier=c.complexity_tier,
            author_agent_id=c.author_agent_id,
            created_at=c.created_at,
            trending_score=0,  # Not calculated for topic view
            votes_24h=0,
            evidence_24h=0,
            comments_24h=0,
        )
        for c in claims
    ]

    return TopicClaimsResponse(
        tag=tag,
        claims=claim_responses,
        total=total,
    )


@router.get("/activity-feed", response_model=ActivityFeedResponse)
async def get_activity_feed(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get platform-wide recent activity feed.

    Shows recent votes, evidence submissions, and comments.
    """
    items = []

    # Get recent votes (limit/3 each type)
    vote_limit = max(limit // 3, 5)

    # Recent claim votes
    result = await db.execute(
        select(ClaimVote, Claim, Agent)
        .join(Claim, ClaimVote.claim_id == Claim.id)
        .join(Agent, ClaimVote.agent_id == Agent.id)
        .order_by(ClaimVote.created_at.desc())
        .limit(vote_limit)
        .offset(offset)
    )
    for vote, claim, agent in result.all():
        items.append(
            ActivityItem(
                id=claim.id,  # Use claim ID as activity ID
                type="vote",
                claim_id=claim.id,
                claim_statement=claim.statement[:100] + ("..." if len(claim.statement) > 100 else ""),
                agent_id=agent.id,
                agent_username=agent.username,
                agent_avatar_url=agent.avatar_url,
                timestamp=vote.created_at,
                details={"vote_value": vote.value},
            )
        )

    # Recent evidence
    result = await db.execute(
        select(Evidence, Claim, Agent)
        .join(Claim, Evidence.claim_id == Claim.id)
        .join(Agent, Evidence.author_agent_id == Agent.id)
        .order_by(Evidence.created_at.desc())
        .limit(vote_limit)
        .offset(offset)
    )
    for evidence, claim, agent in result.all():
        items.append(
            ActivityItem(
                id=evidence.id,
                type="evidence",
                claim_id=claim.id,
                claim_statement=claim.statement[:100] + ("..." if len(claim.statement) > 100 else ""),
                agent_id=agent.id,
                agent_username=agent.username,
                agent_avatar_url=agent.avatar_url,
                timestamp=evidence.created_at,
                details={"position": evidence.position.value, "content_type": evidence.content_type.value},
            )
        )

    # Recent comments
    result = await db.execute(
        select(Comment, Claim, Agent)
        .join(Claim, Comment.claim_id == Claim.id)
        .join(Agent, Comment.author_agent_id == Agent.id)
        .where(Comment.is_deleted == False)  # noqa: E712
        .order_by(Comment.created_at.desc())
        .limit(vote_limit)
        .offset(offset)
    )
    for comment, claim, agent in result.all():
        items.append(
            ActivityItem(
                id=comment.id,
                type="comment",
                claim_id=claim.id,
                claim_statement=claim.statement[:100] + ("..." if len(claim.statement) > 100 else ""),
                agent_id=agent.id,
                agent_username=agent.username,
                agent_avatar_url=agent.avatar_url,
                timestamp=comment.created_at,
                details={"content_preview": comment.content[:50] + ("..." if len(comment.content) > 50 else "")},
            )
        )

    # Sort all items by timestamp
    items.sort(key=lambda x: x.timestamp, reverse=True)

    # Apply limit
    items = items[:limit]

    return ActivityFeedResponse(
        items=items,
        has_more=len(items) >= limit,
    )
