import { Prisma } from '@prisma/client';
import { userSelect } from '@/lib/pov/prisma/select';

// Basic task fields
const taskBasicFields = {
  id: true,
  title: true,
  description: true,
  assigneeId: true,
  teamId: true,
  povId: true,
  phaseId: true,
  dueDate: true,
  priority: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Task select with assignee
export const taskSelect = {
  ...taskBasicFields,
  assignee: {
    select: userSelect,
  },
} as const;

// Task select with assignee and phase
export const taskFullSelect = {
  ...taskBasicFields,
  assignee: {
    select: userSelect,
  },
  phase: {
    select: {
      id: true,
      name: true,
      type: true,
      order: true,
    },
  },
} as const;

// Task select with assignee and team
export const taskWithTeamSelect = {
  ...taskBasicFields,
  assignee: {
    select: userSelect,
  },
  team: {
    select: {
      id: true,
      name: true,
      members: {
        select: {
          user: {
            select: userSelect,
          },
        },
      },
    },
  },
} as const;

// Type definitions for Prisma selects
export type TaskSelect = typeof taskSelect;
export type TaskFullSelect = typeof taskFullSelect;
export type TaskWithTeamSelect = typeof taskWithTeamSelect;
