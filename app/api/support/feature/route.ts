import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { trackActivity } from '@/lib/auth/audit';
import { FeatureRequestCreate, FEATURE_REQUEST_CATEGORIES } from '@/lib/types/support';

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

    const requestData = data as FeatureRequestCreate;

    // Validate category
    if (!FEATURE_REQUEST_CATEGORIES.includes(requestData.category as any)) {
      return NextResponse.json(
        { error: 'Invalid request category' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!requestData.title || !requestData.description || !requestData.businessCase) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create feature request
    const request = await prisma.featureRequest.create({
      data: {
        userId: user.userId,
        category: requestData.category,
        impact: requestData.impact,
        title: requestData.title,
        description: requestData.description,
        businessCase: requestData.businessCase,
        isUrgent: requestData.isUrgent || false,
        status: 'PENDING',
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
      'FEATURE_REQUEST',
      'CREATE',
      {
        requestId: request.id,
        category: data.category,
        impact: data.impact,
        isUrgent: data.isUrgent,
      }
    );

    return NextResponse.json({ data: { request } });
  } catch (error) {
    console.error('[Feature Request Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create feature request' },
      { status: 500 }
    );
  }
}
