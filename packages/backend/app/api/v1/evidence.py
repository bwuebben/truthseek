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
from app.models.evidence import Evidence, EvidenceVisibility, EvidenceVote, VoteDirection
from app.models.rate_limit import ActionType
from app.schemas.agent import AgentPublic
from app.schemas.evidence import (
    EvidenceCreate,
    EvidenceListResponse,
    EvidenceResponse,
    EvidenceVoteCreate,
)
from app.services.notification_service import NotificationService
from app.services.rate_limiter_service import RateLimitExceeded, RateLimiterService
from app.services.reputation_service import ReputationService
from app.services.s3_service import S3Service, S3ServiceError
from app.schemas.evidence import FileUploadRequest, FileUploadResponse

router = APIRouter()


@router.post(
    "/claims/{claim_id}/evidence",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_evidence(
    claim_id: UUID,
    evidence_data: EvidenceCreate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Submit evidence for a claim."""
    # Check rate limit
    rate_limiter = RateLimiterService(db, redis_client)
    try:
        await rate_limiter.increment(current_agent, ActionType.EVIDENCE_SUBMIT)
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

    # Validate file upload if file evidence
    if evidence_data.file_key:
        # Verify file was uploaded by this agent for this claim
        if not evidence_data.file_key.startswith(f"evidence/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file key",
            )
        if str(current_agent.id) not in evidence_data.file_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File was not uploaded by you",
            )

    # Create evidence
    evidence = Evidence(
        claim_id=claim_id,
        author_agent_id=current_agent.id,
        position=evidence_data.position,
        content_type=evidence_data.content_type,
        content=evidence_data.content,
        file_key=evidence_data.file_key,
        file_name=evidence_data.file_name,
        file_size=evidence_data.file_size,
    )
    db.add(evidence)

    # Update claim's evidence count
    claim.evidence_count += 1

    await db.flush()
    await db.refresh(evidence, ["author"])

    return _evidence_to_response(evidence)


@router.get("/claims/{claim_id}/evidence", response_model=EvidenceListResponse)
async def list_evidence(
    claim_id: UUID,
    position: str | None = Query(None, pattern="^(supports|opposes|neutral)$"),
    sort_by: str = Query(default="vote_score", pattern="^(vote_score|created_at)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_agent: Agent | None = Depends(get_current_agent_optional),
    db: AsyncSession = Depends(get_db),
):
    """List evidence for a claim."""
    # Verify claim exists
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    query = (
        select(Evidence)
        .options(selectinload(Evidence.author))
        .where(
            Evidence.claim_id == claim_id,
            Evidence.visibility == EvidenceVisibility.PUBLIC,
        )
    )

    if position:
        query = query.where(Evidence.position == position)

    # Sorting
    sort_column = getattr(Evidence, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    evidence_list = list(result.scalars().all())

    # Get user's votes if authenticated
    user_votes = {}
    if current_agent:
        evidence_ids = [e.id for e in evidence_list]
        if evidence_ids:
            vote_result = await db.execute(
                select(EvidenceVote).where(
                    EvidenceVote.evidence_id.in_(evidence_ids),
                    EvidenceVote.agent_id == current_agent.id,
                )
            )
            for vote in vote_result.scalars().all():
                user_votes[vote.evidence_id] = vote.direction

    # Get total count
    count_result = await db.execute(
        select(Evidence.id).where(
            Evidence.claim_id == claim_id,
            Evidence.visibility == EvidenceVisibility.PUBLIC,
        )
    )
    total = len(count_result.all())

    return EvidenceListResponse(
        evidence=[
            _evidence_to_response(e, user_votes.get(e.id)) for e in evidence_list
        ],
        total=total,
    )


@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: UUID,
    current_agent: Agent | None = Depends(get_current_agent_optional),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific piece of evidence."""
    result = await db.execute(
        select(Evidence)
        .options(selectinload(Evidence.author))
        .where(Evidence.id == evidence_id)
    )
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )

    # Get user's vote if authenticated
    user_vote = None
    if current_agent:
        vote_result = await db.execute(
            select(EvidenceVote).where(
                EvidenceVote.evidence_id == evidence_id,
                EvidenceVote.agent_id == current_agent.id,
            )
        )
        vote = vote_result.scalar_one_or_none()
        if vote:
            user_vote = vote.direction

    return _evidence_to_response(evidence, user_vote)


@router.post("/{evidence_id}/vote", response_model=EvidenceResponse)
async def vote_on_evidence(
    evidence_id: UUID,
    vote_data: EvidenceVoteCreate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """Vote on evidence quality (up/down)."""
    # Check rate limit
    rate_limiter = RateLimiterService(db, redis_client)
    try:
        await rate_limiter.increment(current_agent, ActionType.EVIDENCE_VOTE)
    except RateLimitExceeded as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )

    # Get evidence
    result = await db.execute(
        select(Evidence).options(selectinload(Evidence.author)).where(Evidence.id == evidence_id)
    )
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )

    # Can't vote on own evidence
    if evidence.author_agent_id == current_agent.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot vote on your own evidence",
        )

    # Check for existing vote
    result = await db.execute(
        select(EvidenceVote).where(
            EvidenceVote.evidence_id == evidence_id,
            EvidenceVote.agent_id == current_agent.id,
        )
    )
    existing_vote = result.scalar_one_or_none()

    reputation_service = ReputationService(db, redis_client)
    notification_service = NotificationService(db, redis_client)

    # Get claim statement for notification
    claim_result = await db.execute(select(Claim.statement).where(Claim.id == evidence.claim_id))
    claim_statement = claim_result.scalar() or ""

    if existing_vote:
        # Handle vote change
        if existing_vote.direction != vote_data.direction:
            # Reverse previous vote
            if existing_vote.direction == VoteDirection.UP:
                evidence.upvotes -= 1
                evidence.vote_score -= 1
            else:
                evidence.downvotes -= 1
                evidence.vote_score += 1

            # Apply new vote
            if vote_data.direction == VoteDirection.UP:
                evidence.upvotes += 1
                evidence.vote_score += 1
            else:
                evidence.downvotes += 1
                evidence.vote_score -= 1

            existing_vote.direction = vote_data.direction

            # Update author reputation
            await reputation_service.on_evidence_vote(
                evidence.author_agent_id,
                evidence_id,
                vote_data.direction == VoteDirection.UP,
            )

            # Send notification for vote change
            await notification_service.notify_evidence_vote(
                evidence_author_id=evidence.author_agent_id,
                evidence_id=evidence_id,
                voter_agent_id=current_agent.id,
                is_upvote=vote_data.direction == VoteDirection.UP,
                claim_statement=claim_statement,
            )
    else:
        # New vote
        new_vote = EvidenceVote(
            evidence_id=evidence_id,
            agent_id=current_agent.id,
            direction=vote_data.direction,
        )
        db.add(new_vote)

        if vote_data.direction == VoteDirection.UP:
            evidence.upvotes += 1
            evidence.vote_score += 1
        else:
            evidence.downvotes += 1
            evidence.vote_score -= 1

        # Update author reputation
        await reputation_service.on_evidence_vote(
            evidence.author_agent_id,
            evidence_id,
            vote_data.direction == VoteDirection.UP,
        )

        # Send notification for new vote
        await notification_service.notify_evidence_vote(
            evidence_author_id=evidence.author_agent_id,
            evidence_id=evidence_id,
            voter_agent_id=current_agent.id,
            is_upvote=vote_data.direction == VoteDirection.UP,
            claim_statement=claim_statement,
        )

    # Auto-hide evidence with very low score
    if evidence.vote_score < -5:
        evidence.visibility = EvidenceVisibility.HIDDEN

    return _evidence_to_response(evidence, vote_data.direction)


@router.delete("/{evidence_id}/vote", status_code=status.HTTP_204_NO_CONTENT)
async def remove_evidence_vote(
    evidence_id: UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Remove your vote from evidence."""
    # Get evidence
    result = await db.execute(select(Evidence).where(Evidence.id == evidence_id))
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )

    # Get existing vote
    result = await db.execute(
        select(EvidenceVote).where(
            EvidenceVote.evidence_id == evidence_id,
            EvidenceVote.agent_id == current_agent.id,
        )
    )
    existing_vote = result.scalar_one_or_none()

    if existing_vote:
        # Reverse the vote
        if existing_vote.direction == VoteDirection.UP:
            evidence.upvotes -= 1
            evidence.vote_score -= 1
        else:
            evidence.downvotes -= 1
            evidence.vote_score += 1

        await db.execute(
            delete(EvidenceVote).where(
                EvidenceVote.evidence_id == evidence_id,
                EvidenceVote.agent_id == current_agent.id,
            )
        )


@router.post(
    "/claims/{claim_id}/evidence/upload-url",
    response_model=FileUploadResponse,
)
async def get_upload_url(
    claim_id: UUID,
    upload_request: FileUploadRequest,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a presigned URL for uploading a file as evidence.

    The client should:
    1. Call this endpoint to get an upload URL
    2. Upload the file directly to S3 using the URL
    3. Call POST /claims/{claim_id}/evidence with the file_key
    """
    # Verify claim exists
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found",
        )

    try:
        s3_service = S3Service()
        upload_data = s3_service.generate_upload_url(
            file_name=upload_request.file_name,
            content_type=upload_request.content_type,
            agent_id=str(current_agent.id),
            claim_id=str(claim_id),
        )

        return FileUploadResponse(
            upload_url=upload_data['upload_url'],
            fields=upload_data['fields'],
            file_key=upload_data['file_key'],
            expires_in=upload_data['expires_in'],
            max_size=upload_data['max_size'],
        )

    except S3ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{evidence_id}/download-url")
async def get_download_url(
    evidence_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a presigned URL for downloading an evidence file.
    """
    result = await db.execute(
        select(Evidence).where(Evidence.id == evidence_id)
    )
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evidence not found",
        )

    if not evidence.file_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This evidence has no file attached",
        )

    try:
        s3_service = S3Service()
        download_url = s3_service.generate_download_url(
            file_key=evidence.file_key,
            file_name=evidence.file_name,
        )

        return {"download_url": download_url, "expires_in": 3600}

    except S3ServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


def _evidence_to_response(
    evidence: Evidence, user_vote: VoteDirection | None = None
) -> EvidenceResponse:
    """Convert Evidence model to EvidenceResponse."""
    return EvidenceResponse(
        id=evidence.id,
        claim_id=evidence.claim_id,
        author=AgentPublic.model_validate(evidence.author),
        position=evidence.position,
        content_type=evidence.content_type,
        content=evidence.content,
        file_key=evidence.file_key,
        file_name=evidence.file_name,
        file_size=evidence.file_size,
        vote_score=evidence.vote_score,
        upvotes=evidence.upvotes,
        downvotes=evidence.downvotes,
        visibility=evidence.visibility,
        created_at=evidence.created_at,
        updated_at=evidence.updated_at,
        user_vote=user_vote,
    )
