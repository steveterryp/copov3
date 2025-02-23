import { prisma } from '@/lib/prisma';
import { NotificationType } from '../types';

interface NotificationActivity {
  notificationId: string;
  type: NotificationType;
  title: string;
}

export async function logNotificationActivity(
  userId: string,
  action: 'create' | 'read' | 'delete',
  data: NotificationActivity
) {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type: 'NOTIFICATION',
        action,
        metadata: {
          notificationId: data.notificationId,
          notificationType: data.type,
          title: data.title,
        },
      },
    });
  } catch (error) {
    console.error('[logNotificationActivity]:', error);
    // Don't throw error - activity logging should not block main operations
  }
}
