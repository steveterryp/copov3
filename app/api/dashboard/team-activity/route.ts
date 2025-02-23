import { NextRequest } from 'next/server';
import auth from '@/lib/auth';
import { UserRole } from '@/lib/types/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get team activity
 */
export async function GET(req: NextRequest) {
  try {
    // Parse query params
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const pageSize = parseInt(req.nextUrl.searchParams.get('pageSize') || '10');
    const teamId = req.nextUrl.searchParams.get('teamId');
    const type = req.nextUrl.searchParams.get('type');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');

    // Validate params
    if (isNaN(page) || page < 1) {
      return Response.json(
        {
          error: {
            message: 'Invalid page number',
            code: 'INVALID_REQUEST',
          },
        },
        { status: 400 }
      );
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return Response.json(
        {
          error: {
            message: 'Invalid page size',
            code: 'INVALID_REQUEST',
          },
        },
        { status: 400 }
      );
    }

    // Get access token from authorization header
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return Response.json(
        {
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await auth.tokens.verifyAccessToken(token);
    if (!decoded) {
      return Response.json(
        {
          error: {
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
          },
        },
        { status: 401 }
      );
    }

    // Build where clause
    const where: any = {};
    if (teamId) {
      where.teamId = teamId;
    }
    if (type) {
      where.type = type;
    }
    if (startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate),
      };
    }

    // Get activities
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activity.count({ where }),
    ]);

    return Response.json({
      data: {
        items: activities,
        total,
        page,
        pageSize,
        hasMore: total > page * pageSize,
      },
    });
  } catch (error) {
    console.error('[Team Activity Error]:', error);
    return Response.json(
      {
        error: {
          message: 'Failed to get team activity',
          code: 'TEAM_ACTIVITY_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
