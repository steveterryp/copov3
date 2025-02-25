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

    // Check if the stage exists
    const stageExists = await prisma.$queryRaw<any[]>`
      SELECT id FROM "stages" WHERE id = ${stageId} AND "phaseId" = ${phaseId}
    `

    if (!stageExists || stageExists.length === 0) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    // Get all tasks for the stage
    const tasks = await prisma.$queryRaw<any[]>`
      SELECT t.*, 
        (SELECT row_to_json(u.*) FROM "User" u WHERE u.id = t.assignee_id) as assignee
      FROM "tasks" t
      WHERE t.stage_id = ${stageId}
      ORDER BY t."order" ASC
    `

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("[Task API Error]:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

export async function POST(
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

    // Get the highest order in the stage
    const result = await prisma.$queryRaw<{ max_order: number | null }[]>`
      SELECT MAX("order") as max_order
      FROM "tasks"
      WHERE "stage_id" = ${stageId}
    `
    const maxOrder = result[0]?.max_order || 0
    const order = maxOrder + 1

    // Create a new task
    await prisma.$executeRaw`
      INSERT INTO "tasks" (
        "id", 
        "title", 
        "description", 
        "assignee_id", 
        "team_id", 
        "pov_id", 
        "phase_id", 
        "stage_id", 
        "order", 
        "due_date", 
        "priority", 
        "status", 
        "metadata", 
        "created_at", 
        "updated_at"
      )
      VALUES (
        gen_random_uuid(),
        ${data.title},
        ${data.description || null},
        ${data.assigneeId || null},
        ${data.teamId || null},
        ${phase.povId},
        ${phaseId},
        ${stageId},
        ${order},
        ${data.dueDate ? new Date(data.dueDate) : null},
        ${data.priority || 'MEDIUM'}::"TaskPriority",
        'OPEN'::"TaskStatus",
        ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
        NOW(),
        NOW()
      )
    `

    // Get the created task
    const createdTask = await prisma.$queryRaw<any[]>`
      SELECT t.*, 
        (SELECT row_to_json(u.*) FROM "User" u WHERE u.id = t.assignee_id) as assignee
      FROM "tasks" t
      WHERE t.stage_id = ${stageId}
      ORDER BY t.created_at DESC
      LIMIT 1
    `

    return NextResponse.json({ task: createdTask[0] })
  } catch (error) {
    console.error("[Task API Error]:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}
