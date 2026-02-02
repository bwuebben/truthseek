import { create } from 'zustand';
import { api, Notification, NotificationParams } from '@/lib/api';

interface NotificationsState {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  isLoading: boolean;
  lastPolled: number | null;

  // Actions
  fetchNotifications: (params?: NotificationParams) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  startPolling: (intervalMs?: number) => () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  total: 0,
  unreadCount: 0,
  isLoading: false,
  lastPolled: null,

  fetchNotifications: async (params?: NotificationParams) => {
    set({ isLoading: true });
    try {
      const response = await api.getNotifications(params);
      set({
        notifications: response.notifications,
        total: response.total,
        unreadCount: response.unread_count,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.getUnreadCount();
      set({
        unreadCount: response.count,
        lastPolled: Date.now(),
      });
    } catch {
      // Silently fail on polling errors
    }
  },

  markAsRead: async (notificationIds: string[]) => {
    await api.markNotificationsRead(notificationIds);

    set((state) => ({
      notifications: state.notifications.map((n) =>
        notificationIds.includes(n.id) ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - notificationIds.length),
    }));
  },

  markAllAsRead: async () => {
    await api.markAllNotificationsRead();

    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  startPolling: (intervalMs = 30000) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Fetch immediately
    get().fetchUnreadCount();

    // Then poll at the specified interval
    pollingInterval = setInterval(() => {
      get().fetchUnreadCount();
    }, intervalMs);

    // Return cleanup function
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };
  },
}));
