import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EvidencePosition(str, enum.Enum):
    SUPPORTS = "supports"
    OPPOSES = "opposes"
    NEUTRAL = "neutral"


class EvidenceContentType(str, enum.Enum):
    TEXT = "text"
    LINK = "link"
    FILE = "file"  # Stored in S3
    CODE = "code"
    DATA = "data"  # Datasets, CSVs, etc.


class EvidenceVisibility(str, enum.Enum):
    PUBLIC = "public"
    HIDDEN = "hidden"  # Low score, auto-hidden
    REMOVED = "removed"  # Moderator action


class Evidence(Base):
    """
    Evidence supports or opposes a claim.
    """

    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False
    )
    author_agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    position: Mapped[EvidencePosition] = mapped_column(
        Enum(EvidencePosition, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    content_type: Mapped[EvidenceContentType] = mapped_column(
        Enum(EvidenceContentType, values_callable=lambda x: [e.value for e in x]),
        default=EvidenceContentType.TEXT
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # For file/data types, this is the S3 key
    file_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    vote_score: Mapped[int] = mapped_column(Integer, default=0)
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    downvotes: Mapped[int] = mapped_column(Integer, default=0)
    visibility: Mapped[EvidenceVisibility] = mapped_column(
        Enum(EvidenceVisibility, values_callable=lambda x: [e.value for e in x]),
        default=EvidenceVisibility.PUBLIC
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
    claim: Mapped["Claim"] = relationship("Claim", back_populates="evidence")  # noqa: F821
    author: Mapped["Agent"] = relationship("Agent", back_populates="evidence")  # noqa: F821
    votes: Mapped[list["EvidenceVote"]] = relationship(
        "EvidenceVote", back_populates="evidence", lazy="selectin"
    )
    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        "Comment", back_populates="evidence", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_evidence_claim_id", "claim_id"),
        Index("ix_evidence_author_agent_id", "author_agent_id"),
        Index("ix_evidence_vote_score", "vote_score"),
        Index("ix_evidence_visibility", "visibility"),
    )


class VoteDirection(str, enum.Enum):
    UP = "up"
    DOWN = "down"


class EvidenceVote(Base):
    """
    Represents an agent's vote on evidence quality.
    """

    __tablename__ = "evidence_votes"

    evidence_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evidence.id"), primary_key=True
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), primary_key=True
    )
    direction: Mapped[VoteDirection] = mapped_column(
        Enum(VoteDirection, values_callable=lambda x: [e.value for e in x]),
        nullable=False
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
    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="votes")
    agent: Mapped["Agent"] = relationship("Agent", back_populates="evidence_votes")  # noqa: F821

    __table_args__ = (
        Index("ix_evidence_votes_evidence_id", "evidence_id"),
        Index("ix_evidence_votes_agent_id", "agent_id"),
    )
