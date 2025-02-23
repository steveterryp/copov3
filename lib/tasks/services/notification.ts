import { prisma } from '@/lib/prisma';

export async function createTaskAssignedNotification(data: {
  userId: string;
  taskId: string;
  taskTitle: string;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      message: `You have been assigned to task: ${data.taskTitle}`,
      type: 'TASK_ASSIGNED',
      actionUrl: `/tasks/${data.taskId}`,
    },
  });
}
