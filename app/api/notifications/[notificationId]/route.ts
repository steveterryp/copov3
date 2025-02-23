import { NextRequest, NextResponse } from 'next/server';
import { markAsReadHandler } from '@/lib/notifications/handlers/read';

export async function PUT(
  req: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const data = await markAsReadHandler(req, params.notificationId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[PUT /api/notifications/[notificationId]]:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
