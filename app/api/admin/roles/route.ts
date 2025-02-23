import { createHandler } from '@/lib/api-handler';
import { getAdminRolesHandler, createRoleHandler } from '@/lib/admin/handlers/role';
import { Role } from '@/lib/admin/types';
import { UserRole } from '@/lib/types/auth';

// Use Role[] for GET since it returns an array of roles
export const GET = createHandler<Role[]>(getAdminRolesHandler, { 
  requireAuth: true,
  allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
});

export const POST = createHandler<Role>(createRoleHandler, { 
  requireAuth: true,
  allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
});
