import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenPayload } from '@/lib/types/auth';
import { ResourceAction, ResourceType } from '@/lib/types/auth';
import { TaskPriority, TaskStatus, TaskListResponse } from '../types/index';
import { taskFullSelect } from '../prisma/select';
import { mapTaskFromPrisma } from '../prisma/mappers';
import auth from '@/lib/auth';

type ApiHandler<T = any> = (
  req: NextRequest,
  context: { params: Record<string, string> },
  user: TokenPayload
) => Promise<T | { error: { message: string; code: string } }>;

export const getTasksHandler: ApiHandler<TaskListResponse> = async (
  req: NextRequest,
  _context: { params: Record<string, string> },
  user: TokenPayload
) => {
  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  const status = url.searchParams.get('status') as TaskStatus | null;
  const priority = url.searchParams.get('priority') as TaskPriority | null;
  const assigneeId = url.searchParams.get('assigneeId');
  const teamId = url.searchParams.get('teamId');
  const povId = url.searchParams.get('povId');
  const phaseId = url.searchParams.get('phaseId');

  // Build where clause
  const where: any = {};
  if (status) where.status = { equals: status };
  if (priority) where.priority = { equals: priority };
  if (assigneeId) where.assigneeId = assigneeId;
  if (teamId) where.teamId = teamId;
  if (povId) where.povId = povId;
  if (phaseId) where.phaseId = phaseId;

  // Check permissions
  const hasPermission = await auth.permissions.checkPermission(
    mapTokenToUser(user),
    {
      id: '*',
      type: ResourceType.TASK,
      teamId: teamId || undefined
    },
    ResourceAction.VIEW
  );

  if (!hasPermission) {
    return {
      error: {
        message: 'Forbidden',
        code: 'FORBIDDEN',
      },
    };
  }

  // Get tasks with pagination
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      select: taskFullSelect,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.task.count({ where }),
  ]);

  // Map Prisma models to domain types
  const formattedTasks = tasks.map(mapTaskFromPrisma);

  return {
    data: formattedTasks,
    total,
    page,
    pageSize,
  };
};

// Map TokenPayload to User for permission checks
const mapTokenToUser = (token: TokenPayload) => ({
  id: token.userId,
  email: token.email,
  role: token.role,
});
