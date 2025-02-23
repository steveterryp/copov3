import { z } from 'zod';

// Basic Info Schema
const basicInfoSchema = z.object({
  name: z.string().min(1, 'PoV name is required'),
  customer: z.string().min(1, 'Customer name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required')
    .refine((date) => new Date(date) > new Date(), {
      message: 'End date must be in the future'
    }),
  objective: z.string().min(10, 'Objective must be at least 10 characters'),
  solution: z.string().min(10, 'Solution must be at least 10 characters'),
  status: z.enum(['draft', 'active', 'completed', 'failed'])
});

// Team Schema
const teamSchema = z.object({
  projectManager: z.string().min(1, 'Project manager is required'),
  salesEngineers: z.array(z.string()).min(1, 'At least one sales engineer is required'),
  technicalTeam: z.array(z.string()).min(1, 'At least one technical team member is required')
});

// Workflow Schema
const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().min(1, 'Task description is required')
});

const stageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  tasks: z.array(taskSchema).min(1, 'At least one task is required')
});

const workflowSchema = z.object({
  stages: z.array(stageSchema).min(1, 'At least one stage is required')
});

// Metrics Schema
const kpiSchema = z.object({
  title: z.string().min(1, 'KPI title is required'),
  target: z.string().min(1, 'Target is required'),
  weight: z.number().min(0).max(100)
});

const metricsSchema = z.object({
  kpis: z.array(kpiSchema)
    .min(1, 'At least one KPI is required')
    .refine(
      (kpis) => {
        const totalWeight = kpis.reduce((sum, kpi) => sum + kpi.weight, 0);
        return totalWeight === 100;
      },
      { message: 'KPI weights must sum to 100%' }
    )
});

// Resources Schema
const resourceSchema = z.object({
  type: z.string().min(1, 'Resource type is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string()
});

const resourcesSchema = z.object({
  budget: z.number().min(0, 'Budget must be non-negative'),
  resources: z.array(resourceSchema)
});

// Complete PoV Schema
export const povSchema = z.object({
  basicInfo: basicInfoSchema,
  team: teamSchema,
  workflow: workflowSchema,
  metrics: metricsSchema,
  resources: resourcesSchema
});

// Helper function to validate a specific step
export const validateStep = (
  step: keyof typeof povSchema.shape,
  data: any
): { success: boolean; errors?: Record<string, string[]> } => {
  try {
    const stepSchema = povSchema.shape[step];
    stepSchema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _: ['An unexpected error occurred'] } };
  }
};

// Helper function to validate the entire form
export const validateForm = (
  data: z.infer<typeof povSchema>
): { success: boolean; errors?: Record<string, string[]> } => {
  try {
    povSchema.parse(data);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _: ['An unexpected error occurred'] } };
  }
};
