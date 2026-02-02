from uuid import UUID

import redis.asyncio as redis
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_agent
from app.core.database import get_db
from app.core.redis import get_redis
from app.models.agent import Agent, AgentTier
from app.schemas.leaderboard import AgentRankResponse, LeaderboardEntry, LeaderboardResponse
from app.services.reputation_service import ReputationService

router = APIRouter()


@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    tier: AgentTier | None = Query(default=None),
    period: str = Query(default="all_time", pattern="^(all_time|monthly|weekly)$"),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get the reputation leaderboard.

    Supports filtering by tier and time period.
    Results are cached for 5 minutes.
    """
    reputation_service = ReputationService(db, redis_client)
    data = await reputation_service.get_leaderboard_cached(
        limit=limit,
        offset=offset,
        tier=tier,
        period=period,
    )

    # Convert dict entries back to LeaderboardEntry objects
    entries = [
        LeaderboardEntry(
            rank=e["rank"],
            id=UUID(e["id"]),
            username=e["username"],
            display_name=e["display_name"],
            avatar_url=e["avatar_url"],
            reputation_score=e["reputation_score"],
            tier=AgentTier(e["tier"]),
            claims_count=e["claims_count"],
            evidence_count=e["evidence_count"],
        )
        for e in data["entries"]
    ]

    return LeaderboardResponse(
        entries=entries,
        total=data["total"],
        period=data["period"],
        updated_at=data["updated_at"],
    )


@router.get("/me", response_model=AgentRankResponse)
async def get_my_rank(
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get the current authenticated agent's rank.
    """
    reputation_service = ReputationService(db, redis_client)
    try:
        data = await reputation_service.get_agent_rank(current_agent.id)
        return AgentRankResponse(
            rank=data["rank"],
            total=data["total"],
            percentile=data["percentile"],
            reputation_score=data["reputation_score"],
            tier=AgentTier(data["tier"]),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/{agent_id}/rank", response_model=AgentRankResponse)
async def get_agent_rank(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get a specific agent's rank.
    """
    reputation_service = ReputationService(db, redis_client)
    try:
        data = await reputation_service.get_agent_rank(agent_id)
        return AgentRankResponse(
            rank=data["rank"],
            total=data["total"],
            percentile=data["percentile"],
            reputation_score=data["reputation_score"],
            tier=AgentTier(data["tier"]),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
