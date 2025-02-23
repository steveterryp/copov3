import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { prisma } from '@/lib/prisma';
import { logNotificationActivity } from '@/lib/notifications/services/activity';
import { NotificationType } from '@/lib/notifications/types';

export async function POST(req: NextRequest) {
  try {
    console.log('[Notifications Clear] Clearing all notifications');
    const user = await getAuthUser(req);
    
    if (!user) {
      console.log('[Notifications Clear] No user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mark all user's notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    // Log activity
    await logNotificationActivity(user.userId, 'read', {
      notificationId: 'all',
      type: NotificationType.INFO,
      title: 'All notifications marked as read',
    });

    console.log('[Notifications Clear] Marked as read:', result.count);
    return NextResponse.json({ 
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error('[Notifications Clear] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}
