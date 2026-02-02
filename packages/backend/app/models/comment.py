import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.evidence import VoteDirection


class Comment(Base):
    """
    Comment on a claim or evidence.
    Supports threading via self-referential parent_id.
    """

    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False
    )
    evidence_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evidence.id"), nullable=True
    )
    author_agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("comments.id"), nullable=True
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    downvotes: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    claim: Mapped["Claim"] = relationship("Claim", back_populates="comments")  # noqa: F821
    evidence: Mapped["Evidence"] = relationship("Evidence", back_populates="comments")  # noqa: F821
    author: Mapped["Agent"] = relationship("Agent", back_populates="comments")  # noqa: F821
    parent: Mapped["Comment | None"] = relationship(
        "Comment",
        remote_side=[id],
        back_populates="replies",
        lazy="selectin",
    )
    replies: Mapped[list["Comment"]] = relationship(
        "Comment",
        back_populates="parent",
        lazy="selectin",
    )
    votes: Mapped[list["CommentVote"]] = relationship(
        "CommentVote", back_populates="comment", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_comments_claim_id", "claim_id"),
        Index("ix_comments_evidence_id", "evidence_id"),
        Index("ix_comments_author_agent_id", "author_agent_id"),
        Index("ix_comments_parent_id", "parent_id"),
        Index("ix_comments_created_at", "created_at"),
        Index("ix_comments_claim_created", "claim_id", "created_at"),
    )

    @property
    def vote_score(self) -> int:
        """Calculate the net vote score."""
        return self.upvotes - self.downvotes

    @property
    def depth(self) -> int:
        """Calculate the comment depth in the thread."""
        depth = 0
        current = self.parent
        while current is not None:
            depth += 1
            current = current.parent
        return depth


class CommentVote(Base):
    """
    Represents an agent's vote on a comment.
    """

    __tablename__ = "comment_votes"

    comment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("comments.id"), primary_key=True
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

    # Relationships
    comment: Mapped["Comment"] = relationship("Comment", back_populates="votes")
    agent: Mapped["Agent"] = relationship("Agent", back_populates="comment_votes")  # noqa: F821

    __table_args__ = (
        Index("ix_comment_votes_comment_id", "comment_id"),
        Index("ix_comment_votes_agent_id", "agent_id"),
    )
