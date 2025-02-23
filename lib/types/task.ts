import { ApiResponse, User } from '@/lib/types/auth';
import { Team } from '@/lib/types/team';
import { PoV } from '@/lib/types/pov';
import { Phase } from '@/lib/types/phase';
import { TaskPriority, TaskStatus } from '@prisma/client';

// Re-export Prisma types
export { TaskPriority, TaskStatus };

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  assignee?: User;
  teamId: string | null;
  team?: Team;
  povId: string | null;
  pov?: PoV;
  phaseId: string | null;
  phase?: Phase;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListResponse extends ApiResponse<Task[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface TaskResponse extends ApiResponse<Task> {}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: string;
  user?: User;
}

export interface Attachment {
  id: string;
  taskId: string;
  filename: string;
  fileSize: number;
  fileType: string;
  storageUrl: string;
  createdAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  timestamp: string;
  user?: User;
}

export interface CommentListResponse extends ApiResponse<Comment[]> {}
export interface AttachmentListResponse extends ApiResponse<Attachment[]> {}
export interface TaskActivityListResponse extends ApiResponse<TaskActivity[]> {}
