import { prisma, type PrismaClient } from '@/lib/prisma';
import { activityWithUserSelect } from '../prisma/select';
import { Activity, ActivityFilters, ActivityListData } from '../types';

type ActivityWithUser = Awaited<ReturnType<PrismaClient['activity']['findUnique']>> & {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export class AdminActivityService {
  /**
   * Get activity logs with filters and pagination
   */
  static async getActivities(filters: ActivityFilters): Promise<ActivityListData> {
    try {
      const {
        userId,
        type,
        action,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = filters;

      // Build where clause
      const where: any = {};
      if (userId) where.userId = userId;
      if (type) where.type = type;
      if (action) where.action = action;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Get activities with pagination and filter options
      const [activities, total, types, actions] = await Promise.all([
        prisma.activity.findMany({
          where,
          select: activityWithUserSelect,
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.activity.count({ where }),
        prisma.activity.findMany({
          select: { type: true },
          distinct: ['type'],
          orderBy: { type: 'asc' },
        }),
        prisma.activity.findMany({
          select: { action: true },
          distinct: ['action'],
          orderBy: { action: 'asc' },
        }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        activities: (activities as ActivityWithUser[]).map((activity) => ({
          id: activity.id,
          userId: activity.userId,
          type: activity.type,
          action: activity.action,
          metadata: activity.metadata as Record<string, any> | undefined,
          createdAt: activity.createdAt.toISOString(),
          user: {
            name: activity.user.name,
            email: activity.user.email,
            role: activity.user.role,
          },
        })),
        pagination: {
          total,
          pages,
          current: page,
          limit,
          pageSize: activities.length,
          hasMore: page < pages,
        },
        filters: {
          types: types.map((t: { type: string }) => t.type),
          actions: actions.map((a: { action: string }) => a.action),
        },
      };
    } catch (error) {
      console.error('[AdminActivityService.getActivities]:', error);
      throw error;
    }
  }

  /**
   * Log a new activity
   */
  static async logActivity(data: {
    userId: string;
    type: string;
    action: string;
    metadata?: Record<string, any>;
  }): Promise<Activity> {
    try {
      const activity = await prisma.activity.create({
        data,
        select: activityWithUserSelect,
      }) as ActivityWithUser;

      return {
        id: activity.id,
        userId: activity.userId,
        type: activity.type,
        action: activity.action,
        metadata: activity.metadata as Record<string, any> | undefined,
        createdAt: activity.createdAt.toISOString(),
        user: {
          name: activity.user.name,
          email: activity.user.email,
          role: activity.user.role,
        },
      };
    } catch (error) {
      console.error('[AdminActivityService.logActivity]:', error);
      throw error;
    }
  }
}
