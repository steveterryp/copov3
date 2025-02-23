import { prisma } from '@/lib/prisma';
import { TaskPriority, TaskStatus, CreateTaskData } from '../types/index';
import { taskFullSelect, taskSelect } from '../prisma/select';
import { TaskPriority as PrismaTaskPriority, TaskStatus as PrismaTaskStatus } from '@prisma/client';
import { userSelect } from '@/lib/pov/prisma/select';
import { createNotification } from '@/lib/notifications/services/delivery';
import { NotificationType } from '@/lib/notifications/types';

export class TaskService {
  /**
   * Send notification to task assignee
   */
  private static async sendAssigneeNotification(
    taskId: string,
    assigneeId: string,
    taskTitle: string,
    povId: string | null
  ) {
    try {
      if (!povId) return; // Skip if no PoV is associated

      // Get PoV owner's name
      const pov = await prisma.pOV.findUnique({
        where: { id: povId },
        include: {
          owner: {
            select: { name: true }
          }
        }
      });

      if (!pov) return;

      // Get phase ID for the task
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { phaseId: true }
      });

      if (!task?.phaseId) return;

      // Create notification
      await createNotification({
        type: NotificationType.INFO,
        title: 'New Task Assignment',
        message: `Assigned task ${taskTitle} by ${pov.owner.name}`,
        userId: assigneeId,
        actionUrl: `/pov/${povId}/phase/${task.phaseId}/tasks`
      });
    } catch (error) {
      console.error('[TaskService.sendAssigneeNotification]:', error);
      // Don't throw error as this is a non-critical operation
    }
  }

  /**
   * Create a new task
   */
  static async createTask(data: CreateTaskData) {
    try {
      // Validate assignee if provided
      if (data.assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: data.assigneeId },
        });
        if (!assignee) {
          throw new Error('Invalid assignee');
        }
      }

      const task = await prisma.task.create({
        data: {
          title: data.title,
          description: data.description || null,
          assigneeId: data.assigneeId || null,
          povId: data.povId || null,
          phaseId: data.phaseId || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          priority: (data.priority || TaskPriority.MEDIUM) as PrismaTaskPriority,
          status: (data.status || TaskStatus.OPEN) as PrismaTaskStatus,
        },
        select: taskFullSelect,
      });

      // Send notification if task has an assignee
      if (task.assigneeId) {
        await this.sendAssigneeNotification(
          task.id,
          task.assigneeId,
          task.title,
          task.povId
        );
      }

      return task;
    } catch (error) {
      console.error('[TaskService.createTask]:', error);
      throw error;
    }
  }

  /**
   * Get tasks for a phase
   */
  static async getPhaseTasks(phaseId: string) {
    try {
      const tasks = await prisma.task.findMany({
        where: { phaseId },
        select: taskSelect,
        orderBy: { createdAt: 'asc' },
      });

      return tasks;
    } catch (error) {
      console.error('[TaskService.getPhaseTasks]:', error);
      throw error;
    }
  }

  /**
   * Get a single task by ID
   */
  static async getTask(taskId: string) {
    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: taskFullSelect,
      });

      if (!task) return null;
      return task;
    } catch (error) {
      console.error('[TaskService.getTask]:', error);
      throw error;
    }
  }

  /**
   * Update a task
   */
  static async updateTask(taskId: string, data: Partial<CreateTaskData>) {
    try {
      // Validate assignee if provided
      if (data.assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: data.assigneeId },
        });
        if (!assignee) {
          throw new Error('Invalid assignee');
        }
      }

      // Validate task exists
      const existingTask = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!existingTask) {
        throw new Error('Task not found');
      }

      // Clean and transform data
      const updateData = {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.priority !== undefined && { priority: data.priority as PrismaTaskPriority }),
        ...(data.status !== undefined && { status: data.status as PrismaTaskStatus }),
      };

      console.log('[TaskService.updateTask] Update data:', updateData);

      const task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        select: taskFullSelect,
      });

      // Send notification if assignee was added or changed
      if (data.assigneeId && (!existingTask.assigneeId || existingTask.assigneeId !== data.assigneeId)) {
        await this.sendAssigneeNotification(
          task.id,
          data.assigneeId,
          task.title,
          task.povId
        );
      }

      return task;
    } catch (error) {
      console.error('[TaskService.updateTask]:', error);
      if (error instanceof Error) {
        if (error.message.includes('Record to update not found')) {
          throw new Error('Task not found');
        }
        if (error.message.includes('Unique constraint failed')) {
          throw new Error('Task with this title already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Delete a task
   */
  static async deleteTask(taskId: string) {
    try {
      await prisma.task.delete({
        where: { id: taskId },
      });
    } catch (error) {
      console.error('[TaskService.deleteTask]:', error);
      throw error;
    }
  }

  /**
   * Get available assignees for a task
   */
  static async getAvailableAssignees(teamId: string) {
    try {
      const teamMembers = await prisma.teamMember.findMany({
        where: {
          teamId,
        },
        include: {
          user: {
            select: userSelect,
          },
        },
      });

      // Filter active users and map to user list
      return teamMembers
        .filter(member => member.user.status === 'ACTIVE')
        .map(member => member.user);
    } catch (error) {
      console.error('[TaskService.getAvailableAssignees]:', error);
      throw error;
    }
  }
}
