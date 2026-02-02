from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.notification import NotificationType
from app.schemas.agent import AgentPublic


class NotificationResponse(BaseModel):
    """Response schema for a single notification."""

    id: UUID
    type: NotificationType
    title: str
    message: str
    reference_id: UUID | None
    reference_type: str | None
    actor: AgentPublic | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """Response containing a list of notifications."""

    notifications: list[NotificationResponse]
    total: int
    unread_count: int


class MarkReadRequest(BaseModel):
    """Request to mark specific notifications as read."""

    notification_ids: list[UUID] = Field(..., min_length=1, max_length=100)


class MarkReadResponse(BaseModel):
    """Response for mark read operations."""

    marked_count: int


class UnreadCountResponse(BaseModel):
    """Response containing unread notification count."""

    count: int
