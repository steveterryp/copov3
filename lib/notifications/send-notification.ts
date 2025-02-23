import { prisma } from '@/lib/prisma';

interface NotificationOptions {
  userId: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  url?: string;
}

/**
 * Send notification to user
 */
export async function sendNotification(options: NotificationOptions) {
  const { userId, message } = options;

  try {
    const notification = await prisma.notification.create({
      data: {
        message,
        type: options.type || 'info',
        actionUrl: options.url,
        userId,
        read: false,
      },
    });

    // Emit websocket event
    try {
      const ws = (global as any).ws;
      if (ws) {
        ws.to(userId).emit('notification', notification);
      }
    } catch (error) {
      console.error('[Websocket Error]:', error);
      // Don't throw - websocket errors shouldn't break notification creation
    }

    return notification;
  } catch (error) {
    console.error('[Notification Error]:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      read: true,
    },
  });
}

/**
 * Mark all notifications as read for user
 */
export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  return prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });
}

/**
 * Delete all notifications for user
 */
export async function deleteAllNotifications(userId: string) {
  return prisma.notification.deleteMany({
    where: {
      userId,
    },
  });
}

/**
 * Get unread notifications count for user
 */
export async function getUnreadNotificationsCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}
