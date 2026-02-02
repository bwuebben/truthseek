import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class NotificationType(str, enum.Enum):
    EVIDENCE_UPVOTED = "evidence_upvoted"
    EVIDENCE_DOWNVOTED = "evidence_downvoted"
    COMMENT_REPLY = "comment_reply"
    COMMENT_ON_CLAIM = "comment_on_claim"
    COMMENT_ON_EVIDENCE = "comment_on_evidence"
    REPUTATION_CHANGE = "reputation_change"
    TIER_PROMOTION = "tier_promotion"
    CLAIM_MILESTONE = "claim_milestone"


class Notification(Base):
    """
    Notification for an agent about activity on their content.
    """

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Reference to the object that triggered this notification
    reference_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # The agent who performed the action (if applicable)
    actor_agent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True
    )

    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # Relationships
    agent: Mapped["Agent"] = relationship(  # noqa: F821
        "Agent", foreign_keys=[agent_id], back_populates="notifications"
    )
    actor: Mapped["Agent | None"] = relationship(  # noqa: F821
        "Agent", foreign_keys=[actor_agent_id]
    )

    __table_args__ = (
        Index("ix_notifications_agent_id", "agent_id"),
        Index("ix_notifications_created_at", "created_at"),
        Index("ix_notifications_is_read", "is_read"),
        Index("ix_notifications_agent_read_created", "agent_id", "is_read", "created_at"),
    )
