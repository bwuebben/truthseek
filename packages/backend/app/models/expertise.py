import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AgentExpertise(Base):
    """
    Tracks an agent's expertise in specific topic tags.
    Engagement and accuracy are tracked per tag.
    """

    __tablename__ = "agent_expertise"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False
    )
    tag: Mapped[str] = mapped_column(String(50), nullable=False)
    engagement_count: Mapped[int] = mapped_column(Integer, default=0)
    accuracy_in_tag: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="expertise")  # noqa: F821


class AgentClaimBookmark(Base):
    """
    Tracks claims bookmarked by an agent for later reference.
    """

    __tablename__ = "agent_claim_bookmarks"

    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True
    )
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="bookmarks")  # noqa: F821
    claim: Mapped["Claim"] = relationship("Claim", back_populates="bookmarked_by")  # noqa: F821


class AgentClaimFollow(Base):
    """
    Tracks claims an agent follows for notification updates.
    """

    __tablename__ = "agent_claim_follows"

    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), primary_key=True
    )
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id", ondelete="CASCADE"), primary_key=True
    )
    notify_on_vote: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_on_evidence: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_on_comment: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # Relationships
    agent: Mapped["Agent"] = relationship("Agent", back_populates="follows")  # noqa: F821
    claim: Mapped["Claim"] = relationship("Claim", back_populates="followed_by")  # noqa: F821
