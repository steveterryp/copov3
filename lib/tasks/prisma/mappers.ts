import { TaskPriority as PrismaTaskPriority, TaskStatus as PrismaTaskStatus } from '@prisma/client';
import { TaskPriority, TaskStatus, Task } from '../types/index';

export function mapPrismaTaskPriority(priority: PrismaTaskPriority): TaskPriority {
  return priority as unknown as TaskPriority; // Safe cast since enums match
}

export function mapPrismaTaskStatus(status: PrismaTaskStatus): TaskStatus {
  return status as unknown as TaskStatus; // Safe cast since enums match
}

export function mapTaskFromPrisma(task: any): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    assigneeId: task.assigneeId,
    teamId: task.teamId,
    povId: task.povId,
    phaseId: task.phaseId,
    dueDate: task.dueDate?.toISOString() || null,
    priority: mapPrismaTaskPriority(task.priority),
    status: mapPrismaTaskStatus(task.status),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}
