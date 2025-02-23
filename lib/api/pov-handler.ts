import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHandler } from '@/lib/api-handler';
import { UserRole } from '@/lib/types/auth';

interface TeamMemberWithUser {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Check if user has access to PoV
 */
export async function checkPoVAccess(povId: string, userId: string): Promise<boolean> {
  // Get PoV with team members
  const pov = await prisma.pOV.findUnique({
    where: {
      id: povId,
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!pov) {
    return false;
  }

  // Check if user is owner
  if (pov.ownerId === userId) {
    return true;
  }

  // Check if user is team member
  if (pov.team) {
    const isMember = pov.team.members.some((member: TeamMemberWithUser) => member.userId === userId);
    if (isMember) {
      return true;
    }
  }

  return false;
}

/**
 * Get PoVs for user
 */
export const getPoVHandler = createHandler(
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

    // Parse query params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const teamId = url.searchParams.get('teamId');

    // Validate params
    if (isNaN(page) || page < 1) {
      return {
        data: null,
        error: {
          message: 'Invalid page number',
          code: 'INVALID_REQUEST',
        },
      };
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return {
        data: null,
        error: {
          message: 'Invalid page size',
          code: 'INVALID_REQUEST',
        },
      };
    }

    // Build where clause
    const where: any = {
      OR: [
        { ownerId: user.userId },
        {
          team: {
            members: {
              some: {
                userId: user.userId,
              },
            },
          },
        },
      ],
    };

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (teamId) {
      where.teamId = teamId;
    }

    // Get PoVs
    const [povs, total] = await Promise.all([
      prisma.pOV.findMany({
        where,
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
          phases: {
            include: {
              tasks: {
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
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.pOV.count({ where }),
    ]);

    return {
      data: {
        items: povs,
        total,
        page,
        pageSize,
        hasMore: total > page * pageSize,
      },
    };
  },
  {
    requireAuth: true,
    allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  }
);

/**
 * Create PoV handler
 */
export const createPoVHandler = createHandler(
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

    const data = await req.json();

    // Create PoV
    const pov = await prisma.pOV.create({
      data: {
        ...data,
        ownerId: user.userId,
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
    });

    return {
      data: pov,
    };
  },
  {
    requireAuth: true,
    allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  }
);
