import { z } from "zod"
import { PhaseType } from "@prisma/client"

export const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(PhaseType),
  isDefault: z.boolean().default(false),
  workflow: z.object({
    stages: z.array(z.object({
      name: z.string().min(1, "Stage name is required"),
      description: z.string().optional(),
      tasks: z.array(z.object({
        key: z.string().min(1, "Task key is required"),
        label: z.string().min(1, "Task label is required"),
        description: z.string().optional(),
        required: z.boolean().default(false),
        dependencies: z.array(z.string()).optional(),
      })),
      dependencies: z.array(z.string()).optional(),
    })),
    metadata: z.record(z.any()).optional(),
  }),
})

export type TemplateInput = z.infer<typeof templateSchema>

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}
