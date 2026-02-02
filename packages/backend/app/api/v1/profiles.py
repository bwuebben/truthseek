from datetime import UTC, datetime, timedelta
from uuid import UUID

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.agent import Agent
from app.models.claim import Claim, ClaimVote
from app.models.comment import Comment
from app.models.evidence import Evidence, EvidenceVote
from app.models.history import ReputationHistory
from app.schemas.profile import (
    AccuracyHistoryPoint,
    AccuracyHistoryResponse,
    ExpertiseArea,
    LearningScoreData,
    ProfileResponse,
    ProfileStats,
    ReputationHistoryPoint,
    ReputationJourneyResponse,
    TimelineDataPoint,
    TimelineResponse,
)
from app.services.learning_score_service import LearningScoreService

router = APIRouter()


def _generate_insight(accuracy_rate: float | None, learning_score: float) -> str | None:
    """Generate a human-readable insight based on learning metrics."""
    if accuracy_rate is None:
        return "Keep voting on claims to build your accuracy track record."

    if accuracy_rate > 0.8:
        return "You have excellent judgment - you correctly identify claim truth values consistently."
    elif accuracy_rate > 0.65:
        return "You tend to identify true claims early and make sound judgments."
    elif accuracy_rate > 0.5:
        return "You're developing good epistemic instincts. Keep engaging to improve."
    else:
        return "Consider reviewing evidence more carefully before voting."


@router.get("/{agent_id}", response_model=ProfileResponse)
async def get_profile(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get full profile with stats, learning score, and expertise areas.
    """
    # Get agent
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Get stats
    claims_count = await db.execute(
        select(func.count(Claim.id)).where(Claim.author_agent_id == agent_id)
    )
    evidence_count = await db.execute(
        select(func.count(Evidence.id)).where(Evidence.author_agent_id == agent_id)
    )
    claim_votes_count = await db.execute(
        select(func.count()).select_from(ClaimVote).where(ClaimVote.agent_id == agent_id)
    )
    evidence_votes_count = await db.execute(
        select(func.count()).select_from(EvidenceVote).where(EvidenceVote.agent_id == agent_id)
    )

    # Get reputation rank
    result = await db.execute(
        select(func.count(Agent.id)).where(Agent.reputation_score > agent.reputation_score)
    )
    higher_count = result.scalar() or 0
    rank = higher_count + 1

    result = await db.execute(select(func.count(Agent.id)))
    total_agents = result.scalar() or 1
    percentile = ((total_agents - rank) / total_agents) * 100 if total_agents > 0 else 0

    stats = ProfileStats(
        claims_authored=claims_count.scalar_one(),
        evidence_submitted=evidence_count.scalar_one(),
        votes_cast=claim_votes_count.scalar_one() + evidence_votes_count.scalar_one(),
        reputation_rank=rank,
        total_agents=total_agents,
        percentile=round(percentile, 1),
    )

    # Get learning score and expertise
    learning_service = LearningScoreService(db, redis_client)
    learning_score = await learning_service.calculate_learning_score(agent_id)
    expertise_areas = await learning_service.get_expertise_areas(agent_id)

    learning_data = LearningScoreData(
        score=learning_score,
        accuracy_rate=agent.accuracy_rate,
        total_resolved_votes=agent.total_resolved_votes,
        correct_resolved_votes=agent.correct_resolved_votes,
        insight=_generate_insight(agent.accuracy_rate, learning_score),
    )

    expertise = [
        ExpertiseArea(
            tag=e["tag"],
            engagement_count=e["engagement_count"],
            accuracy=e["accuracy"],
        )
        for e in expertise_areas
    ]

    return ProfileResponse(
        id=agent.id,
        username=agent.username,
        display_name=agent.display_name,
        bio=agent.bio,
        avatar_url=agent.avatar_url,
        reputation_score=agent.reputation_score,
        tier=agent.tier,
        created_at=agent.created_at,
        first_activity_at=agent.first_activity_at,
        stats=stats,
        learning_score=learning_data,
        expertise=expertise,
    )


@router.get("/{agent_id}/timeline", response_model=TimelineResponse)
async def get_profile_timeline(
    agent_id: UUID,
    period: str = Query(default="30d", pattern="^(7d|30d|90d)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get contribution timeline data for charts.

    Period options: 7d, 30d, 90d
    """
    # Verify agent exists
    result = await db.execute(select(Agent.id).where(Agent.id == agent_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Calculate date range
    days = {"7d": 7, "30d": 30, "90d": 90}[period]
    end_date = datetime.now(UTC).date()
    start_date = end_date - timedelta(days=days)

    # Build data points for each day
    data_points = []
    current_date = start_date

    while current_date <= end_date:
        day_start = datetime.combine(current_date, datetime.min.time()).replace(tzinfo=UTC)
        day_end = day_start + timedelta(days=1)

        # Count claims
        claims_result = await db.execute(
            select(func.count(Claim.id)).where(
                Claim.author_agent_id == agent_id,
                Claim.created_at >= day_start,
                Claim.created_at < day_end,
            )
        )
        claims_count = claims_result.scalar() or 0

        # Count evidence
        evidence_result = await db.execute(
            select(func.count(Evidence.id)).where(
                Evidence.author_agent_id == agent_id,
                Evidence.created_at >= day_start,
                Evidence.created_at < day_end,
            )
        )
        evidence_count = evidence_result.scalar() or 0

        # Count votes
        votes_result = await db.execute(
            select(func.count()).select_from(ClaimVote).where(
                ClaimVote.agent_id == agent_id,
                ClaimVote.created_at >= day_start,
                ClaimVote.created_at < day_end,
            )
        )
        votes_count = votes_result.scalar() or 0

        # Count comments
        comments_result = await db.execute(
            select(func.count(Comment.id)).where(
                Comment.author_agent_id == agent_id,
                Comment.created_at >= day_start,
                Comment.created_at < day_end,
            )
        )
        comments_count = comments_result.scalar() or 0

        data_points.append(
            TimelineDataPoint(
                date=current_date.isoformat(),
                claims=claims_count,
                evidence=evidence_count,
                votes=votes_count,
                comments=comments_count,
            )
        )

        current_date += timedelta(days=1)

    return TimelineResponse(period=period, data=data_points)


@router.get("/{agent_id}/accuracy-history", response_model=AccuracyHistoryResponse)
async def get_accuracy_history(
    agent_id: UUID,
    period: str = Query(default="30d", pattern="^(7d|30d|90d)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get vote accuracy history for reputation journey chart.

    Shows running accuracy rate over time based on resolved claims.
    """
    # Verify agent exists
    result = await db.execute(select(Agent.id).where(Agent.id == agent_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Calculate date range
    days = {"7d": 7, "30d": 30, "90d": 90}[period]
    end_date = datetime.now(UTC).date()
    start_date = end_date - timedelta(days=days)

    # Get all votes with their claim gradients in the period
    result = await db.execute(
        select(ClaimVote, Claim.gradient)
        .join(Claim)
        .where(
            ClaimVote.agent_id == agent_id,
            ClaimVote.created_at >= datetime.combine(start_date, datetime.min.time()).replace(tzinfo=UTC),
            # Only consider resolved claims
            ((Claim.gradient > 0.8) | (Claim.gradient < 0.2)),
        )
        .order_by(ClaimVote.created_at)
    )
    vote_data = result.all()

    # Build cumulative accuracy data points
    data_points = []
    current_date = start_date
    total_votes = 0
    correct_votes = 0

    while current_date <= end_date:
        day_start = datetime.combine(current_date, datetime.min.time()).replace(tzinfo=UTC)
        day_end = day_start + timedelta(days=1)

        # Process votes for this day
        for vote, gradient in vote_data:
            if day_start <= vote.created_at < day_end:
                total_votes += 1
                is_correct = (
                    (vote.value > 0.5 and gradient > 0.8) or
                    (vote.value < 0.5 and gradient < 0.2)
                )
                if is_correct:
                    correct_votes += 1

        accuracy_rate = correct_votes / total_votes if total_votes > 0 else None

        data_points.append(
            AccuracyHistoryPoint(
                date=current_date.isoformat(),
                accuracy_rate=accuracy_rate,
                total_votes=total_votes,
                correct_votes=correct_votes,
            )
        )

        current_date += timedelta(days=1)

    return AccuracyHistoryResponse(period=period, data=data_points)


@router.get("/{agent_id}/reputation-journey", response_model=ReputationJourneyResponse)
async def get_reputation_journey(
    agent_id: UUID,
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    Get reputation history for journey chart.

    Returns reputation changes over time with reasons.
    """
    # Verify agent exists and get current score
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Get reputation history
    result = await db.execute(
        select(ReputationHistory)
        .where(ReputationHistory.agent_id == agent_id)
        .order_by(ReputationHistory.recorded_at.desc())
        .limit(limit)
    )
    history = list(result.scalars().all())

    history_points = [
        ReputationHistoryPoint(
            date=h.recorded_at.isoformat(),
            reputation_score=h.new_score,
            delta=h.delta,
            reason=h.reason.value if hasattr(h.reason, 'value') else str(h.reason),
        )
        for h in reversed(history)  # Reverse to show oldest first for chart
    ]

    return ReputationJourneyResponse(
        current_score=agent.reputation_score,
        history=history_points,
    )
