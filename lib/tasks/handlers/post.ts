import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TokenPayload } from '@/lib/types/auth';
import { ResourceAction, ResourceType } from '@/lib/types/auth';
import { CreateTaskData, TaskResponse } from '../types/index';
import { taskFullSelect } from '../prisma/select';
import { mapTaskFromPrisma } from '../prisma/mappers';
import auth from '@/lib/auth';

type ApiHandler<T = any> = (
  req: NextRequest,
  context: { params: Record<string, string> },
  user: TokenPayload
) => Promise<T | { error: { message: string; code: string } }>;

// Map TokenPayload to User for permission checks
const mapTokenToUser = (token: TokenPayload) => ({
  id: token.userId,
  email: token.email,
  role: token.role,
});

export const createTaskHandler: ApiHandler<TaskResponse> = async (
  req: NextRequest,
  _context: { params: Record<string, string> },
  user: TokenPayload
) => {
  const data = (await req.json()) as CreateTaskData;

  // Check permissions
  const hasPermission = await auth.permissions.checkPermission(
    mapTokenToUser(user),
    {
      id: '*',
      type: ResourceType.TASK,
      teamId: data.teamId || undefined
    },
    ResourceAction.CREATE
  );

  if (!hasPermission) {
    return {
      error: {
        message: 'Forbidden',
        code: 'FORBIDDEN',
      },
    };
  }

  // Create task with proper data mapping
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      assigneeId: data.assigneeId || null,
      teamId: data.teamId || null,
      povId: data.povId || null,
      phaseId: data.phaseId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'OPEN',
    },
    select: taskFullSelect,
  });

  return { data: mapTaskFromPrisma(task) };
};
