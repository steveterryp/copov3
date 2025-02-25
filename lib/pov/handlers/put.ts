import { NextRequest } from "next/server"
import { ApiError } from "@/lib/errors"
import { povService } from "@/lib/pov/services/pov"
import { PoVUpdateInput } from "@/lib/pov/types/core"
import { prisma } from "@/lib/prisma"

export async function updatePoVHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const { povId } = params
  const requestData = await request.json()
  
  // Extract teamMembers from the request data
  const { teamMembers, ...povData } = requestData
  
  // Update the POV
  const pov = await povService.update(povId, povData)
  
  // If teamMembers is provided, update the team members
  if (teamMembers && Array.isArray(teamMembers)) {
    // Get the team ID
    const teamId = pov.teamId
    
    if (teamId) {
      // Remove existing team members
      await prisma.teamMember.deleteMany({
        where: {
          teamId
        }
      })
      
      // Add new team members
      if (teamMembers.length > 0) {
        await prisma.teamMember.createMany({
          data: teamMembers.map(userId => ({
            teamId,
            userId
          }))
        })
      }
    }
  }
  
  // Fetch the updated POV with all relations
  const updatedPov = await povService.get(povId)
  return Response.json(updatedPov)
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
