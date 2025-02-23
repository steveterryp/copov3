import { prisma } from '@/lib/prisma';
import { ResourceAction, ResourceType } from '../types/auth';

export interface AuditLogMetadata {
  resourceId?: string;
  resourceType?: ResourceType;
  action?: ResourceAction;
  details?: string;
  success: boolean;
  error?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export async function trackActivity(
  userId: string,
  type: string,
  action: string,
  metadata: Partial<AuditLogMetadata> = {}
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type,
        action,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      },
    });
  } catch (error) {
    console.error('[Audit Log Error]:', error);
  }
}

export async function logPermissionCheck(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  action: ResourceAction,
  success: boolean,
  metadata: Partial<AuditLogMetadata> = {}
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type: 'PERMISSION_CHECK',
        action: success ? 'GRANTED' : 'DENIED',
        metadata: {
          resourceType,
          resourceId,
          action,
          success,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      },
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not block operations
    console.error('[Audit Log Error]:', error);
  }
}

export async function logRoleChange(
  userId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  metadata: Partial<AuditLogMetadata> = {}
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type: 'ROLE_CHANGE',
        action: 'UPDATE',
        metadata: {
          targetUserId,
          oldRole,
          newRole,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      },
    });
  } catch (error) {
    console.error('[Audit Log Error]:', error);
  }
}

export async function logTeamMembershipChange(
  userId: string,
  targetUserId: string,
  teamId: string,
  action: 'ADD' | 'REMOVE',
  metadata: Partial<AuditLogMetadata> = {}
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type: 'TEAM_MEMBERSHIP',
        action,
        metadata: {
          targetUserId,
          teamId,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      },
    });
  } catch (error) {
    console.error('[Audit Log Error]:', error);
  }
}

export async function logPermissionChange(
  userId: string,
  resourceType: ResourceType,
  action: ResourceAction,
  oldValue: boolean,
  newValue: boolean,
  metadata: Partial<AuditLogMetadata> = {}
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId,
        type: 'PERMISSION_CHANGE',
        action: 'UPDATE',
        metadata: {
          resourceType,
          action,
          oldValue,
          newValue,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      },
    });
  } catch (error) {
    console.error('[Audit Log Error]:', error);
  }
}

export async function getAuditLogs(
  filters: {
    userId?: string;
    type?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    resourceType?: ResourceType;
    resourceId?: string;
  },
  pagination: {
    page: number;
    limit: number;
  }
): Promise<{
  activities: any[];
  pagination: {
    total: number;
    pages: number;
    current: number;
    limit: number;
  };
  filters: {
    types: string[];
    actions: string[];
  };
}> {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.type) where.type = filters.type;
  if (filters.action) where.action = filters.action;
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  if (filters.resourceType || filters.resourceId) {
    where.metadata = {
      path: ['resourceType'],
      equals: filters.resourceType,
    };
  }

  // Get audit logs with pagination
  const [total, activities] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
  ]);

  // Get distinct types and actions
  const [distinctTypes, distinctActions] = await Promise.all([
    prisma.activity.findMany({
      select: {
        type: true,
      },
      distinct: ['type'],
    }),
    prisma.activity.findMany({
      select: {
        action: true,
      },
      distinct: ['action'],
    }),
  ]);

  return {
    activities,
    pagination: {
      total,
      pages: Math.ceil(total / pagination.limit),
      current: pagination.page,
      limit: pagination.limit,
    },
    filters: {
      types: distinctTypes.map((t: { type: string }) => t.type),
      actions: distinctActions.map((a: { action: string }) => a.action),
    },
  };
}
