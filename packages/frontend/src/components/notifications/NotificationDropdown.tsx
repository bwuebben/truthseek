'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { Notification, NotificationType } from '@/lib/api';
import { useNotificationsStore } from '@/stores/notificationsStore';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

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
      return `/claims/${notification.reference_id}`; // Would need claim_id in practice
    case 'comment':
      return `/claims/${notification.reference_id}`; // Would need claim_id in practice
    default:
      return null;
  }
}

export function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationsStore();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ limit: 10 });
    }
  }, [isOpen, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification) => {
            const link = getNotificationLink(notification);
            const content = (
              <div
                className={clsx(
                  'flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
                  !notification.is_read && 'bg-blue-50'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="text-xl flex-shrink-0">
                  {notificationIcons[notification.type]}
                </span>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                )}
              </div>
            );

            if (link) {
              return (
                <Link key={notification.id} href={link} onClick={onClose}>
                  {content}
                </Link>
              );
            }

            return <div key={notification.id}>{content}</div>;
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-2">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block text-center text-sm text-blue-600 hover:text-blue-700"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
