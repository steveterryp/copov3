import { NotificationType } from '@/lib/types/notification';

export interface Notification { // Simplified Notification interface
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface NotificationOptions {
  type?: NotificationType;
  autoClose?: boolean;
  autoCloseDelay?: number;
  actionUrl?: string; // Remove actionUrl option for simplicity
}

export interface NotificationContextValue {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (title: string, message: string, options?: NotificationOptions) => void;
  markAsRead: (notificationId: string) => void; // Use notificationId instead of id
  removeNotification: (notificationId: string) => void; // Use notificationId instead of id
  clearAll: () => void;
  connected: boolean;
}
