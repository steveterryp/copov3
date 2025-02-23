import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-auth-user';

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update all unread notifications for the user
    await prisma.notification.updateMany({
      where: {
        userId: authUser.userId,
        read: false
      },
      data: {
        read: true
      }
    });

    return NextResponse.json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('[PUT /api/notifications/read-all]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
