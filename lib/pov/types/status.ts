import { POVStatus } from '@prisma/client';
import { PoVResponse } from './core';

export type StatusCondition = {
  type: 'KPI' | 'PHASE' | 'CUSTOM';
  check: (pov: PoVResponse) => Promise<boolean>;
  errorMessage: string;
};

export type NotificationConfig = {
  roles: string[];
  template: string;
  data?: Record<string, any>;
};

export type StatusTransition = {
  from: POVStatus;
  to: POVStatus;
  conditions: StatusCondition[];
  notifications: NotificationConfig[];
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type StatusTransitionError = {
  type: 'INVALID_TRANSITION' | 'CONDITION_NOT_MET' | 'CUSTOM';
  message: string;
  details?: Record<string, any>;
};

export type StatusTransitionResult = {
  success: boolean;
  newStatus?: POVStatus;
  errors?: StatusTransitionError[];
  notifications?: NotificationConfig[];
};
