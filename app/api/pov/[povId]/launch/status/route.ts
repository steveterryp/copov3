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

  const status = await launchService.getLaunchStatus(params.povId)
  if (!status) {
    throw new ApiError("NOT_FOUND", "Launch status not found")
  }

  return Response.json(status)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request)
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "Unauthorized")
  }

  const launch = await launchService.confirmLaunch(params.povId, user.userId)
  return Response.json(launch)
}
