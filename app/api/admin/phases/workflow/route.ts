import { NextRequest } from "next/server"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { ApiError } from "@/lib/errors"
import { phaseService } from "@/lib/pov/services/phase"
import { workflowSchema } from "./route.config"

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

  const workflows = await phaseService.getWorkflows()
  return Response.json(workflows)
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
  const validatedData = workflowSchema.safeParse(data)
  if (!validatedData.success) {
    throw new ApiError("BAD_REQUEST", "Invalid request body", validatedData.error)
  }

  const workflow = await phaseService.updateWorkflow(
    validatedData.data.type,
    validatedData.data.stages
  )
  return Response.json(workflow)
}
