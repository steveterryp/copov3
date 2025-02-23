import { Prisma } from '@prisma/client';

export interface LaunchChecklistItem {
  key: string;
  label: string;
  description?: string;
  completed: boolean;
  metadata?: {
    url?: string;
    [key: string]: any;
  };
}

export interface LaunchChecklist {
  items: LaunchChecklistItem[];
}

export type LaunchChecklistUpdate = {
  key: string;
  completed: boolean;
};

export type LaunchStatus = 'NOT_INITIATED' | 'IN_PROGRESS' | 'LAUNCHED';

export interface LaunchStatusResponse {
  status: LaunchStatus;
  checklist: Prisma.JsonValue | null;
  launchedAt: Date | null;
  launchedBy: string | null;
}

export interface LaunchValidation {
  valid: boolean;
  errors: string[];
}
