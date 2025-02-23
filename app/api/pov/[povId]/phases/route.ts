import { NextRequest } from "next/server"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { ApiError } from "@/lib/errors"
import { phaseService } from "@/lib/pov/services/phase"
import { z } from "zod"
import { PhaseDetails } from "@/lib/pov/types/phase"

export const dynamic = 'force-dynamic'

const reorderSchema = z.object({
  type: z.literal("reorder"),
  phaseIds: z.array(z.string()),
  order: z.array(z.number()),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  const { povId } = params

  const phases = await phaseService.getPoVPhases(povId)
  return Response.json(phases)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  const { povId } = params
  const data = await request.json()

  // Validate request body
  const schema = z.object({
    templateId: z.string(),
    name: z.string(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    order: z.number(),
  })

  const validatedData = schema.safeParse(data)
  if (!validatedData.success) {
    throw new ApiError("BAD_REQUEST", "Invalid request body", validatedData.error)
  }

  const phase = await phaseService.createPhase({
    ...validatedData.data,
    povId,
    startDate: new Date(validatedData.data.startDate),
    endDate: new Date(validatedData.data.endDate),
  })

  return Response.json(phase)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  const { povId } = params
  const data = await request.json()

  // Check if this is a reorder request
  if (data.type === "reorder") {
    const validatedData = reorderSchema.safeParse(data)
    if (!validatedData.success) {
      throw new ApiError("BAD_REQUEST", "Invalid request body", validatedData.error)
    }

    const { phaseIds, order } = validatedData.data
    const phases = await phaseService.reorderPhases(povId, phaseIds, order)
    return Response.json(phases)
  }

  // Regular phase update
  const schema = z.object({
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    details: z.any().optional(),
  })

  const validatedData = schema.safeParse(data)
  if (!validatedData.success) {
    throw new ApiError("BAD_REQUEST", "Invalid request body", validatedData.error)
  }

  const { id, ...updateData } = validatedData.data

  // Convert date strings to Date objects if present
  const phaseUpdate: {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    details?: PhaseDetails;
  } = {
    ...updateData,
    startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
    endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
  }

  const phase = await phaseService.updatePhase(id, phaseUpdate)
  return Response.json(phase)
}
