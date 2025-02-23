import { Task } from './task';
import { Phase } from './phase';
import { POVStatus, Priority, PhaseType } from '@prisma/client';

// Re-export Prisma types
export { POVStatus, Priority, PhaseType };

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface PoVMetadata {
  customer: string;
  teamSize: string;
  successCriteria: string;
  technicalRequirements: string;
}

export interface PoV {
  id: string;
  title: string;
  description: string;
  status: POVStatus;
  priority: Priority;
  startDate: Date;
  endDate: Date;
  ownerId: string;
  teamId?: string;
  metadata?: PoVMetadata;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  team?: Team;
  phases?: Phase[];
}
