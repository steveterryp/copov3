import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/api-handler';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/types/auth';
import { POVStatus } from '@prisma/client';

/**
 * Get POV overview statistics
 */
export const GET = createHandler(
  async (req: NextRequest, context, user) => { // Receive user object

    // Get POV statistics
    const [
      totalPoVs,
      draftPoVs,
      inProgressPoVs,
      completedPoVs,
      recentPoVs,
    ] = await Promise.all([
      // Total PoVs
      prisma.pOV.count({
        where: {
          ownerId: user!.userId, // Use user!.userId (non-null assertion)
        },
      }),
      // Draft PoVs
      prisma.pOV.count({
        where: {
          ownerId: user!.userId, // Use user!.userId (non-null assertion)
          status: POVStatus.PROJECTED,
        },
      }),
      // In Progress PoVs
      prisma.pOV.count({
        where: {
          ownerId: user!.userId, // Use user!.userId (non-null assertion)
          status: POVStatus.IN_PROGRESS,
        },
      }),
      // Completed PoVs
      prisma.pOV.count({
        where: {
          ownerId: user!.userId, // Use user!.userId (non-null assertion)
          status: POVStatus.WON,
        },
      }),
      // Recent PoVs
      prisma.pOV.findMany({
        where: {
          ownerId: user!.userId, // Use user!.userId (non-null assertion)
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 5,
      }),
    ]);

    return {
      data: {
        total: totalPoVs,
        projected: draftPoVs,
        inProgress: inProgressPoVs,
        won: completedPoVs,
        recent: recentPoVs,
      },
    };
  },
  {
    requireAuth: true,
    allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  }
);
