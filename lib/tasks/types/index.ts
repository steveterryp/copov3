export enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  teamId: string | null;
  povId: string | null;
  phaseId: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assigneeId?: string;
  teamId?: string;
  povId?: string;
  phaseId?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {}

export interface TaskResponse {
  data: Task;
}

export interface TaskListResponse {
  data: Task[];
}
