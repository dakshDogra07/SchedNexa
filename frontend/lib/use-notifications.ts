'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Notification } from '@shared/types';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const res = await api.call('getNotifications', { userId });
    if (res.ok) {
      setNotifications(res.data);
      const unread = res.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    }
    setLoading(false);
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await api.call('markNotificationRead', { notificationId });
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // 3-second polling fallback as specified in docs/ARCHITECTURE.md
    const interval = setInterval(fetchNotifications, 3000);

    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAsRead,
  };
}
