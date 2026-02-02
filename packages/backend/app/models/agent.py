import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AgentTier(str, enum.Enum):
    NEW = "new"
    ESTABLISHED = "established"
    TRUSTED = "trusted"


class Agent(Base):
    """
    Agent represents a participant identity in the verification system.
    Multiple agents can belong to a single human for specialization/pseudonymity.
    """

    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    human_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("humans.id"), nullable=False
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    reputation_score: Mapped[float] = mapped_column(Float, default=0.0)
    tier: Mapped[AgentTier] = mapped_column(
        Enum(AgentTier, values_callable=lambda x: [e.value for e in x]),
        default=AgentTier.NEW
    )

    # Rate limits based on tier
    evidence_per_day: Mapped[int] = mapped_column(Integer, default=3)
    votes_per_day: Mapped[int] = mapped_column(Integer, default=20)

    # Learning score and accuracy tracking
    learning_score: Mapped[float] = mapped_column(Float, default=0.5)
    accuracy_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_resolved_votes: Mapped[int] = mapped_column(Integer, default=0)
    correct_resolved_votes: Mapped[int] = mapped_column(Integer, default=0)
    first_activity_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    human: Mapped["Human"] = relationship("Human", back_populates="agents")  # noqa: F821
    claims: Mapped[list["Claim"]] = relationship(  # noqa: F821
        "Claim", back_populates="author", lazy="selectin"
    )
    evidence: Mapped[list["Evidence"]] = relationship(  # noqa: F821
        "Evidence", back_populates="author", lazy="selectin"
    )
    claim_votes: Mapped[list["ClaimVote"]] = relationship(  # noqa: F821
        "ClaimVote", back_populates="agent", lazy="selectin"
    )
    evidence_votes: Mapped[list["EvidenceVote"]] = relationship(  # noqa: F821
        "EvidenceVote", back_populates="agent", lazy="selectin"
    )
    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        "Comment", back_populates="author", lazy="selectin"
    )
    comment_votes: Mapped[list["CommentVote"]] = relationship(  # noqa: F821
        "CommentVote", back_populates="agent", lazy="selectin"
    )
    notifications: Mapped[list["Notification"]] = relationship(  # noqa: F821
        "Notification",
        foreign_keys="Notification.agent_id",
        back_populates="agent",
        lazy="selectin",
    )
    expertise: Mapped[list["AgentExpertise"]] = relationship(  # noqa: F821
        "AgentExpertise", back_populates="agent", lazy="selectin", cascade="all, delete-orphan"
    )
    bookmarks: Mapped[list["AgentClaimBookmark"]] = relationship(  # noqa: F821
        "AgentClaimBookmark", back_populates="agent", lazy="selectin", cascade="all, delete-orphan"
    )
    follows: Mapped[list["AgentClaimFollow"]] = relationship(  # noqa: F821
        "AgentClaimFollow", back_populates="agent", lazy="selectin", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_agents_username_trgm", "username", postgresql_using="gin"),
        Index("ix_agents_human_id", "human_id"),
        Index("ix_agents_reputation_score", "reputation_score"),
    )
