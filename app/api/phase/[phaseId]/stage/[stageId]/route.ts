import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { phaseId: string; stageId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phaseId, stageId } = params

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

    // Get the stage with its tasks
    const stage = await prisma.$queryRaw<any[]>`
      SELECT s.*, 
        (SELECT json_agg(t.*) 
         FROM "tasks" t 
         WHERE t."stage_id" = s.id 
         ORDER BY t."order" ASC) as tasks
      FROM "stages" s
      WHERE s.id = ${stageId} AND s."phaseId" = ${phaseId}
    `

    if (!stage || stage.length === 0) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    return NextResponse.json({ stage: stage[0] })
  } catch (error) {
    console.error("[Stage API Error]:", error)
    return NextResponse.json(
      { error: "Failed to fetch stage" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { phaseId: string; stageId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phaseId, stageId } = params
    const data = await request.json()

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

    // Check if the stage exists
    const stageExists = await prisma.$queryRaw<any[]>`
      SELECT id FROM "stages" WHERE id = ${stageId} AND "phaseId" = ${phaseId}
    `

    if (!stageExists || stageExists.length === 0) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    // Update the stage
    await prisma.$executeRaw`
      UPDATE "stages"
      SET 
        "name" = ${data.name || null},
        "description" = ${data.description || null},
        "status" = ${data.status || null},
        "order" = ${data.order || null},
        "metadata" = ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
        "updatedAt" = NOW()
      WHERE id = ${stageId} AND "phaseId" = ${phaseId}
    `

    // Get the updated stage
    const updatedStage = await prisma.$queryRaw<any[]>`
      SELECT * FROM "stages" WHERE id = ${stageId}
    `

    return NextResponse.json({ stage: updatedStage[0] })
  } catch (error) {
    console.error("[Stage API Error]:", error)
    return NextResponse.json(
      { error: "Failed to update stage" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { phaseId: string; stageId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phaseId, stageId } = params

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

    // Check if the stage exists
    const stageExists = await prisma.$queryRaw<any[]>`
      SELECT id FROM "stages" WHERE id = ${stageId} AND "phaseId" = ${phaseId}
    `

    if (!stageExists || stageExists.length === 0) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    // Delete the stage
    await prisma.$executeRaw`
      DELETE FROM "stages" WHERE id = ${stageId} AND "phaseId" = ${phaseId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Stage API Error]:", error)
    return NextResponse.json(
      { error: "Failed to delete stage" },
      { status: 500 }
    )
  }
}
