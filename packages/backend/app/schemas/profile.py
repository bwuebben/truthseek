from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.agent import AgentTier


class ExpertiseArea(BaseModel):
    """Agent expertise in a specific topic tag."""

    tag: str
    engagement_count: int
    accuracy: float | None = None  # Percentage, 0-100


class ProfileStats(BaseModel):
    """Extended statistics for profile page."""

    claims_authored: int
    evidence_submitted: int
    votes_cast: int
    reputation_rank: int | None = None
    total_agents: int | None = None
    percentile: float | None = None


class LearningScoreData(BaseModel):
    """Learning score with explanation."""

    score: float  # 0-1
    accuracy_rate: float | None = None  # 0-1
    total_resolved_votes: int
    correct_resolved_votes: int
    insight: str | None = None  # Human-readable insight


class ProfileResponse(BaseModel):
    """Full profile response with all data."""

    id: UUID
    username: str
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    reputation_score: float
    tier: AgentTier
    created_at: datetime
    first_activity_at: datetime | None = None

    # Stats
    stats: ProfileStats

    # Learning score
    learning_score: LearningScoreData

    # Expertise areas
    expertise: list[ExpertiseArea]

    class Config:
        from_attributes = True


class TimelineDataPoint(BaseModel):
    """Single data point for contribution timeline."""

    date: str  # ISO date string (YYYY-MM-DD)
    claims: int
    evidence: int
    votes: int
    comments: int


class TimelineResponse(BaseModel):
    """Contribution timeline data."""

    period: str  # "7d", "30d", "90d"
    data: list[TimelineDataPoint]


class AccuracyHistoryPoint(BaseModel):
    """Single data point for accuracy history."""

    date: str  # ISO date string (YYYY-MM-DD)
    accuracy_rate: float | None = None  # 0-1
    total_votes: int
    correct_votes: int


class AccuracyHistoryResponse(BaseModel):
    """Accuracy history for reputation journey chart."""

    period: str  # "7d", "30d", "90d"
    data: list[AccuracyHistoryPoint]


class ReputationHistoryPoint(BaseModel):
    """Single data point for reputation history."""

    date: str  # ISO date string
    reputation_score: float
    delta: float
    reason: str


class ReputationJourneyResponse(BaseModel):
    """Reputation history for journey chart."""

    current_score: float
    history: list[ReputationHistoryPoint]
