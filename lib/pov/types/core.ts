import { POVStatus, Priority, PhaseType, TaskStatus, TaskPriority, KPIType, Prisma } from '@prisma/client';

// Re-export prisma types
export { POVStatus, Priority, PhaseType, TaskStatus, TaskPriority, KPIType };
import { KPIHistoryEntry } from './kpi';

export type PoVMetadata = {
  customer: string;
  teamSize: string;
  successCriteria: string;
  technicalRequirements: string;
  [key: string]: any;
};

export type PoVSummary = {
  id: string;
  title: string;
  description: string;
  status: POVStatus;
  priority: Priority;
  startDate: Date;
  endDate: Date;
  ownerId: string;
  teamId: string | null;
  metadata: PoVMetadata;
  createdAt: Date;
  updatedAt: Date;
};

export type PoVDetails = {
  id: string;
  title: string;
  description: string;
  status: POVStatus;
  priority: Priority;
  startDate: Date;
  endDate: Date;
  ownerId: string;
  teamId: string | null;
  metadata: PoVMetadata;
  createdAt: Date;
  updatedAt: Date;
  team?: { id: string; name: string } | null;
  owner?: { id: string; name: string; email: string };
  phases?: Array<PhaseResponse>;
};

export type Phase = {
  id: string;
  name: string;
  description: string;
  type: PhaseType;
  startDate: Date;
  endDate: Date;
  order: number;
  povId: string;
  details: PhaseDetails;
  createdAt: Date;
  updatedAt: Date;
};

export type PhaseTask = {
  key: string;
  completed: boolean;
  required: boolean;
  dependencies?: string[];
  notes?: string;
  completedAt?: Date;
  completedBy?: string;
};

export type PhaseDetails = {
  tasks: PhaseTask[];
  metadata?: Record<string, any>;
};

export type TaskResponse = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  teamId: string | null;
  assigneeId: string | null;
  povId: string | null;
  phaseId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PhaseResponse = Phase & {
  tasks: TaskResponse[];
};


export type PoVCreateInput = Prisma.POVCreateInput;
export type PoVUpdateInput = Prisma.POVUpdateInput;
export type PoVWhereInput = Prisma.POVWhereInput;
export type PoVOrderByWithRelationInput = Prisma.POVOrderByWithRelationInput;

export type PoVFilters = {
  status?: POVStatus;
  priority?: Priority;
  ownerId?: string;
  teamId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
};

export type PoVResponse = PoVDetails;

export type PoVSort = {
  field: keyof PoVDetails;
  direction: 'asc' | 'desc';
};

export type KPITemplateResponse = {
  id: string;
  name: string;
  type: KPIType;
  calculation: string | null;
  visualization: string | null;
};

export type KPIResponse = {
  id: string;
  povId: string;
  templateId: string | null;
  name: string;
  target: any;
  current: any;
  history: KPIHistoryEntry[];
  weight: number | null;
  createdAt: Date;
  updatedAt: Date;
  template: KPITemplateResponse | null;
};
