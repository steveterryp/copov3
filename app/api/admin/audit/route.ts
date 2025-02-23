import { NextRequest } from 'next/server';
import { getAdminActivitiesHandler } from '@/lib/admin/handlers/activity';
import createHandler from '@/lib/api-handler';
import { UserRole } from '@/lib/types/auth';

export const GET = createHandler(
  async (req: NextRequest, context, user) => {
    if (!user) {
      return {
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      };
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return {
        error: {
          message: 'Forbidden',
          code: 'FORBIDDEN',
        },
      };
    }

    return getAdminActivitiesHandler(req, context, user);
  },
  {
    requireAuth: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  }
);
