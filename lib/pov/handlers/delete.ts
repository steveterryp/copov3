import { NextRequest } from "next/server"
import { ApiError } from "@/lib/errors"
import { povService } from "@/lib/pov/services/pov"

export async function deletePoVHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const { povId } = params
  await povService.delete(povId)
  return Response.json({ success: true })
}

export async function deletePhaseHandler(
  request: NextRequest,
  { params }: { params: { povId: string; phaseId: string } }
) {
  const { phaseId } = params
  await povService.deletePhase(phaseId)
  return Response.json({ success: true })
}

export async function deleteMultiplePhasesHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const data = await request.json()
  const { phaseIds } = data

  if (!Array.isArray(phaseIds)) {
    throw new ApiError("BAD_REQUEST", "phaseIds must be an array")
  }

  await Promise.all(phaseIds.map(id => povService.deletePhase(id)))
  return Response.json({ success: true })
}
