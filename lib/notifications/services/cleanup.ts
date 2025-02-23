import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

/**
 * Delete old read notifications
 * - Read notifications older than 7 days are deleted
 * - Unread notifications are kept indefinitely
 */
export async function cleanupOldNotifications() {
  try {
    const threshold = subDays(new Date(), 7);

    const { count } = await prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: {
          lt: threshold,
        },
      },
    });

    console.log(`[cleanupOldNotifications] Deleted ${count} old notifications`);
    return count;
  } catch (error) {
    console.error('[cleanupOldNotifications]:', error);
    throw error;
  }
}

/**
 * Delete all read notifications for a user
 */
export async function clearReadNotifications(userId: string) {
  try {
    const { count } = await prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
      },
    });

    console.log(`[clearReadNotifications] Deleted ${count} read notifications for user ${userId}`);
    return count;
  } catch (error) {
    console.error('[clearReadNotifications]:', error);
    throw error;
  }
}

/**
 * Get cleanup statistics
 */
export async function getCleanupStats() {
  try {
    const threshold = subDays(new Date(), 7);

    const [totalCount, readCount, oldReadCount] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({
        where: { read: true },
      }),
      prisma.notification.count({
        where: {
          read: true,
          createdAt: {
            lt: threshold,
          },
        },
      }),
    ]);

    return {
      totalNotifications: totalCount,
      readNotifications: readCount,
      cleanupEligible: oldReadCount,
      lastChecked: new Date(),
    };
  } catch (error) {
    console.error('[getCleanupStats]:', error);
    throw error;
  }
}
