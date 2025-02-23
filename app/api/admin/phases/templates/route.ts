import { NextRequest } from "next/server"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { ApiError } from "@/lib/errors"
import { phaseService } from "@/lib/pov/services/phase"
import { templateSchema } from "./route.config"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  // Check if user has admin permissions
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError("FORBIDDEN", "Insufficient permissions")
  }

  const templates = await phaseService.getTemplates()
  return Response.json(templates)
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  // Check if user has admin permissions
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError("FORBIDDEN", "Insufficient permissions")
  }

  const data = await request.json()

  // Validate request body
  const validatedData = templateSchema.safeParse(data)
  if (!validatedData.success) {
    throw new ApiError("BAD_REQUEST", "Invalid request body", validatedData.error)
  }

  // Convert null description to undefined to match PhaseTemplateCreateInput type
  const templateData = {
    ...validatedData.data,
    description: validatedData.data.description || undefined,
  }

  const template = await phaseService.createTemplate(templateData)
  return Response.json(template)
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  // Check if user has admin permissions
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ApiError("FORBIDDEN", "Insufficient permissions")
  }

  const data = await request.json()

  // Validate request body
  const validatedData = templateSchema.safeParse(data)
  if (!validatedData.success) {
    throw new ApiError("BAD_REQUEST", "Invalid request body", validatedData.error)
  }

  if (!data.id) {
    throw new ApiError("BAD_REQUEST", "Missing template ID")
  }

  // Convert null description to undefined to match PhaseTemplateUpdateInput type
  const { id, ...updateData } = {
    ...data,
    description: data.description || undefined,
  }

  const template = await phaseService.updateTemplate(id, updateData)
  return Response.json(template)
}
