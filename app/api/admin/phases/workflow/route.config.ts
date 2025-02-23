import { z } from "zod"
import { PhaseType } from "@prisma/client"

export const taskSchema = z.object({
  key: z.string().min(1, "Key is required"),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  required: z.boolean().default(false),
  dependencies: z.array(z.string()).optional(),
})

export const stageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tasks: z.array(taskSchema),
  dependencies: z.array(z.string()).optional(),
})

export const workflowSchema = z.object({
  type: z.nativeEnum(PhaseType),
  stages: z.array(stageSchema),
})
