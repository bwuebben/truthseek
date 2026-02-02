import redis.asyncio as redis
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_agent
from app.core.database import get_db
from app.core.redis import get_redis
from app.models.agent import Agent
from app.schemas.agent import AgentPublic
from app.schemas.notification import (
    MarkReadRequest,
    MarkReadResponse,
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter()


def _notification_to_response(notification) -> NotificationResponse:
    """Convert Notification model to NotificationResponse."""
    return NotificationResponse(
        id=notification.id,
        type=notification.type,
        title=notification.title,
        message=notification.message,
        reference_id=notification.reference_id,
        reference_type=notification.reference_type,
        actor=AgentPublic.model_validate(notification.actor) if notification.actor else None,
        is_read=notification.is_read,
        created_at=notification.created_at,
    )


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    unread_only: bool = Query(default=False),
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get notifications for the current agent.

    Results are ordered by creation date (newest first).
    """
    notification_service = NotificationService(db, redis_client)

    notifications, total = await notification_service.get_notifications(
        agent_id=current_agent.id,
        limit=limit,
        offset=offset,
        unread_only=unread_only,
    )

    unread_count = await notification_service.get_unread_count(current_agent.id)

    return NotificationListResponse(
        notifications=[_notification_to_response(n) for n in notifications],
        total=total,
        unread_count=unread_count,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Get the count of unread notifications.

    This endpoint is cached and optimized for frequent polling.
    """
    notification_service = NotificationService(db, redis_client)
    count = await notification_service.get_unread_count(current_agent.id)

    return UnreadCountResponse(count=count)


@router.post("/mark-read", response_model=MarkReadResponse)
async def mark_notifications_read(
    request: MarkReadRequest,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Mark specific notifications as read.
    """
    notification_service = NotificationService(db, redis_client)
    marked_count = await notification_service.mark_as_read(
        agent_id=current_agent.id,
        notification_ids=request.notification_ids,
    )

    return MarkReadResponse(marked_count=marked_count)


@router.post("/mark-all-read", response_model=MarkReadResponse)
async def mark_all_notifications_read(
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis),
):
    """
    Mark all notifications as read.
    """
    notification_service = NotificationService(db, redis_client)
    marked_count = await notification_service.mark_all_as_read(current_agent.id)

    return MarkReadResponse(marked_count=marked_count)
