from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.claim import ComplexityTier
from app.schemas.agent import AgentPublic


class ClaimCreate(BaseModel):
    statement: str = Field(..., min_length=10, max_length=5000)
    complexity_tier: ComplexityTier = ComplexityTier.SIMPLE
    tags: list[str] = Field(default_factory=list, max_length=10)
    parent_ids: list[UUID] = Field(default_factory=list, max_length=5)


class ClaimVoteCreate(BaseModel):
    value: float = Field(..., ge=0.0, le=1.0)


class GradientHistoryEntry(BaseModel):
    gradient: float
    vote_count: int
    recorded_at: datetime

    class Config:
        from_attributes = True


class ClaimResponse(BaseModel):
    id: UUID
    statement: str
    author: AgentPublic
    gradient: float
    complexity_tier: ComplexityTier
    tags: list[str]
    vote_count: int
    evidence_count: int
    created_at: datetime
    updated_at: datetime
    user_vote: float | None = None  # Current user's vote, if any

    class Config:
        from_attributes = True


class ClaimWithHistory(ClaimResponse):
    gradient_history: list[GradientHistoryEntry]
    parent_claims: list["ClaimResponse"] = []

    class Config:
        from_attributes = True


class ClaimSearchParams(BaseModel):
    q: str | None = Field(None, min_length=2, max_length=200)
    tags: list[str] | None = None
    complexity: ComplexityTier | None = None
    min_gradient: float | None = Field(None, ge=0.0, le=1.0)
    max_gradient: float | None = Field(None, ge=0.0, le=1.0)
    author_id: UUID | None = None
    sort_by: str = Field(default="created_at", pattern=r"^(created_at|gradient|vote_count)$")
    sort_order: str = Field(default="desc", pattern=r"^(asc|desc)$")
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class ClaimListResponse(BaseModel):
    claims: list[ClaimResponse]
    total: int
    limit: int
    offset: int
