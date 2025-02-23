import { NextRequest } from "next/server"
import { launchService } from "@/lib/pov/services/launch"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { ApiError } from "@/lib/errors"

export async function GET(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  const launch = await launchService.getLaunchStatus(params.povId)
  if (!launch) {
    throw new ApiError("NOT_FOUND", "Launch not found")
  }

  const checklist = launch.checklist as any
  return Response.json({
    items: checklist?.items || [],
    progress: {
      completed: checklist?.items?.filter((item: any) => item.completed).length || 0,
      total: checklist?.items?.length || 0,
    },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  const body = await request.json()
  const { key, completed } = body

  const launch = await launchService.getLaunchStatus(params.povId)
  if (!launch) {
    throw new ApiError("NOT_FOUND", "Launch not found")
  }

  const updated = await launchService.updateLaunchChecklist(params.povId, [
    { key, completed },
  ])

  return Response.json(updated)
}
