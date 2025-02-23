import { NextRequest } from "next/server"
import { ApiError } from "@/lib/errors"
import { povService } from "@/lib/pov/services/pov"
import { PoVUpdateInput } from "@/lib/pov/types/core"

export async function updatePoVHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const { povId } = params
  const data = await request.json() as PoVUpdateInput

  const pov = await povService.update(povId, data)
  return Response.json(pov)
}

export async function updatePhaseHandler(
  request: NextRequest,
  { params }: { params: { povId: string; phaseId: string } }
) {
  const { phaseId } = params
  const data = await request.json()

  const phase = await povService.updatePhase(phaseId, data)
  return Response.json(phase)
}

export async function reorderPhasesHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const { povId } = params
  const data = await request.json()
  const { phaseIds, order } = data

  if (!Array.isArray(phaseIds) || !Array.isArray(order)) {
    throw new ApiError("BAD_REQUEST", "phaseIds and order must be arrays")
  }

  if (phaseIds.length !== order.length) {
    throw new ApiError("BAD_REQUEST", "phaseIds and order arrays must have the same length")
  }

  const phases = await povService.reorderPhases(povId, phaseIds, order)
  return Response.json(phases)
}
