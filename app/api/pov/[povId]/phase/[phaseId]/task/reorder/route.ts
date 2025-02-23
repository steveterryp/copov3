import { NextRequest } from 'next/server';
import { createHandler } from '@/lib/api-handler';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/types/auth';
import { checkPoVAccess } from '@/lib/api/pov-handler';

interface ReorderData {
  taskIds: string[];
}

/**
 * Reorder tasks
 */
export const POST = createHandler(
  async (req: NextRequest, context, user) => {
    if (!user) {
      return {
        data: null,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      };
    }

    const phaseId = context.params.phaseId;
    if (!phaseId) {
      return {
        data: null,
        error: {
          message: 'Phase ID is required',
          code: 'INVALID_REQUEST',
        },
      };
    }

    // Get phase with PoV access check
    const phase = await prisma.phase.findUnique({
      where: {
        id: phaseId,
      },
      include: {
        pov: true,
      },
    });

    if (!phase) {
      return {
        data: null,
        error: {
          message: 'Phase not found',
          code: 'NOT_FOUND',
        },
      };
    }

    // Check PoV access
    const hasAccess = await checkPoVAccess(phase.pov.id, user.userId);
    if (!hasAccess) {
      return {
        data: null,
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN',
        },
      };
    }

    // Get reorder data
    const data: ReorderData = await req.json();
    if (!data.taskIds?.length) {
      return {
        data: null,
        error: {
          message: 'Task IDs are required',
          code: 'INVALID_REQUEST',
        },
      };
    }

    // Update task orders
    const tasks = await Promise.all(
      data.taskIds.map((taskId, index) =>
        prisma.task.update({
          where: {
            id: taskId,
            phaseId,
          },
          data: {
            updatedAt: new Date(Date.now() + index * 1000), // Space updates 1 second apart
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
              },
            },
            comments: {
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
            },
          },
        })
      )
    );

    return {
      data: tasks,
    };
  },
  {
    requireAuth: true,
    allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  }
);
