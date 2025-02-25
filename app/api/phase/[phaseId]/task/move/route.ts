import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { prisma } from "@/lib/prisma"

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
    const { taskId, newStageId, newOrder } = await request.json()

    if (!taskId || !newStageId || typeof newOrder !== 'number') {
      return NextResponse.json(
        { error: "Invalid request. Required: taskId, newStageId, newOrder" },
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

    // Check if the task exists
    const task = await prisma.$queryRaw<any[]>`
      SELECT * FROM "tasks" WHERE id = ${taskId}
    `

    if (!task || task.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if the new stage exists and belongs to the phase
    const stage = await prisma.$queryRaw<any[]>`
      SELECT * FROM "stages" WHERE id = ${newStageId} AND "phaseId" = ${phaseId}
    `

    if (!stage || stage.length === 0) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    // Get the current stage ID of the task
    const currentStageId = task[0].stage_id

    // Get tasks in the target stage
    const stageTasks = await prisma.$queryRaw<any[]>`
      SELECT * FROM "tasks"
      WHERE "stage_id" = ${newStageId}
      ORDER BY "order" ASC
    `

    // Begin transaction
    await prisma.$transaction(async (tx) => {
      // Move the task to the new stage
      await tx.$executeRaw`
        UPDATE "tasks"
        SET 
          "stage_id" = ${newStageId},
          "order" = ${newOrder},
          "updated_at" = NOW()
        WHERE id = ${taskId}
      `

      // Reorder other tasks in the new stage
      for (let i = 0; i < stageTasks.length; i++) {
        const t = stageTasks[i]
        if (t.id !== taskId && t.order >= newOrder) {
          await tx.$executeRaw`
            UPDATE "tasks"
            SET "order" = ${t.order + 1}, "updated_at" = NOW()
            WHERE id = ${t.id}
          `
        }
      }

      // If the task was moved from a different stage, reorder the old stage
      if (currentStageId !== newStageId) {
        const oldStageTasks = await tx.$queryRaw<any[]>`
          SELECT * FROM "tasks"
          WHERE "stage_id" = ${currentStageId}
          ORDER BY "order" ASC
        `

        // Reorder tasks in the old stage
        for (let i = 0; i < oldStageTasks.length; i++) {
          await tx.$executeRaw`
            UPDATE "tasks"
            SET "order" = ${i}, "updated_at" = NOW()
            WHERE id = ${oldStageTasks[i].id}
          `
        }
      }
    })

    // Get the updated task
    const updatedTask = await prisma.$queryRaw<any[]>`
      SELECT t.*, 
        (SELECT row_to_json(u.*) FROM "User" u WHERE u.id = t.assignee_id) as assignee
      FROM "tasks" t
      WHERE t.id = ${taskId}
    `

    // Get all tasks in the new stage
    const updatedStageTasks = await prisma.$queryRaw<any[]>`
      SELECT t.*, 
        (SELECT row_to_json(u.*) FROM "User" u WHERE u.id = t.assignee_id) as assignee
      FROM "tasks" t
      WHERE t.stage_id = ${newStageId}
      ORDER BY t."order" ASC
    `

    return NextResponse.json({
      task: updatedTask[0],
      stageTasks: updatedStageTasks
    })
  } catch (error) {
    console.error("[Task Move API Error]:", error)
    return NextResponse.json(
      { error: "Failed to move task" },
      { status: 500 }
    )
  }
}
