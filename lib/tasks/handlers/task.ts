import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { ResourceAction, ResourceType, UserRole } from '@/lib/types/auth';
import { checkPermission } from '@/lib/auth/permissions';
import { TaskService } from '../services/task';
import { TaskResponse, TaskPriority, TaskStatus } from '../types/index';
import { mapTaskFromPrisma } from '../prisma/mappers';

/**
 * Create task handler
 */
export async function createTaskHandler(
  req: NextRequest,
  povId: string,
  phaseId: string,
  data: {
    title: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
  }
): Promise<TaskResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get PoV for permission check
  const pov = await prisma.pOV.findUnique({
    where: { id: povId },
    select: { ownerId: true, teamId: true },
  });

  if (!pov) {
    throw new Error('PoV not found');
  }

  // Check create permission on PoV
  const hasCreatePermission = await checkPermission(
    { id: user.userId, role: user.role as UserRole },
    { id: povId, type: ResourceType.PoV, ownerId: pov.ownerId, teamId: pov.teamId || undefined },
    ResourceAction.EDIT // Using EDIT permission since task creation is part of PoV editing
  );

  if (!hasCreatePermission) {
    throw new Error('Permission denied - requires EDIT access to PoV');
  }

  // Validate required fields
  if (!data.title) {
    throw new Error('Title is required');
  }

  // Create task
  const task = await TaskService.createTask({
    ...data,
    povId,
    phaseId,
  });

  return {
    data: mapTaskFromPrisma(task),
  };
}

/**
 * Update task handler
 */
export async function updateTaskHandler(
  req: NextRequest,
  povId: string,
  phaseId: string,
  taskId: string,
  data: {
    title?: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
  }
): Promise<TaskResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get PoV for permission check
  const pov = await prisma.pOV.findUnique({
    where: { id: povId },
    select: { ownerId: true, teamId: true },
  });

  if (!pov) {
    throw new Error('PoV not found');
  }

  // Check edit permission on PoV
  const hasEditPermission = await checkPermission(
    { id: user.userId, role: user.role as UserRole },
    { id: povId, type: ResourceType.PoV, ownerId: pov.ownerId, teamId: pov.teamId || undefined },
    ResourceAction.EDIT
  );

  if (!hasEditPermission) {
    throw new Error('Permission denied - requires EDIT access to PoV');
  }

  // Validate task exists and belongs to the phase
  const existingTask = await TaskService.getTask(taskId);
  if (!existingTask) {
    throw new Error('Task not found');
  }
  if (existingTask.phaseId !== phaseId) {
    throw new Error('Task does not belong to this phase');
  }

  // Validate required fields
  if (data.title !== undefined && !data.title.trim()) {
    throw new Error('Title cannot be empty');
  }

  // Update task
  const task = await TaskService.updateTask(taskId, data);

  return {
    data: mapTaskFromPrisma(task),
  };
}

/**
 * Get single task handler
 */
export async function getTaskHandler(
  req: NextRequest,
  povId: string,
  phaseId: string,
  taskId: string
): Promise<TaskResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get PoV for permission check
  const pov = await prisma.pOV.findUnique({
    where: { id: povId },
    select: { ownerId: true, teamId: true },
  });

  if (!pov) {
    throw new Error('PoV not found');
  }

  // Check view permission on PoV
  const hasViewPermission = await checkPermission(
    { id: user.userId, role: user.role as UserRole },
    { id: povId, type: ResourceType.PoV, ownerId: pov.ownerId, teamId: pov.teamId || undefined },
    ResourceAction.VIEW
  );

  if (!hasViewPermission) {
    throw new Error('Permission denied - requires VIEW access to PoV');
  }

  const task = await TaskService.getTask(taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  // Verify task belongs to the specified phase
  if (task.phaseId !== phaseId) {
    throw new Error('Task does not belong to this phase');
  }

  return {
    data: mapTaskFromPrisma(task),
  };
}

/**
 * Get phase tasks handler
 */
export async function getPhaseTasksHandler(
  req: NextRequest,
  povId: string,
  phaseId: string
): Promise<{ data: any[] }> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get PoV for permission check
  const pov = await prisma.pOV.findUnique({
    where: { id: povId },
    select: { ownerId: true, teamId: true },
  });

  if (!pov) {
    throw new Error('PoV not found');
  }

  // Check view permission on PoV
  const hasViewPermission = await checkPermission(
    { id: user.userId, role: user.role as UserRole },
    { id: povId, type: ResourceType.PoV, ownerId: pov.ownerId, teamId: pov.teamId || undefined },
    ResourceAction.VIEW
  );

  if (!hasViewPermission) {
    throw new Error('Permission denied - requires VIEW access to PoV');
  }

  const tasks = await TaskService.getPhaseTasks(phaseId);
  
  return {
    data: tasks.map(mapTaskFromPrisma),
  };
}
