import { createHandler } from '@/lib/api-handler';
import { getTasksHandler } from '@/lib/tasks/handlers/get';
import { createTaskHandler } from '@/lib/tasks/handlers/post';
import { Task } from '@/lib/types/task';
import { NextRequest } from 'next/server';
import { TokenPayload, ApiResponse } from '@/lib/types/auth';

type ApiHandler<T = any> = (
  req: NextRequest,
  context: { params: Record<string, string> },
  user?: TokenPayload
) => Promise<Response | ApiResponse<T>>;

// Wrapper to match the expected type signature
const getTasksWrapper: ApiHandler<Task[]> = async (
  req: NextRequest,
  context: { params: Record<string, string> },
  user?: TokenPayload
) => {
  if (!user) {
    return {
      error: {
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      },
    };
  }
  const result = await getTasksHandler(req, context, user);
  if ('error' in result) {
    return result;
  }
  return { data: result.data };
};

// Wrapper to match the expected type signature
const createTaskWrapper: ApiHandler<Task> = async (
  req: NextRequest,
  context: { params: Record<string, string> },
  user?: TokenPayload
) => {
  if (!user) {
    return {
      error: {
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
      },
    };
  }
  const result = await createTaskHandler(req, context, user);
  if ('error' in result) {
    return result;
  }
  return { data: result.data };
};

export const GET = createHandler(getTasksWrapper, { requireAuth: true });
export const POST = createHandler(createTaskWrapper, { requireAuth: true });
