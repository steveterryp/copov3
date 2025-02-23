import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { createNotification } from '../services/delivery';
import { CreateNotificationRequest, Notification } from '../types';

export async function createNotificationHandler(
  req: NextRequest
): Promise<{ data: Notification }> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('Unauthorized');
  }

  const data = await req.json() as CreateNotificationRequest;

  // Validate required fields
  if (!data.title?.trim()) {
    throw new Error('Title is required');
  }
  if (!data.message?.trim()) {
    throw new Error('Message is required');
  }
  if (!data.type) {
    throw new Error('Type is required');
  }

  // Create notification
  const notification = await createNotification({
    ...data,
    userId: user.userId,
  });

  return { data: notification };
}
