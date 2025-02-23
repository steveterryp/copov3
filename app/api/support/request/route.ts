import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { trackActivity } from '@/lib/auth/audit';
import { SupportRequestCreate, SUPPORT_REQUEST_TYPES } from '@/lib/types/support';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();

    const requestData = data as SupportRequestCreate;

    // Validate type
    if (!SUPPORT_REQUEST_TYPES.includes(requestData.type as any)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!requestData.subject || !requestData.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create support request
    const request = await prisma.supportRequest.create({
      data: {
        userId: user.userId,
        type: requestData.type,
        priority: requestData.priority,
        subject: requestData.subject,
        description: requestData.description,
        status: 'OPEN',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Track activity
    await trackActivity(
      user.userId,
      'SUPPORT_REQUEST',
      'CREATE',
      {
        requestId: request.id,
        type: data.type,
        priority: data.priority,
      }
    );

    return NextResponse.json({ data: { request } });
  } catch (error) {
    console.error('[Support Request Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create support request' },
      { status: 500 }
    );
  }
}
