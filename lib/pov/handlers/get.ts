import { NextRequest } from "next/server"
import { ApiError } from "@/lib/errors"
import { povService } from "@/lib/pov/services/pov"
import { getAuthUser } from "@/lib/auth"
import { UserRole } from "@/lib/types/auth"

export async function getPoVHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const { povId } = params
  const pov = await povService.get(povId)
  if (!pov) {
    throw new ApiError("NOT_FOUND", "PoV not found")
  }
  return Response.json(pov)
}

export async function getPoVListHandler(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      throw new ApiError("UNAUTHORIZED", "No user found");
    }

    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    const povs = await povService.list(user.userId, isAdmin);
    return Response.json({ data: povs });
  } catch (error) {
    console.error('[PoV List Error]:', error);
    throw error;
  }
}

export async function getPhaseHandler(
  request: NextRequest,
  { params }: { params: { povId: string; phaseId: string } }
) {
  const { phaseId } = params
  const phase = await povService.getPhase(phaseId)
  if (!phase) {
    throw new ApiError("NOT_FOUND", "Phase not found")
  }
  return Response.json(phase)
}

export async function getPoVPhasesHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const { povId } = params
  const phases = await povService.getPhases(povId)
  return Response.json(phases)
}
