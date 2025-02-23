import { prisma } from '@/lib/prisma';
import { ResourceAction, ResourceType, UserRole, rolePermissions } from '../types/auth';
import { TeamRole } from '../types/team';
import { permissionCache, teamMembershipCache } from './cache';
import { logPermissionCheck } from './audit';

import { Resource } from '../types/auth';

interface User {
  id: string;
  role: UserRole;
}

async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  return await teamMembershipCache.get(
    { userId, teamId },
    async () => {
      const membership = await prisma.teamMember.findFirst({
        where: {
          userId,
          teamId,
          OR: [
            { role: TeamRole.MEMBER },
            { role: TeamRole.OWNER }
          ]
        },
      });
      return !!membership;
    }
  );
}

async function checkResourceOwnership(userId: string, resource: Resource): Promise<boolean> {
  return resource.ownerId === userId;
}

async function checkTeamAccess(userId: string, resource: Resource): Promise<boolean> {
  if (!resource.teamId) return false;
  return await isTeamMember(userId, resource.teamId);
}

async function evaluatePermissionConditions(
  user: User,
  resource: Resource,
  permission: { conditions?: { isOwner?: boolean; isTeamMember?: boolean; hasRole?: UserRole[] } }
): Promise<boolean> {
  if (!permission.conditions) return true;

  // Check role conditions first
  if (permission.conditions.hasRole && permission.conditions.hasRole.length > 0) {
    if (!permission.conditions.hasRole.includes(user.role)) {
      return false;
    }
  }

  // For ownership and team membership, allow access if either condition is met
  const ownershipPromise = permission.conditions.isOwner 
    ? checkResourceOwnership(user.id, resource)
    : Promise.resolve(false);

  const teamMembershipPromise = permission.conditions.isTeamMember
    ? checkTeamAccess(user.id, resource)
    : Promise.resolve(false);

  const [isOwner, isTeamMember] = await Promise.all([ownershipPromise, teamMembershipPromise]);

  // If neither condition is required, return true
  if (!permission.conditions.isOwner && !permission.conditions.isTeamMember) {
    return true;
  }

  // If only ownership is required
  if (permission.conditions.isOwner && !permission.conditions.isTeamMember) {
    return isOwner;
  }

  // If only team membership is required
  if (!permission.conditions.isOwner && permission.conditions.isTeamMember) {
    return isTeamMember;
  }

  // If either condition is sufficient
  return isOwner || isTeamMember;
}

export async function checkPermission(
  user: User,
  resource: Resource,
  action: ResourceAction,
  context: { ip?: string; userAgent?: string } = {}
): Promise<boolean> {
  // Super Admin bypass
  if (user.role === UserRole.SUPER_ADMIN) {
    await logPermissionCheck(
      user.id,
      resource.type,
      resource.id,
      action,
      true,
      { ...context, reason: 'SUPER_ADMIN_BYPASS' }
    );
    return true;
  }

  // Check cache first
  return await permissionCache.get(
    {
      userId: user.id,
      resourceType: resource.type,
      resourceId: resource.id,
      action,
    },
    async () => {
      try {
        // Get user's role permissions from database
        const rolePermission = await prisma.rolePermission.findUnique({
          where: {
            role_resourceType_action: {
              role: user.role,
              resourceType: resource.type,
              action: action,
            },
          },
        });

        if (!rolePermission) {
          await logPermissionCheck(
            user.id,
            resource.type,
            resource.id,
            action,
            false,
            { ...context, error: 'PERMISSION_NOT_FOUND' }
          );
          return false;
        }

        // Check if permission is enabled
        const hasPermission = rolePermission.enabled;

        await logPermissionCheck(
          user.id,
          resource.type,
          resource.id,
          action,
          hasPermission,
          {
            ...context,
            enabled: rolePermission.enabled,
            reason: hasPermission ? 'CONDITIONS_MET' : 'CONDITIONS_NOT_MET'
          }
        );

        return hasPermission;
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        console.error('[Permission Check Error]:', errorMessage);
        await logPermissionCheck(
          user.id,
          resource.type,
          resource.id,
          action,
          false,
          { ...context, error: errorMessage }
        );
        return false;
      }
    }
  );
}

export async function checkPermissions(
  user: User,
  resource: Resource,
  actions: ResourceAction[]
): Promise<Record<ResourceAction, boolean>> {
  const results = await Promise.all(
    actions.map(action => checkPermission(user, resource, action))
  );

  return actions.reduce((acc, action, index) => {
    acc[action] = results[index];
    return acc;
  }, {} as Record<ResourceAction, boolean>);
}

export function invalidateUserPermissions(userId: string): void {
  permissionCache.invalidateUserPermissions(userId);
  teamMembershipCache.invalidateUserTeams(userId);
}

export function invalidateResourcePermissions(resourceType: ResourceType, resourceId: string): void {
  permissionCache.invalidateResourcePermissions(resourceType, resourceId);
}

export function invalidateTeamPermissions(teamId: string): void {
  teamMembershipCache.invalidateTeam(teamId);
}
