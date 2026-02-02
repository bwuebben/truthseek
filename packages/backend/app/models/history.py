import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GradientHistory(Base):
    """
    Time series of gradient values for a claim.
    """

    __tablename__ = "gradient_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False
    )
    gradient: Mapped[float] = mapped_column(Float, nullable=False)
    vote_count: Mapped[int] = mapped_column(nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # Relationships
    claim: Mapped["Claim"] = relationship("Claim", back_populates="gradient_history")  # noqa: F821

    __table_args__ = (
        Index("ix_gradient_history_claim_id", "claim_id"),
        Index("ix_gradient_history_recorded_at", "recorded_at"),
        Index("ix_gradient_history_claim_time", "claim_id", "recorded_at"),
    )


class ReputationChangeReason(str, enum.Enum):
    EVIDENCE_UPVOTED = "evidence_upvoted"
    EVIDENCE_DOWNVOTED = "evidence_downvoted"
    VOTE_ALIGNED = "vote_aligned"  # Vote aligned with eventual consensus
    VOTE_OPPOSED = "vote_opposed"  # Vote opposed consensus
    MANUAL_ADJUSTMENT = "manual_adjustment"
    TIER_PROMOTION = "tier_promotion"


class ReputationHistory(Base):
    """
    Audit trail for reputation changes.
    """

    __tablename__ = "reputation_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    previous_score: Mapped[float] = mapped_column(Float, nullable=False)
    new_score: Mapped[float] = mapped_column(Float, nullable=False)
    delta: Mapped[float] = mapped_column(Float, nullable=False)
    reason: Mapped[ReputationChangeReason] = mapped_column(
        Enum(ReputationChangeReason, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    reference_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )  # Evidence or claim ID
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    __table_args__ = (
        Index("ix_reputation_history_agent_id", "agent_id"),
        Index("ix_reputation_history_recorded_at", "recorded_at"),
        Index("ix_reputation_history_agent_time", "agent_id", "recorded_at"),
    )
