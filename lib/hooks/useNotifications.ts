import { useCallback, useContext, useMemo, useState } from 'react';
import { NotificationContext } from '@/components/notifications/NotificationProvider';
import { NotificationContextValue, Notification, NotificationOptions } from '@/components/notifications/types';
import { useAuth } from '@/lib/hooks/useAuth';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (title: string, message: string, options?: NotificationOptions) => void;
  addError: (title: string, message: string, options?: Omit<NotificationOptions, 'type'>) => void;
  addWarning: (title: string, message: string, options?: Omit<NotificationOptions, 'type'>) => void;
  addSuccess: (title: string, message: string, options?: Omit<NotificationOptions, 'type'>) => void;
  addInfo: (title: string, message: string, options?: Omit<NotificationOptions, 'type'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  clearAllRead: () => void;
  connected: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const context = useContext(NotificationContext) as NotificationContextValue;
  if (context === null) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  const { notifications, setNotifications, addNotification, markAsRead, clearAll, removeNotification } = context;
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(() => 
    notifications.filter((n: Notification) => !n.read).length,
    [notifications]
  );

  const addError = useCallback((title: string, message: string, options?: Omit<NotificationOptions, 'type'>) => {
    addNotification(title, message, { ...options, type: 'error' });
  }, [addNotification]);

  const addWarning = useCallback((title: string, message: string, options?: Omit<NotificationOptions, 'type'>) => {
    addNotification(title, message, { ...options, type: 'warning' });
  }, [addNotification]);

  const addSuccess = useCallback((title: string, message: string, options?: Omit<NotificationOptions, 'type'>) => {
    addNotification(title, message, { ...options, type: 'success' });
  }, [addNotification]);

  const addInfo = useCallback((title: string, message: string, options?: Omit<NotificationOptions, 'type'>) => {
    addNotification(title, message, { ...options, type: 'info' });
  }, [addNotification]);

  const markAllAsRead = useCallback(() => {
    const componentNotifications: Notification[] = notifications;
    componentNotifications.forEach((notification: Notification) => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
    });
  }, [notifications, markAsRead]);

  const clearAllRead = useCallback(() => {
    const componentNotifications: Notification[] = notifications;
    componentNotifications.forEach((notification: Notification) => {
      if (notification.read) {
        removeNotification(notification.id);
      }
    });
  }, [notifications, removeNotification]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized to fetch notifications');
        } else {
          throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const data = await response.json() as Notification[];
      setNotifications(data);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [accessToken, setNotifications]);

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    addNotification,
    addError,
    addWarning,
    addSuccess,
    addInfo,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    clearAllRead,
    connected: context.connected,
    loading,
    error,
    refresh,
  };
}
