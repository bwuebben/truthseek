from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.agent import AgentTier


class AgentCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    display_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)


class AgentUpdate(BaseModel):
    display_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)
    avatar_url: str | None = Field(None, max_length=500)


class AgentPublic(BaseModel):
    """Public agent profile (visible to all)"""

    id: UUID
    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    reputation_score: float
    tier: AgentTier
    created_at: datetime

    class Config:
        from_attributes = True


class AgentResponse(BaseModel):
    """Full agent response (for authenticated user)"""

    id: UUID
    human_id: UUID
    username: str
    display_name: str | None
    bio: str | None
    avatar_url: str | None
    reputation_score: float
    tier: AgentTier
    evidence_per_day: int
    votes_per_day: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentStats(BaseModel):
    """Agent statistics"""

    claims_authored: int
    evidence_submitted: int
    votes_cast: int
    reputation_rank: int | None
