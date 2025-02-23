import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { notificationSelect } from '../prisma/select';
import { mapNotificationFromPrisma } from '../prisma/mappers';
import { NotificationResponse } from '../types';

// Retry configuration
const RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
};

// Helper function to implement exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error && 
        error.message.includes('Too many database connections') &&
        retryCount < RETRY_OPTIONS.maxRetries) {
      const delay = Math.min(
        RETRY_OPTIONS.initialDelay * Math.pow(2, retryCount),
        RETRY_OPTIONS.maxDelay
      );
      console.log(`[Notifications Handler] Retrying after ${delay}ms (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retryCount + 1);
    }
    throw error; // Replace return Promise.reject with throw error
  }
}

export async function getNotificationsHandler(req: NextRequest): Promise<NextResponse<NotificationResponse>> {
  try {
    // Get user from token
    const user = await getAuthUser(req);
    if (!user) {
      // Return empty array for unauthenticated users
      return NextResponse.json({
        data: [],
        unreadCount: 0,
      });
    }

    // Directly call prisma.$transaction without retry logic
    const transactionResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const [notifs, count] = await Promise.all([
        tx.notification.findMany({
          where: {
            userId: user?.userId, // Use optional chaining here
          },
          orderBy: {
            createdAt: 'desc',
          },
          select: notificationSelect,
        }),
        tx.notification.count({
          where: {
            userId: user?.userId, // Use optional chaining here
            read: false,
          },
        }),
      ]);
      return { notifications: notifs, unreadCount: count };
    }, {
      maxWait: 2000, // Reduced maximum wait time
      timeout: 5000, // Reduced transaction timeout
      isolationLevel: 'ReadCommitted',
    });

    const responseData = {
      data: transactionResult.notifications.map(mapNotificationFromPrisma),
      unreadCount: transactionResult.unreadCount,
    };
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[Notifications Handler] Error:', error);
    return NextResponse.json(
      {
        data: [],
        unreadCount: 0,
      },
      { status: 500 }
    );
}
}
