import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Index, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ActionType(str, enum.Enum):
    EVIDENCE_SUBMIT = "evidence_submit"
    CLAIM_VOTE = "claim_vote"
    EVIDENCE_VOTE = "evidence_vote"
    CLAIM_CREATE = "claim_create"
    COMMENT_CREATE = "comment_create"


class RateLimitCounter(Base):
    """
    Daily action counts for rate limiting.
    """

    __tablename__ = "rate_limit_counters"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    action_type: Mapped[ActionType] = mapped_column(
        Enum(ActionType, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    count: Mapped[int] = mapped_column(Integer, default=0)
    date: Mapped[datetime] = mapped_column(Date, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    __table_args__ = (
        Index("ix_rate_limit_agent_action_date", "agent_id", "action_type", "date", unique=True),
    )
