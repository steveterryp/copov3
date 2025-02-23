import { NextRequest } from "next/server"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { ApiError } from "@/lib/errors"
import { phaseService } from "@/lib/pov/services/phase"
import { templateSchema } from "../route.config"
import { PhaseTemplateUpdateInput } from "@/lib/pov/types/phase"

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  // Check if user has admin permissions
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError("FORBIDDEN", "Insufficient permissions")
  }

  const { id } = params

  try {
    await phaseService.deleteTemplate(id)
    return new Response(null, { status: 204 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new ApiError("NOT_FOUND", "Template not found")
    }
    throw error
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  // Check if user has admin permissions
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError("FORBIDDEN", "Insufficient permissions")
  }

  const { id } = params
  const data = await request.json()

  // Validate request body
  const validatedData = templateSchema.safeParse(data)
  if (!validatedData.success) {
    throw new ApiError("BAD_REQUEST", "Invalid request body", validatedData.error)
  }

  try {
    // Convert null description to undefined to match PhaseTemplateUpdateInput type
    const updateData: PhaseTemplateUpdateInput = {
      ...validatedData.data,
      description: validatedData.data.description || undefined,
    }

    const template = await phaseService.updateTemplate(id, updateData)
    return Response.json(template)
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new ApiError("NOT_FOUND", "Template not found")
    }
    throw error
  }
}
