import { z } from 'zod';
import { POVStatus, Priority } from '@prisma/client';
import { PhaseType } from '@/lib/types/phase';

export const povSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startDate: z.date(),
  endDate: z.date(),
  teamId: z.string().optional(),
  metadata: z.object({
    customer: z.string(),
    teamSize: z.string(),
    successCriteria: z.string(),
    technicalRequirements: z.string(),
  }),
});

export const createPoVSchema = povSchema.extend({
  status: z.nativeEnum(POVStatus).default(POVStatus.PROJECTED),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
});

export const updatePoVSchema = povSchema.partial().extend({
  status: z.nativeEnum(POVStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
});

export const phaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.nativeEnum(PhaseType),
  startDate: z.date(),
  endDate: z.date(),
  order: z.number().optional(),
});

export const createPhaseSchema = phaseSchema;
export const updatePhaseSchema = phaseSchema.partial();
