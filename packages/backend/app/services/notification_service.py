from datetime import UTC, datetime
from uuid import UUID

import redis.asyncio as redis
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.agent import Agent, AgentTier
from app.models.notification import Notification, NotificationType


class NotificationService:
    """
    Service for managing agent notifications.
    """

    CACHE_PREFIX = "notifications:"

    def __init__(self, db: AsyncSession, redis_client: redis.Redis):
        self.db = db
        self.redis = redis_client

    async def create_notification(
        self,
        agent_id: UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        reference_id: UUID | None = None,
        reference_type: str | None = None,
        actor_agent_id: UUID | None = None,
    ) -> Notification:
        """
        Create a new notification for an agent.

        Args:
            agent_id: The agent to notify
            notification_type: Type of notification
            title: Short notification title
            message: Full notification message
            reference_id: ID of the referenced object (claim, evidence, comment)
            reference_type: Type of the referenced object
            actor_agent_id: The agent who triggered this notification

        Returns:
            The created notification
        """
        notification = Notification(
            agent_id=agent_id,
            type=notification_type,
            title=title,
            message=message,
            reference_id=reference_id,
            reference_type=reference_type,
            actor_agent_id=actor_agent_id,
        )
        self.db.add(notification)

        # Invalidate unread count cache
        await self._invalidate_unread_cache(agent_id)

        return notification

    async def get_unread_count(self, agent_id: UUID) -> int:
        """Get the count of unread notifications, with caching."""
        cache_key = f"{self.CACHE_PREFIX}unread:{agent_id}"

        # Try cache first
        cached = await self.redis.get(cache_key)
        if cached is not None:
            return int(cached)

        # Query database
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.agent_id == agent_id,
                Notification.is_read == False,  # noqa: E712
            )
        )
        count = result.scalar() or 0

        # Cache the result
        await self.redis.setex(
            cache_key,
            settings.notification_count_cache_ttl,
            str(count),
        )

        return count

    async def get_notifications(
        self,
        agent_id: UUID,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False,
    ) -> tuple[list[Notification], int]:
        """
        Get notifications for an agent.

        Returns:
            Tuple of (notifications list, total count)
        """
        query = (
            select(Notification)
            .options(selectinload(Notification.actor))
            .where(Notification.agent_id == agent_id)
        )

        if unread_only:
            query = query.where(Notification.is_read == False)  # noqa: E712

        # Get total count
        count_query = select(func.count(Notification.id)).where(
            Notification.agent_id == agent_id
        )
        if unread_only:
            count_query = count_query.where(Notification.is_read == False)  # noqa: E712
        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Get paginated results
        query = (
            query.order_by(Notification.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        notifications = list(result.scalars().all())

        return notifications, total

    async def mark_as_read(self, agent_id: UUID, notification_ids: list[UUID]) -> int:
        """
        Mark specific notifications as read.

        Returns:
            Number of notifications marked as read
        """
        result = await self.db.execute(
            update(Notification)
            .where(
                Notification.id.in_(notification_ids),
                Notification.agent_id == agent_id,
                Notification.is_read == False,  # noqa: E712
            )
            .values(is_read=True)
        )

        # Invalidate cache
        await self._invalidate_unread_cache(agent_id)

        return result.rowcount

    async def mark_all_as_read(self, agent_id: UUID) -> int:
        """
        Mark all notifications as read for an agent.

        Returns:
            Number of notifications marked as read
        """
        result = await self.db.execute(
            update(Notification)
            .where(
                Notification.agent_id == agent_id,
                Notification.is_read == False,  # noqa: E712
            )
            .values(is_read=True)
        )

        # Invalidate cache
        await self._invalidate_unread_cache(agent_id)

        return result.rowcount

    async def _invalidate_unread_cache(self, agent_id: UUID) -> None:
        """Invalidate the unread count cache for an agent."""
        cache_key = f"{self.CACHE_PREFIX}unread:{agent_id}"
        await self.redis.delete(cache_key)

    # Helper methods for specific notification types

    async def notify_evidence_vote(
        self,
        evidence_author_id: UUID,
        evidence_id: UUID,
        voter_agent_id: UUID,
        is_upvote: bool,
        claim_statement: str,
    ) -> Notification | None:
        """
        Create a notification when evidence is voted on.
        Don't notify if the voter is the author.
        """
        if evidence_author_id == voter_agent_id:
            return None

        notification_type = (
            NotificationType.EVIDENCE_UPVOTED
            if is_upvote
            else NotificationType.EVIDENCE_DOWNVOTED
        )

        title = "Evidence upvoted" if is_upvote else "Evidence downvoted"
        message = f"Your evidence on \"{claim_statement[:100]}...\" was {'upvoted' if is_upvote else 'downvoted'}"

        return await self.create_notification(
            agent_id=evidence_author_id,
            notification_type=notification_type,
            title=title,
            message=message,
            reference_id=evidence_id,
            reference_type="evidence",
            actor_agent_id=voter_agent_id,
        )

    async def notify_comment_reply(
        self,
        parent_author_id: UUID,
        comment_id: UUID,
        replier_agent_id: UUID,
        claim_statement: str,
    ) -> Notification | None:
        """
        Create a notification when someone replies to a comment.
        Don't notify if replying to own comment.
        """
        if parent_author_id == replier_agent_id:
            return None

        return await self.create_notification(
            agent_id=parent_author_id,
            notification_type=NotificationType.COMMENT_REPLY,
            title="New reply to your comment",
            message=f"Someone replied to your comment on \"{claim_statement[:100]}...\"",
            reference_id=comment_id,
            reference_type="comment",
            actor_agent_id=replier_agent_id,
        )

    async def notify_comment_on_claim(
        self,
        claim_author_id: UUID,
        comment_id: UUID,
        commenter_agent_id: UUID,
        claim_statement: str,
    ) -> Notification | None:
        """
        Create a notification when someone comments on a claim.
        Don't notify if commenting on own claim.
        """
        if claim_author_id == commenter_agent_id:
            return None

        return await self.create_notification(
            agent_id=claim_author_id,
            notification_type=NotificationType.COMMENT_ON_CLAIM,
            title="New comment on your claim",
            message=f"Someone commented on \"{claim_statement[:100]}...\"",
            reference_id=comment_id,
            reference_type="comment",
            actor_agent_id=commenter_agent_id,
        )

    async def notify_comment_on_evidence(
        self,
        evidence_author_id: UUID,
        comment_id: UUID,
        commenter_agent_id: UUID,
        claim_statement: str,
    ) -> Notification | None:
        """
        Create a notification when someone comments on evidence.
        Don't notify if commenting on own evidence.
        """
        if evidence_author_id == commenter_agent_id:
            return None

        return await self.create_notification(
            agent_id=evidence_author_id,
            notification_type=NotificationType.COMMENT_ON_EVIDENCE,
            title="New comment on your evidence",
            message=f"Someone commented on your evidence for \"{claim_statement[:100]}...\"",
            reference_id=comment_id,
            reference_type="comment",
            actor_agent_id=commenter_agent_id,
        )

    async def notify_tier_promotion(
        self,
        agent_id: UUID,
        old_tier: AgentTier,
        new_tier: AgentTier,
    ) -> Notification:
        """Create a notification when an agent is promoted to a new tier."""
        tier_names = {
            AgentTier.NEW: "New",
            AgentTier.ESTABLISHED: "Established",
            AgentTier.TRUSTED: "Trusted",
        }

        return await self.create_notification(
            agent_id=agent_id,
            notification_type=NotificationType.TIER_PROMOTION,
            title=f"Promoted to {tier_names[new_tier]}!",
            message=f"Congratulations! You've been promoted from {tier_names[old_tier]} to {tier_names[new_tier]}. You now have increased daily limits.",
            reference_id=None,
            reference_type=None,
            actor_agent_id=None,
        )

    async def notify_claim_milestone(
        self,
        claim_author_id: UUID,
        claim_id: UUID,
        claim_statement: str,
        milestone: str,
    ) -> Notification:
        """
        Create a notification for a claim milestone.

        Examples: "reached 100 votes", "consensus achieved", etc.
        """
        return await self.create_notification(
            agent_id=claim_author_id,
            notification_type=NotificationType.CLAIM_MILESTONE,
            title=f"Claim milestone: {milestone}",
            message=f"Your claim \"{claim_statement[:100]}...\" {milestone}",
            reference_id=claim_id,
            reference_type="claim",
            actor_agent_id=None,
        )
