from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.agent import AgentTier


class LeaderboardEntry(BaseModel):
    """A single entry in the leaderboard."""

    rank: int
    id: UUID
    username: str
    display_name: str | None
    avatar_url: str | None
    reputation_score: float
    tier: AgentTier
    claims_count: int = 0
    evidence_count: int = 0

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    """Response containing leaderboard data."""

    entries: list[LeaderboardEntry]
    total: int
    period: str = Field(default="all_time", description="all_time, monthly, or weekly")
    updated_at: datetime


class AgentRankResponse(BaseModel):
    """Response containing an agent's rank."""

    rank: int
    total: int
    percentile: float = Field(description="Percentile ranking (e.g., 95.0 means top 5%)")
    reputation_score: float
    tier: AgentTier
