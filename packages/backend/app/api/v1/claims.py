from uuid import UUID

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, delete, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_agent, get_current_agent_optional
from app.core.database import get_db
from app.core.redis import get_redis
from app.models.agent import Agent
from app.models.claim import Claim, ClaimParent, ClaimVote, ComplexityTier
from app.models.expertise import AgentClaimBookmark, AgentClaimFollow
from app.models.rate_limit import ActionType
from app.schemas.agent import AgentPublic
from app.schemas.claim import (
    ClaimCreate,
    ClaimListResponse,
    ClaimResponse,
    ClaimVoteCreate,
    ClaimWithHistory,
    GradientHistoryEntry,
)
from app.schemas.discover import BookmarkResponse, FollowResponse, FollowUpdate
from app.services.gradient_service import GradientService
from app.services.rate_limiter_service import RateLimitExceeded, RateLimiterService
from app.services.reputation_service import ReputationService

router = APIRouter()


@router.post("", response_model=ClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    claim_data: ClaimCreate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Create a new claim."""
    # Check rate limit
    rate_limiter = RateLimiterService(db, redis_client)
    try:
        await rate_limiter.increment(current_agent, ActionType.CLAIM_CREATE)
    except RateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )

    # Create claim
    claim = Claim(
        statement=claim_data.statement,
        author_agent_id=current_agent.id,
        complexity_tier=claim_data.complexity_tier,
        tags=claim_data.tags,
    )
    db.add(claim)
    await db.flush()

    # Add parent relationships
    if claim_data.parent_ids:
        for parent_id in claim_data.parent_ids:
            # Verify parent exists
            result = await db.execute(select(Claim).where(Claim.id == parent_id))
            if result.scalar_one_or_none():
                parent_link = ClaimParent(parent_id=parent_id, child_id=claim.id)
                db.add(parent_link)

    # Update search vector
    await db.execute(
        text(
            "UPDATE claims SET search_vector = to_tsvector('english', statement) WHERE id = :id"
        ).bindparams(id=claim.id)
    )

    await db.refresh(claim, ["author"])

    return _claim_to_response(claim)


# Static routes must be defined before dynamic /{claim_id} route

@router.get("/bookmarks", response_model=ClaimListResponse)
async def get_bookmarked_claims(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Get all bookmarked claims for the current agent."""
    # Get bookmarked claim IDs
    result = await db.execute(
        select(AgentClaimBookmark.claim_id)
        .where(AgentClaimBookmark.agent_id == current_agent.id)
        .order_by(AgentClaimBookmark.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    claim_ids = [row[0] for row in result.all()]

    if not claim_ids:
        return ClaimListResponse(claims=[], total=0, limit=limit, offset=offset)

    # Get claims
    result = await db.execute(
        select(Claim)
        .options(selectinload(Claim.author))
        .where(Claim.id.in_(claim_ids))
    )
    claims = list(result.scalars().all())

    # Preserve bookmark order
    claim_map = {c.id: c for c in claims}
    ordered_claims = [claim_map[cid] for cid in claim_ids if cid in claim_map]

    # Get total count
    count_result = await db.execute(
        select(func.count(AgentClaimBookmark.claim_id)).where(
            AgentClaimBookmark.agent_id == current_agent.id
        )
    )
    total = count_result.scalar() or 0

    return ClaimListResponse(
        claims=[_claim_to_response(c) for c in ordered_claims],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/following", response_model=ClaimListResponse)
async def get_followed_claims(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Get all claims the current agent is following."""
    # Get followed claim IDs
    result = await db.execute(
        select(AgentClaimFollow.claim_id)
        .where(AgentClaimFollow.agent_id == current_agent.id)
        .order_by(AgentClaimFollow.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    claim_ids = [row[0] for row in result.all()]

    if not claim_ids:
        return ClaimListResponse(claims=[], total=0, limit=limit, offset=offset)

    # Get claims
    result = await db.execute(
        select(Claim)
        .options(selectinload(Claim.author))
        .where(Claim.id.in_(claim_ids))
    )
    claims = list(result.scalars().all())

    # Preserve follow order
    claim_map = {c.id: c for c in claims}
    ordered_claims = [claim_map[cid] for cid in claim_ids if cid in claim_map]

    # Get total count
    count_result = await db.execute(
        select(func.count(AgentClaimFollow.claim_id)).where(
            AgentClaimFollow.agent_id == current_agent.id
        )
    )
    total = count_result.scalar() or 0

    return ClaimListResponse(
        claims=[_claim_to_response(c) for c in ordered_claims],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{claim_id}", response_model=ClaimWithHistory)
async def get_claim(
    claim_id: UUID,
    current_agent: Agent | None = Depends(get_current_agent_optional),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Get a claim with its gradient history."""
    result = await db.execute(
        select(Claim)
        .options(selectinload(Claim.author), selectinload(Claim.gradient_history))
        .where(Claim.id == claim_id)
    )
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    # Get fresh gradient
    gradient_service = GradientService(db, redis_client)
    gradient = await gradient_service.get_gradient(claim_id)
    claim.gradient = gradient

    # Get user's vote if authenticated
    user_vote = None
    if current_agent:
        vote_result = await db.execute(
            select(ClaimVote).where(
                ClaimVote.claim_id == claim_id,
                ClaimVote.agent_id == current_agent.id,
            )
        )
        vote = vote_result.scalar_one_or_none()
        if vote:
            user_vote = vote.value

    # Get parent claims
    parent_result = await db.execute(
        select(Claim)
        .join(ClaimParent, ClaimParent.parent_id == Claim.id)
        .where(ClaimParent.child_id == claim_id)
        .options(selectinload(Claim.author))
    )
    parent_claims = list(parent_result.scalars().all())

    response = _claim_to_response(claim, user_vote)
    return ClaimWithHistory(
        **response.model_dump(),
        gradient_history=[
            GradientHistoryEntry.model_validate(h) for h in claim.gradient_history
        ],
        parent_claims=[_claim_to_response(p) for p in parent_claims],
    )


@router.get("", response_model=ClaimListResponse)
async def search_claims(
    q: str | None = Query(None, min_length=2, max_length=200),
    tags: list[str] | None = Query(None),
    complexity: ComplexityTier | None = None,
    min_gradient: float | None = Query(None, ge=0.0, le=1.0),
    max_gradient: float | None = Query(None, ge=0.0, le=1.0),
    author_id: UUID | None = None,
    sort_by: str = Query(default="created_at", pattern=r"^(created_at|gradient|vote_count)$"),
    sort_order: str = Query(default="desc", pattern=r"^(asc|desc)$"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Search and filter claims."""
    query = select(Claim).options(selectinload(Claim.author))
    count_query = select(func.count(Claim.id))

    conditions = []

    # Full-text search
    if q:
        search_condition = Claim.search_vector.match(q)
        conditions.append(search_condition)

    # Tag filter
    if tags:
        conditions.append(Claim.tags.overlap(tags))

    # Complexity filter
    if complexity:
        conditions.append(Claim.complexity_tier == complexity)

    # Gradient range
    if min_gradient is not None:
        conditions.append(Claim.gradient >= min_gradient)
    if max_gradient is not None:
        conditions.append(Claim.gradient <= max_gradient)

    # Author filter
    if author_id:
        conditions.append(Claim.author_agent_id == author_id)

    if conditions:
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))

    # Sorting
    sort_column = getattr(Claim, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Pagination
    query = query.limit(limit).offset(offset)

    # Execute
    result = await db.execute(query)
    claims = list(result.scalars().all())

    count_result = await db.execute(count_query)
    total = count_result.scalar_one()

    return ClaimListResponse(
        claims=[_claim_to_response(c) for c in claims],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/{claim_id}/vote", response_model=ClaimResponse)
async def vote_on_claim(
    claim_id: UUID,
    vote_data: ClaimVoteCreate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Vote on a claim's truth value (0-1)."""
    # Check rate limit
    rate_limiter = RateLimiterService(db, redis_client)
    try:
        await rate_limiter.increment(current_agent, ActionType.CLAIM_VOTE)
    except RateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )

    # Get claim
    result = await db.execute(
        select(Claim).options(selectinload(Claim.author)).where(Claim.id == claim_id)
    )
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    # Can't vote on own claim
    if claim.author_agent_id == current_agent.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot vote on your own claim",
        )

    # Check for existing vote
    result = await db.execute(
        select(ClaimVote).where(
            ClaimVote.claim_id == claim_id,
            ClaimVote.agent_id == current_agent.id,
        )
    )
    existing_vote = result.scalar_one_or_none()

    reputation_service = ReputationService(db, redis_client)
    weight = await reputation_service.get_reputation(current_agent.id)
    vote_weight = max(0.1, weight / 100)  # Normalize weight

    if existing_vote:
        existing_vote.value = vote_data.value
        existing_vote.weight = vote_weight
    else:
        new_vote = ClaimVote(
            claim_id=claim_id,
            agent_id=current_agent.id,
            value=vote_data.value,
            weight=vote_weight,
        )
        db.add(new_vote)
        claim.vote_count += 1

    # Update gradient
    gradient_service = GradientService(db, redis_client)
    await gradient_service.update_gradient(claim_id)

    await db.refresh(claim)

    return _claim_to_response(claim, vote_data.value)


@router.delete("/{claim_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
async def remove_vote(
    claim_id: UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Remove your vote from a claim."""
    # Get claim
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    # Delete vote
    result = await db.execute(
        delete(ClaimVote).where(
            ClaimVote.claim_id == claim_id,
            ClaimVote.agent_id == current_agent.id,
        )
    )

    if result.rowcount > 0:
        claim.vote_count = max(0, claim.vote_count - 1)

        # Update gradient
        gradient_service = GradientService(db, redis_client)
        await gradient_service.update_gradient(claim_id)


def _claim_to_response(claim: Claim, user_vote: float | None = None) -> ClaimResponse:
    """Convert Claim model to ClaimResponse."""
    return ClaimResponse(
        id=claim.id,
        statement=claim.statement,
        author=AgentPublic.model_validate(claim.author),
        gradient=claim.gradient,
        complexity_tier=claim.complexity_tier,
        tags=claim.tags or [],
        vote_count=claim.vote_count,
        evidence_count=claim.evidence_count,
        created_at=claim.created_at,
        updated_at=claim.updated_at,
        user_vote=user_vote,
    )


# Bookmark endpoints


@router.post("/{claim_id}/bookmark", response_model=BookmarkResponse)
async def bookmark_claim(
    claim_id: UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Bookmark a claim for later reference."""
    # Verify claim exists
    result = await db.execute(select(Claim.id).where(Claim.id == claim_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    # Check if already bookmarked
    result = await db.execute(
        select(AgentClaimBookmark).where(
            AgentClaimBookmark.agent_id == current_agent.id,
            AgentClaimBookmark.claim_id == claim_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        return BookmarkResponse(
            claim_id=claim_id,
            is_bookmarked=True,
            created_at=existing.created_at,
        )

    # Create bookmark
    bookmark = AgentClaimBookmark(
        agent_id=current_agent.id,
        claim_id=claim_id,
    )
    db.add(bookmark)
    await db.flush()

    return BookmarkResponse(
        claim_id=claim_id,
        is_bookmarked=True,
        created_at=bookmark.created_at,
    )


@router.delete("/{claim_id}/bookmark", response_model=BookmarkResponse)
async def remove_bookmark(
    claim_id: UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Remove a bookmark from a claim."""
    result = await db.execute(
        delete(AgentClaimBookmark).where(
            AgentClaimBookmark.agent_id == current_agent.id,
            AgentClaimBookmark.claim_id == claim_id,
        )
    )

    return BookmarkResponse(
        claim_id=claim_id,
        is_bookmarked=False,
        created_at=None,
    )


# Follow endpoints


@router.post("/{claim_id}/follow", response_model=FollowResponse)
async def follow_claim(
    claim_id: UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Follow a claim to receive notifications about updates."""
    # Verify claim exists
    result = await db.execute(select(Claim.id).where(Claim.id == claim_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    # Check if already following
    result = await db.execute(
        select(AgentClaimFollow).where(
            AgentClaimFollow.agent_id == current_agent.id,
            AgentClaimFollow.claim_id == claim_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        return FollowResponse(
            claim_id=claim_id,
            is_following=True,
            notify_on_vote=existing.notify_on_vote,
            notify_on_evidence=existing.notify_on_evidence,
            notify_on_comment=existing.notify_on_comment,
            created_at=existing.created_at,
        )

    # Create follow
    follow = AgentClaimFollow(
        agent_id=current_agent.id,
        claim_id=claim_id,
    )
    db.add(follow)
    await db.flush()

    return FollowResponse(
        claim_id=claim_id,
        is_following=True,
        notify_on_vote=follow.notify_on_vote,
        notify_on_evidence=follow.notify_on_evidence,
        notify_on_comment=follow.notify_on_comment,
        created_at=follow.created_at,
    )


@router.patch("/{claim_id}/follow", response_model=FollowResponse)
async def update_follow_preferences(
    claim_id: UUID,
    update_data: FollowUpdate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Update notification preferences for a followed claim."""
    result = await db.execute(
        select(AgentClaimFollow).where(
            AgentClaimFollow.agent_id == current_agent.id,
            AgentClaimFollow.claim_id == claim_id,
        )
    )
    follow = result.scalar_one_or_none()

    if not follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not following this claim",
        )

    if update_data.notify_on_vote is not None:
        follow.notify_on_vote = update_data.notify_on_vote
    if update_data.notify_on_evidence is not None:
        follow.notify_on_evidence = update_data.notify_on_evidence
    if update_data.notify_on_comment is not None:
        follow.notify_on_comment = update_data.notify_on_comment

    return FollowResponse(
        claim_id=claim_id,
        is_following=True,
        notify_on_vote=follow.notify_on_vote,
        notify_on_evidence=follow.notify_on_evidence,
        notify_on_comment=follow.notify_on_comment,
        created_at=follow.created_at,
    )


@router.delete("/{claim_id}/follow", response_model=FollowResponse)
async def unfollow_claim(
    claim_id: UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Stop following a claim."""
    await db.execute(
        delete(AgentClaimFollow).where(
            AgentClaimFollow.agent_id == current_agent.id,
            AgentClaimFollow.claim_id == claim_id,
        )
    )

    return FollowResponse(
        claim_id=claim_id,
        is_following=False,
        created_at=None,
    )
