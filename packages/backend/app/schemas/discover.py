from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.claim import ComplexityTier


class TrendingClaim(BaseModel):
    """Claim with trending score data."""

    id: UUID
    statement: str
    gradient: float
    vote_count: int
    evidence_count: int
    tags: list[str]
    complexity_tier: ComplexityTier
    author_agent_id: UUID
    created_at: datetime
    trending_score: float
    votes_24h: int
    evidence_24h: int
    comments_24h: int

    class Config:
        from_attributes = True


class TrendingResponse(BaseModel):
    """Response for trending claims endpoint."""

    claims: list[TrendingClaim]
    updated_at: datetime


class RelatedClaim(BaseModel):
    """Claim with relevance data."""

    id: UUID
    statement: str
    gradient: float
    vote_count: int
    tags: list[str]
    relevance_score: float
    shared_tags: list[str]


class RelatedClaimsResponse(BaseModel):
    """Response for related claims endpoint."""

    source_claim_id: UUID
    related: list[RelatedClaim]


class RecommendedClaim(BaseModel):
    """Claim with recommendation data."""

    id: UUID
    statement: str
    gradient: float
    vote_count: int
    evidence_count: int
    tags: list[str]
    complexity_tier: ComplexityTier
    author_agent_id: UUID
    created_at: datetime
    recommendation_score: float
    matching_tags: list[str]

    class Config:
        from_attributes = True


class RecommendedResponse(BaseModel):
    """Response for recommended claims endpoint."""

    claims: list[RecommendedClaim]
    based_on_tags: list[str]


class TopicInfo(BaseModel):
    """Information about a topic/tag."""

    tag: str
    claim_count: int
    recent_activity: int  # Claims in last 7 days


class TopicsResponse(BaseModel):
    """Response for topics list endpoint."""

    topics: list[TopicInfo]
    total: int


class TopicClaimsResponse(BaseModel):
    """Response for claims in a specific topic."""

    tag: str
    claims: list[TrendingClaim]
    total: int


class ActivityItem(BaseModel):
    """Single activity feed item."""

    id: UUID
    type: str  # "vote", "evidence", "comment", "claim"
    claim_id: UUID
    claim_statement: str
    agent_id: UUID
    agent_username: str
    agent_avatar_url: str | None = None
    timestamp: datetime
    details: dict | None = None  # Type-specific details


class ActivityFeedResponse(BaseModel):
    """Response for activity feed endpoint."""

    items: list[ActivityItem]
    has_more: bool


class PlatformStats(BaseModel):
    """Platform-wide statistics."""

    total_claims: int
    total_agents: int
    total_votes: int
    claims_at_consensus: int  # gradient > 0.8 or < 0.2
    active_agents_7d: int
    updated_at: datetime


class BookmarkResponse(BaseModel):
    """Response for bookmark operations."""

    claim_id: UUID
    is_bookmarked: bool
    created_at: datetime | None = None


class FollowResponse(BaseModel):
    """Response for follow operations."""

    claim_id: UUID
    is_following: bool
    notify_on_vote: bool = True
    notify_on_evidence: bool = True
    notify_on_comment: bool = True
    created_at: datetime | None = None


class FollowUpdate(BaseModel):
    """Request to update follow preferences."""

    notify_on_vote: bool | None = None
    notify_on_evidence: bool | None = None
    notify_on_comment: bool | None = None
