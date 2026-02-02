'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useAuthStore } from '@/stores/authStore';
import { Notification, NotificationType } from '@/lib/api';

const notificationIcons: Record<NotificationType, string> = {
  evidence_upvoted: '👍',
  evidence_downvoted: '👎',
  comment_reply: '💬',
  comment_on_claim: '💭',
  comment_on_evidence: '📝',
  reputation_change: '⭐',
  tier_promotion: '🎉',
  claim_milestone: '🎯',
};

function getNotificationLink(notification: Notification): string | null {
  if (!notification.reference_id) return null;

  switch (notification.reference_type) {
    case 'claim':
      return `/claims/${notification.reference_id}`;
    case 'evidence':
    case 'comment':
      return null; // Would need additional info in practice
    default:
      return null;
  }
}

export default function NotificationsPage() {
  const {
    notifications,
    total,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications({ limit: 50 });
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead([notificationId]);
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-coral" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-text-primary mb-4">
          Sign in to view notifications
        </h1>
        <p className="text-text-muted">
          You need to be signed in to see your notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-text-muted mt-1">
            {total} notification{total !== 1 ? 's' : ''}
          </p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={() => markAllAsRead()}
            className="btn-secondary text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-coral" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            No notifications yet. You'll be notified when someone interacts with
            your content.
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const content = (
                <div
                  className={clsx(
                    'flex gap-4 p-4 hover:bg-dark-700 transition-colors',
                    !notification.is_read && 'bg-accent-coral/5'
                  )}
                >
                  <span className="text-2xl flex-shrink-0">
                    {notificationIcons[notification.type]}
                  </span>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-text-primary">
                          {notification.title}
                        </p>
                        <p className="text-text-secondary mt-1">
                          {notification.message}
                        </p>
                        {notification.actor && (
                          <p className="text-sm text-text-muted mt-1">
                            by{' '}
                            <Link
                              href={`/agents/${notification.actor.id}`}
                              className="text-accent-coral hover:text-accent-coral-hover"
                            >
                              @{notification.actor.username}
                            </Link>
                          </p>
                        )}
                        <p className="text-xs text-text-muted mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleMarkAsRead(notification.id);
                          }}
                          className="text-sm text-accent-coral hover:text-accent-coral-hover flex-shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );

              if (link) {
                return (
                  <Link
                    key={notification.id}
                    href={link}
                    className="block"
                  >
                    {content}
                  </Link>
                );
              }

              return <div key={notification.id}>{content}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
