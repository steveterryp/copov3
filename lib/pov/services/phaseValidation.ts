import { prisma } from "@/lib/prisma"
import { PhaseType, Prisma } from "@prisma/client"

export class PhaseValidationService {
  // Phase Validation
  async validatePhaseTimeline(phaseId: string, startDate: Date, endDate: Date): Promise<boolean> {
    // Check if the phase exists
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
    })

    if (!phase) {
      throw new Error("Phase not found")
    }

    // Check if the start date is before the end date
    if (startDate >= endDate) {
      return false
    }

    // Check if the phase overlaps with other phases in the same POV
    const overlappingPhases = await prisma.phase.findMany({
      where: {
        povId: phase.povId,
        id: { not: phaseId },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    })

    return overlappingPhases.length === 0
  }

  async validatePhaseStatus(phaseId: string, newStatus: PhaseType): Promise<boolean> {
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
    })

    if (!phase) {
      throw new Error("Phase not found")
    }

    // Check if all stages in the phase are completed
    if (newStatus === PhaseType.REVIEW) {
      // Fetch stages for this phase
      const stages = await prisma.$queryRaw<any[]>`
        SELECT * FROM "stages" WHERE "phaseId" = ${phaseId}
      `
      
      const incompleteStages = stages.filter(stage => stage.status !== 'COMPLETED')
      return incompleteStages.length === 0
    }

    return true
  }

  // Stage Validation
  async validateStageOrder(phaseId: string, stageIds: string[]): Promise<boolean> {
    // Check if all stages belong to the phase using raw SQL
    const stageIdsStr = stageIds.map(id => `'${id}'`).join(',')
    const stages = await prisma.$queryRaw<any[]>`
      SELECT id FROM "stages" 
      WHERE "phaseId" = ${phaseId} AND id IN (${Prisma.raw(stageIdsStr)})
    `

    if (stages.length !== stageIds.length) {
      return false
    }

    return true
  }

  async validateStageStatus(stageId: string, newStatus: string): Promise<boolean> {
    // Get the stage and its tasks using raw SQL
    const stage = await prisma.$queryRaw<any[]>`
      SELECT * FROM "stages" WHERE id = ${stageId}
    `

    if (!stage || stage.length === 0) {
      throw new Error("Stage not found")
    }

    // Check if all tasks in the stage are completed
    if (newStatus === 'COMPLETED') {
      const tasks = await prisma.$queryRaw<any[]>`
        SELECT * FROM "tasks" WHERE "stage_id" = ${stageId}
      `
      
      const incompleteTasks = tasks.filter((task: any) => task.status !== 'COMPLETED')
      return incompleteTasks.length === 0
    }

    return true
  }

  // Task Validation
  async validateTaskDependencies(taskId: string): Promise<boolean> {
    // In a real implementation, we would check if all dependencies of the task are completed
    // For now, we'll just return true
    return true
  }

  async validateTaskAssignment(taskId: string, assigneeId: string): Promise<boolean> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        pov: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    })

    if (!task || !task.pov || !task.pov.team) {
      throw new Error("Task or POV team not found")
    }

    // Check if the assignee is a member of the POV team
    const isTeamMember = task.pov.team.members.some(member => member.userId === assigneeId)
    return isTeamMember
  }
}

export const phaseValidationService = new PhaseValidationService()
