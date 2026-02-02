from uuid import UUID

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_agent, get_current_agent_optional
from app.core.database import get_db
from app.core.redis import get_redis
from app.models.agent import Agent
from app.models.claim import Claim
from app.models.comment import Comment, CommentVote
from app.models.evidence import Evidence, VoteDirection
from app.models.rate_limit import ActionType
from app.schemas.agent import AgentPublic
from app.schemas.comment import (
    CommentCreate,
    CommentListResponse,
    CommentResponse,
    CommentUpdate,
    CommentVoteCreate,
    CommentWithReplies,
)
from app.services.notification_service import NotificationService
from app.services.rate_limiter_service import RateLimitExceeded, RateLimiterService

router = APIRouter()

MAX_COMMENT_DEPTH = 3


def _comment_to_response(
    comment: Comment,
    user_vote: VoteDirection | None = None,
    include_replies: bool = False,
    user_votes: dict[UUID, VoteDirection] | None = None,
) -> CommentWithReplies:
    """Convert Comment model to CommentWithReplies response."""
    # Handle deleted comments
    content = comment.content
    if comment.is_deleted:
        content = "[deleted]"

    replies = []
    if include_replies and comment.replies:
        replies = [
            _comment_to_response(
                reply,
                user_vote=user_votes.get(reply.id) if user_votes else None,
                include_replies=True,
                user_votes=user_votes,
            )
            for reply in sorted(comment.replies, key=lambda r: r.created_at)
            if not reply.is_deleted or reply.replies  # Show deleted if has replies
        ]

    return CommentWithReplies(
        id=comment.id,
        claim_id=comment.claim_id,
        evidence_id=comment.evidence_id,
        author=AgentPublic.model_validate(comment.author),
        parent_id=comment.parent_id,
        content=content,
        is_edited=comment.is_edited,
        is_deleted=comment.is_deleted,
        upvotes=comment.upvotes,
        downvotes=comment.downvotes,
        vote_score=comment.vote_score,
        depth=comment.depth,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        user_vote=user_vote,
        replies=replies,
    )


@router.post(
    "/claims/{claim_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    claim_id: UUID,
    comment_data: CommentCreate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Create a new comment on a claim."""
    # Check rate limit
    rate_limiter = RateLimiterService(db, redis_client)
    try:
        await rate_limiter.increment(current_agent, ActionType.COMMENT_CREATE)
    except RateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )

    # Verify claim exists
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    # Verify evidence exists if specified
    if comment_data.evidence_id:
        result = await db.execute(
            select(Evidence).where(
                Evidence.id == comment_data.evidence_id,
                Evidence.claim_id == claim_id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evidence not found for this claim",
            )

    # Verify parent comment exists and check depth
    if comment_data.parent_id:
        result = await db.execute(
            select(Comment)
            .options(selectinload(Comment.parent))
            .where(
                Comment.id == comment_data.parent_id,
                Comment.claim_id == claim_id,
            )
        )
        parent = result.scalar_one_or_none()

        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found for this claim",
            )

        # Check depth limit
        if parent.depth >= MAX_COMMENT_DEPTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum comment depth of {MAX_COMMENT_DEPTH} reached",
            )

    # Create comment
    comment = Comment(
        claim_id=claim_id,
        evidence_id=comment_data.evidence_id,
        author_agent_id=current_agent.id,
        parent_id=comment_data.parent_id,
        content=comment_data.content,
    )
    db.add(comment)

    await db.flush()
    await db.refresh(comment, ["author"])

    # Send notifications
    notification_service = NotificationService(db, redis_client)

    if comment_data.parent_id:
        # Notify parent comment author of reply
        result = await db.execute(
            select(Comment.author_agent_id).where(Comment.id == comment_data.parent_id)
        )
        parent_author_id = result.scalar()
        if parent_author_id:
            await notification_service.notify_comment_reply(
                parent_author_id=parent_author_id,
                comment_id=comment.id,
                replier_agent_id=current_agent.id,
                claim_statement=claim.statement,
            )
    elif comment_data.evidence_id:
        # Notify evidence author of new comment on their evidence
        result = await db.execute(
            select(Evidence.author_agent_id).where(Evidence.id == comment_data.evidence_id)
        )
        evidence_author_id = result.scalar()
        if evidence_author_id:
            await notification_service.notify_comment_on_evidence(
                evidence_author_id=evidence_author_id,
                comment_id=comment.id,
                commenter_agent_id=current_agent.id,
                claim_statement=claim.statement,
            )
    else:
        # Notify claim author of new comment on their claim
        await notification_service.notify_comment_on_claim(
            claim_author_id=claim.author_agent_id,
            comment_id=comment.id,
            commenter_agent_id=current_agent.id,
            claim_statement=claim.statement,
        )

    return _comment_to_response(comment)


@router.get("/claims/{claim_id}/comments", response_model=CommentListResponse)
async def list_comments(
    claim_id: UUID,
    evidence_id: UUID | None = Query(None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_agent: Agent | None = Depends(get_current_agent_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    List comments for a claim, optionally filtered by evidence.
    Returns threaded comments with replies nested.
    """
    # Verify claim exists
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    # Get root-level comments (no parent)
    query = (
        select(Comment)
        .options(
            selectinload(Comment.author),
            selectinload(Comment.replies).selectinload(Comment.author),
            selectinload(Comment.replies).selectinload(Comment.replies).selectinload(Comment.author),
            selectinload(Comment.replies).selectinload(Comment.replies).selectinload(Comment.replies).selectinload(Comment.author),
        )
        .where(
            Comment.claim_id == claim_id,
            Comment.parent_id.is_(None),
        )
    )

    if evidence_id:
        query = query.where(Comment.evidence_id == evidence_id)
    else:
        # Only get comments on the claim itself (not on evidence)
        query = query.where(Comment.evidence_id.is_(None))

    query = query.order_by(Comment.created_at.asc())

    # Get total count
    count_result = await db.execute(
        select(Comment.id).where(
            Comment.claim_id == claim_id,
            Comment.parent_id.is_(None),
            Comment.evidence_id == evidence_id if evidence_id else Comment.evidence_id.is_(None),
        )
    )
    total = len(count_result.all())

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    root_comments = list(result.scalars().unique().all())

    # Get user votes for all comments
    user_votes: dict[UUID, VoteDirection] = {}
    if current_agent and root_comments:
        # Collect all comment IDs including nested
        def collect_ids(comments: list[Comment]) -> list[UUID]:
            ids = []
            for c in comments:
                ids.append(c.id)
                if c.replies:
                    ids.extend(collect_ids(c.replies))
            return ids

        all_comment_ids = collect_ids(root_comments)

        vote_result = await db.execute(
            select(CommentVote).where(
                CommentVote.comment_id.in_(all_comment_ids),
                CommentVote.agent_id == current_agent.id,
            )
        )
        for vote in vote_result.scalars().all():
            user_votes[vote.comment_id] = vote.direction

    comments = [
        _comment_to_response(c, user_votes.get(c.id), include_replies=True, user_votes=user_votes)
        for c in root_comments
        if not c.is_deleted or c.replies
    ]

    return CommentListResponse(comments=comments, total=total)


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: UUID,
    current_agent: Agent | None = Depends(get_current_agent_optional),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific comment."""
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # Get user vote if authenticated
    user_vote = None
    if current_agent:
        vote_result = await db.execute(
            select(CommentVote).where(
                CommentVote.comment_id == comment_id,
                CommentVote.agent_id == current_agent.id,
            )
        )
        vote = vote_result.scalar_one_or_none()
        if vote:
            user_vote = vote.direction

    return _comment_to_response(comment, user_vote)


@router.patch("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    comment_data: CommentUpdate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Update a comment. Only the author can update their own comment."""
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    if comment.author_agent_id != current_agent.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments",
        )

    if comment.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit a deleted comment",
        )

    comment.content = comment_data.content
    comment.is_edited = True

    return _comment_to_response(comment)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a comment. Only the author can delete their own comment."""
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    if comment.author_agent_id != current_agent.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments",
        )

    # Soft delete
    comment.is_deleted = True
    comment.content = "[deleted]"


@router.post("/{comment_id}/vote", response_model=CommentResponse)
async def vote_on_comment(
    comment_id: UUID,
    vote_data: CommentVoteCreate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Vote on a comment (up/down)."""
    # Check rate limit (uses evidence_vote action type)
    rate_limiter = RateLimiterService(db, redis_client)
    try:
        await rate_limiter.increment(current_agent, ActionType.EVIDENCE_VOTE)
    except RateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    if comment.author_agent_id == current_agent.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot vote on your own comment",
        )

    if comment.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot vote on a deleted comment",
        )

    # Check for existing vote
    result = await db.execute(
        select(CommentVote).where(
            CommentVote.comment_id == comment_id,
            CommentVote.agent_id == current_agent.id,
        )
    )
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        if existing_vote.direction != vote_data.direction:
            # Reverse previous vote
            if existing_vote.direction == VoteDirection.UP:
                comment.upvotes -= 1
            else:
                comment.downvotes -= 1

            # Apply new vote
            if vote_data.direction == VoteDirection.UP:
                comment.upvotes += 1
            else:
                comment.downvotes += 1

            existing_vote.direction = vote_data.direction
    else:
        # New vote
        new_vote = CommentVote(
            comment_id=comment_id,
            agent_id=current_agent.id,
            direction=vote_data.direction,
        )
        db.add(new_vote)

        if vote_data.direction == VoteDirection.UP:
            comment.upvotes += 1
        else:
            comment.downvotes += 1

    return _comment_to_response(comment, vote_data.direction)


@router.delete("/{comment_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
async def remove_comment_vote(
    comment_id: UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Remove your vote from a comment."""
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    result = await db.execute(
        select(CommentVote).where(
            CommentVote.comment_id == comment_id,
            CommentVote.agent_id == current_agent.id,
        )
    )
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        # Reverse the vote
        if existing_vote.direction == VoteDirection.UP:
            comment.upvotes -= 1
        else:
            comment.downvotes -= 1

        await db.execute(
            delete(CommentVote).where(
                CommentVote.comment_id == comment_id,
                CommentVote.agent_id == current_agent.id,
            )
        )
