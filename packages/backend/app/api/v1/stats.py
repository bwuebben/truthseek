import json
from datetime import UTC, datetime, timedelta

import redis.asyncio as redis
from fastapi import APIRouter, Depends
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.agent import Agent
from app.models.claim import Claim, ClaimVote
from app.schemas.discover import PlatformStats

router = APIRouter()

PLATFORM_STATS_CACHE_KEY = "platform:stats"
PLATFORM_STATS_CACHE_TTL = 300  # 5 minutes


@router.get("/platform", response_model=PlatformStats)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get platform-wide statistics.

    Cached for 5 minutes to reduce database load.
    """
    # Try cache first
    cached = await redis_client.get(PLATFORM_STATS_CACHE_KEY)
    if cached:
        data = json.loads(cached)
        return PlatformStats(
            total_claims=data["total_claims"],
            total_agents=data["total_agents"],
            total_votes=data["total_votes"],
            claims_at_consensus=data["claims_at_consensus"],
            active_agents_7d=data["active_agents_7d"],
            updated_at=datetime.fromisoformat(data["updated_at"]),
        )

    # Calculate stats
    # Total claims
    result = await db.execute(select(func.count(Claim.id)))
    total_claims = result.scalar() or 0

    # Total agents
    result = await db.execute(select(func.count(Agent.id)))
    total_agents = result.scalar() or 0

    # Total votes
    result = await db.execute(select(func.count()).select_from(ClaimVote))
    total_votes = result.scalar() or 0

    # Claims at consensus (gradient > 0.8 or < 0.2)
    result = await db.execute(
        select(func.count(Claim.id)).where(
            or_(Claim.gradient > 0.8, Claim.gradient < 0.2)
        )
    )
    claims_at_consensus = result.scalar() or 0

    # Active agents in last 7 days (agents who have voted, submitted evidence, or commented)
    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    result = await db.execute(
        select(func.count(func.distinct(ClaimVote.agent_id))).where(
            ClaimVote.created_at >= seven_days_ago
        )
    )
    active_agents_7d = result.scalar() or 0

    updated_at = datetime.now(UTC)

    # Cache the result
    cache_data = {
        "total_claims": total_claims,
        "total_agents": total_agents,
        "total_votes": total_votes,
        "claims_at_consensus": claims_at_consensus,
        "active_agents_7d": active_agents_7d,
        "updated_at": updated_at.isoformat(),
    }
    await redis_client.setex(
        PLATFORM_STATS_CACHE_KEY,
        PLATFORM_STATS_CACHE_TTL,
        json.dumps(cache_data),
    )

    return PlatformStats(
        total_claims=total_claims,
        total_agents=total_agents,
        total_votes=total_votes,
        claims_at_consensus=claims_at_consensus,
        active_agents_7d=active_agents_7d,
        updated_at=updated_at,
    )
