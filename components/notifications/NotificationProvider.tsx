'use client';

import React from 'react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { NotificationContextValue, Notification } from './types';
import { Toaster } from '@/components/ui/Toaster';

export const NotificationContext = React.createContext<NotificationContextValue | null>(null);

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 50
}) => {
  const {
    addNotification,
    markAsRead,
    clearAll,
    loading,
    error
  } = useNotifications();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const value: NotificationContextValue = {
    notifications: notifications.map(n => ({
      ...n,
      read: n.read || false
    })),
    setNotifications,
    addNotification,
    markAsRead,
    removeNotification: markAsRead,
    clearAll,
    connected: true
  };

  React.useEffect(() => {
    if (error) {
      console.error('Notification system error:', error);
    }
  }, [error]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster />
    </NotificationContext.Provider>
  );
};
