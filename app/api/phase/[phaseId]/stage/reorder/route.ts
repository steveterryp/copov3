import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: { phaseId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phaseId } = params
    const { stageIds } = await request.json()

    if (!Array.isArray(stageIds) || stageIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid stageIds. Expected non-empty array." },
        { status: 400 }
      )
    }

    // Check if the phase exists
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        pov: true,
      },
    })

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 })
    }

    // Check if the user has access to the phase
    if (phase.pov.ownerId !== user.userId && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify all stages belong to the phase
    const stages = await prisma.$queryRaw<any[]>`
      SELECT id FROM "stages"
      WHERE "phaseId" = ${phaseId} AND id IN (${Prisma.join(stageIds)})
    `

    if (stages.length !== stageIds.length) {
      return NextResponse.json(
        { error: "Some stage IDs are invalid or do not belong to this phase" },
        { status: 400 }
      )
    }

    // Update order of each stage
    for (let i = 0; i < stageIds.length; i++) {
      await prisma.$executeRaw`
        UPDATE "stages"
        SET "order" = ${i}
        WHERE id = ${stageIds[i]}
      `
    }

    // Get the updated stages
    const updatedStages = await prisma.$queryRaw<any[]>`
      SELECT s.*, 
        (SELECT json_agg(t.*) 
         FROM "tasks" t 
         WHERE t."stage_id" = s.id 
         ORDER BY t."order" ASC) as tasks
      FROM "stages" s
      WHERE s."phaseId" = ${phaseId}
      ORDER BY s."order" ASC
    `

    return NextResponse.json({ stages: updatedStages })
  } catch (error) {
    console.error("[Stage Reorder API Error]:", error)
    return NextResponse.json(
      { error: "Failed to reorder stages" },
      { status: 500 }
    )
  }
}
