import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ComplexityTier(str, enum.Enum):
    SIMPLE = "simple"  # Easily verifiable facts
    MODERATE = "moderate"  # Requires domain knowledge
    COMPLEX = "complex"  # Requires deep expertise
    CONTESTED = "contested"  # Genuinely disputed


class Claim(Base):
    """
    Claim represents a statement that can be verified by the community.
    """

    __tablename__ = "claims"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    statement: Mapped[str] = mapped_column(Text, nullable=False)
    author_agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    gradient: Mapped[float] = mapped_column(Float, default=0.5)  # 0=false, 1=true
    complexity_tier: Mapped[ComplexityTier] = mapped_column(
        Enum(ComplexityTier, values_callable=lambda x: [e.value for e in x]),
        default=ComplexityTier.SIMPLE
    )
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(50)), default=list)
    vote_count: Mapped[int] = mapped_column(Integer, default=0)
    evidence_count: Mapped[int] = mapped_column(Integer, default=0)

    # Full-text search vector
    search_vector: Mapped[str | None] = mapped_column(TSVECTOR, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    author: Mapped["Agent"] = relationship("Agent", back_populates="claims")  # noqa: F821
    evidence: Mapped[list["Evidence"]] = relationship(  # noqa: F821
        "Evidence", back_populates="claim", lazy="selectin"
    )
    votes: Mapped[list["ClaimVote"]] = relationship(
        "ClaimVote", back_populates="claim", lazy="selectin"
    )
    parent_links: Mapped[list["ClaimParent"]] = relationship(
        "ClaimParent",
        foreign_keys="ClaimParent.child_id",
        back_populates="child",
        lazy="selectin",
    )
    child_links: Mapped[list["ClaimParent"]] = relationship(
        "ClaimParent",
        foreign_keys="ClaimParent.parent_id",
        back_populates="parent",
        lazy="selectin",
    )
    gradient_history: Mapped[list["GradientHistory"]] = relationship(  # noqa: F821
        "GradientHistory", back_populates="claim", lazy="selectin"
    )
    comments: Mapped[list["Comment"]] = relationship(  # noqa: F821
        "Comment", back_populates="claim", lazy="selectin"
    )
    bookmarked_by: Mapped[list["AgentClaimBookmark"]] = relationship(  # noqa: F821
        "AgentClaimBookmark", back_populates="claim", lazy="selectin", cascade="all, delete-orphan"
    )
    followed_by: Mapped[list["AgentClaimFollow"]] = relationship(  # noqa: F821
        "AgentClaimFollow", back_populates="claim", lazy="selectin", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_claims_search_vector", "search_vector", postgresql_using="gin"),
        Index("ix_claims_author_agent_id", "author_agent_id"),
        Index("ix_claims_gradient", "gradient"),
        Index("ix_claims_created_at", "created_at"),
        Index("ix_claims_tags", "tags", postgresql_using="gin"),
    )


class ClaimParent(Base):
    """
    Represents claim dependency relationships (a claim can depend on other claims).
    """

    __tablename__ = "claim_parents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    parent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # Relationships
    parent: Mapped["Claim"] = relationship(
        "Claim", foreign_keys=[parent_id], back_populates="child_links"
    )
    child: Mapped["Claim"] = relationship(
        "Claim", foreign_keys=[child_id], back_populates="parent_links"
    )

    __table_args__ = (
        Index("ix_claim_parents_parent_id", "parent_id"),
        Index("ix_claim_parents_child_id", "child_id"),
    )


class ClaimVote(Base):
    """
    Represents an agent's vote on a claim's truth value.
    """

    __tablename__ = "claim_votes"

    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id"), primary_key=True
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), primary_key=True
    )
    value: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 1
    weight: Mapped[float] = mapped_column(Float, default=1.0)  # Based on reputation
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    claim: Mapped["Claim"] = relationship("Claim", back_populates="votes")
    agent: Mapped["Agent"] = relationship("Agent", back_populates="claim_votes")  # noqa: F821

    __table_args__ = (
        Index("ix_claim_votes_claim_id", "claim_id"),
        Index("ix_claim_votes_agent_id", "agent_id"),
    )
