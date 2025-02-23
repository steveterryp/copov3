import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { markAsRead } from '@/lib/notifications/services/delivery';

export async function POST(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    console.log('[Notifications Read] Marking notification as read:', params.notificationId);
    const user = await getAuthUser(req);
    
    if (!user) {
      console.log('[Notifications Read] No user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notification = await markAsRead(params.notificationId, user.userId);
    console.log('[Notifications Read] Notification marked as read:', notification.id);

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('[Notifications Read] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
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
