import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { phaseId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phaseId } = params

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

    // Get all stages for the phase using raw SQL
    const stages = await prisma.$queryRaw`
      SELECT s.*
      FROM "stages" s
      WHERE s."phaseId" = ${phaseId}
      ORDER BY s."order" ASC
    `

    // For each stage, get its tasks
    const result = await Promise.all(
      (stages as any[]).map(async (stage) => {
        const tasks = await prisma.$queryRaw`
          SELECT *
          FROM "tasks" t
          WHERE t."stage_id" = ${stage.id}
          ORDER BY t."order" ASC
        `
        return { ...stage, tasks };
      })
    );

    return NextResponse.json({ stages: result })
  } catch (error) {
    console.error("[Stage API Error]:", error)
    return NextResponse.json(
      { error: "Failed to fetch stages" },
      { status: 500 }
    )
  }
}

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

    // Get the highest order in the phase
    const result = await prisma.$queryRaw<{ max_order: number | null }[]>`
      SELECT MAX("order") as max_order
      FROM "stages"
      WHERE "phaseId" = ${phaseId}
    `
    const maxOrder = result[0]?.max_order || 0
    const order = maxOrder + 1

    // Create a new stage using raw SQL with proper casting
    await prisma.$executeRaw`
      INSERT INTO "stages" ("id", "phaseId", "name", "description", "status", "order", "metadata", "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        ${phaseId},
        ${data.name},
        ${data.description || null},
        ${data.status || 'PENDING'}::"StageStatus",
        ${order},
        ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
        NOW(),
        NOW()
      )
    `

    // Get the created stage without trying to include tasks
    const createdStage = await prisma.$queryRaw<any[]>`
      SELECT s.*
      FROM "stages" s
      WHERE s."phaseId" = ${phaseId}
      ORDER BY s."createdAt" DESC
      LIMIT 1
    `

    return NextResponse.json({ stage: createdStage[0] })
  } catch (error) {
    console.error("[Stage API Error]:", error)
    return NextResponse.json(
      { error: "Failed to create stage" },
      { status: 500 }
    )
  }
}
