import { prisma } from "@/lib/prisma"
import { Phase, PhaseTemplate, PhaseType, Prisma, StageStatus } from "@prisma/client"
import { PhaseTemplateCreateInput, PhaseTemplateUpdateInput, WorkflowStage, PhaseDetails } from "../types/phase"

const defaultPhaseDetails: PhaseDetails = {
  tasks: [],
  metadata: {},
}

export interface CreateStageInput {
  name: string;
  description?: string;
  order: number;
  status?: StageStatus;
  metadata?: Record<string, any>;
}

export interface UpdateStageInput {
  name?: string;
  description?: string;
  status?: StageStatus;
  order?: number;
  metadata?: Record<string, any>;
}

export class PhaseService {
  async getTemplates() {
    return prisma.phaseTemplate.findMany()
  }

  async getTemplate(id: string) {
    return prisma.phaseTemplate.findUnique({
      where: { id },
    })
  }

  async createTemplate(data: PhaseTemplateCreateInput) {
    return prisma.phaseTemplate.create({
      data: {
        ...data,
        workflow: data.workflow as Prisma.JsonObject,
      },
    })
  }

  async updateTemplate(id: string, data: PhaseTemplateUpdateInput) {
    return prisma.phaseTemplate.update({
      where: { id },
      data: {
        ...data,
        workflow: data.workflow ? (data.workflow as Prisma.JsonObject) : undefined,
      },
    })
  }

  async deleteTemplate(id: string) {
    return prisma.phaseTemplate.delete({
      where: { id },
    })
  }

  async getWorkflows() {
    const templates = await prisma.phaseTemplate.findMany({
      where: {
        isDefault: true,
      },
    })

    // Group templates by type and extract workflow stages
    const workflowsByType = templates.reduce((acc, template) => {
      if (!acc[template.type]) {
        const workflow = template.workflow as { stages: WorkflowStage[] }
        acc[template.type] = {
          type: template.type,
          stages: workflow?.stages || [],
        }
      }
      return acc
    }, {} as Record<PhaseType, { type: PhaseType; stages: WorkflowStage[] }>)

    // Ensure all phase types have a workflow, even if empty
    Object.values(PhaseType).forEach((type) => {
      if (!workflowsByType[type]) {
        workflowsByType[type] = {
          type,
          stages: [],
        }
      }
    })

    return Object.values(workflowsByType)
  }

  async updateWorkflow(type: PhaseType, stages: WorkflowStage[]) {
    // Find or create default template for this phase type
    let template = await prisma.phaseTemplate.findFirst({
      where: {
        type,
        isDefault: true,
      },
    })

    if (template) {
      // Update existing template
      return prisma.phaseTemplate.update({
        where: { id: template.id },
        data: {
          workflow: {
            stages,
          } as Prisma.JsonObject,
        },
      })
    } else {
      // Create new default template
      return prisma.phaseTemplate.create({
        data: {
          name: `Default ${type} Template`,
          type,
          isDefault: true,
          workflow: {
            stages,
          } as Prisma.JsonObject,
        },
      })
    }
  }

  async getPhase(id: string) {
    const phase = await prisma.phase.findUnique({
      where: { id },
      include: {
        template: true,
      },
    })

    if (!phase) return null

    const details = phase.details ? JSON.parse(JSON.stringify(phase.details)) as PhaseDetails : defaultPhaseDetails

    return {
      ...phase,
      details,
    }
  }

  async getPoVPhases(povId: string) {
    const phases = await prisma.phase.findMany({
      where: { povId },
      include: {
        template: true,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return phases.map(phase => ({
      ...phase,
      details: phase.details ? JSON.parse(JSON.stringify(phase.details)) as PhaseDetails : defaultPhaseDetails,
    }))
  }

  async createPhase(data: {
    povId: string;
    templateId?: string | null;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    order: number;
    type?: PhaseType;
    details?: PhaseDetails;
  }) {
    const details = data.details || defaultPhaseDetails

    return prisma.phase.create({
      data: {
        ...data,
        type: data.type || PhaseType.PLANNING,
        details: JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue,
      },
      include: {
        template: true,
        tasks: true,
        pov: {
          include: {
            owner: true,
            team: {
              include: {
                members: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      },
    })
  }

  async updatePhase(id: string, data: {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    details?: PhaseDetails;
  }) {
    const currentPhase = await this.getPhase(id)
    if (!currentPhase) throw new Error("Phase not found")

    const details = data.details || currentPhase.details

    return prisma.phase.update({
      where: { id },
      data: {
        ...data,
        details: JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue,
      },
      include: {
        template: true,
      },
    })
  }

  async deletePhase(id: string) {
    return prisma.phase.delete({
      where: { id },
    })
  }

  async reorderPhases(povId: string, phaseIds: string[], order: number[]) {
    if (phaseIds.length !== order.length) {
      throw new Error("Phase IDs and order arrays must have the same length")
    }

    // Update order of each phase
    await Promise.all(
      phaseIds.map((id, index) =>
        prisma.phase.update({
          where: { id },
          data: { order: order[index] },
        })
      )
    )

    return this.getPoVPhases(povId)
  }

  // Stage Management
  async getStages(phaseId: string) {
    return prisma.stage.findMany({
      where: { phaseId },
      include: {
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })
  }

  async getStage(id: string) {
    return prisma.stage.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })
  }

  async createStage(phaseId: string, data: CreateStageInput) {
    return prisma.stage.create({
      data: {
        ...data,
        phaseId,
        status: data.status || StageStatus.PENDING,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) as Prisma.InputJsonValue : undefined,
      },
      include: {
        tasks: true,
      },
    })
  }

  async updateStage(id: string, data: UpdateStageInput) {
    const currentStage = await prisma.stage.findUnique({ where: { id } })
    if (!currentStage) throw new Error("Stage not found")

    const metadata = data.metadata || currentStage.metadata

    return prisma.stage.update({
      where: { id },
      data: {
        ...data,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue : undefined,
      },
      include: {
        tasks: true,
      },
    })
  }

  async deleteStage(id: string) {
    return prisma.stage.delete({ where: { id } })
  }

  async reorderStages(phaseId: string, stageIds: string[]) {
    // Verify all stages belong to the phase
    const stages = await prisma.stage.findMany({
      where: { phaseId, id: { in: stageIds } },
    })

    if (stages.length !== stageIds.length) {
      throw new Error("Some stage IDs are invalid or do not belong to this phase")
    }

    // Update order of each stage
    await Promise.all(
      stageIds.map((id, index) =>
        prisma.stage.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    return prisma.stage.findMany({
      where: { phaseId },
      orderBy: { order: 'asc' },
      include: {
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })
  }

  // Task Management
  async moveTask(taskId: string, newStageId: string, newOrder: number) {
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) throw new Error("Task not found")

    const stage = await prisma.stage.findUnique({ where: { id: newStageId } })
    if (!stage) throw new Error("Stage not found")

    // Get tasks in the target stage
    const stageTasks = await prisma.task.findMany({
      where: { stageId: newStageId },
      orderBy: { order: 'asc' },
    })

    // Reorder tasks
    const updatedTasks = await prisma.$transaction(async (tx) => {
      // Move the task to the new stage
      await tx.task.update({
        where: { id: taskId },
        data: { stageId: newStageId, order: newOrder },
      })

      // Reorder other tasks in the stage
      for (let i = newOrder; i < stageTasks.length; i++) {
        if (stageTasks[i].id !== taskId) {
          await tx.task.update({
            where: { id: stageTasks[i].id },
            data: { order: i + 1 },
          })
        }
      }

      return tx.task.findMany({
        where: { stageId: newStageId },
        orderBy: { order: 'asc' },
      })
    })

    return updatedTasks
  }

  async createTask(stageId: string, data: {
    title: string;
    description?: string;
    assigneeId?: string;
    dueDate?: Date;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    metadata?: Record<string, any>;
  }) {
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        phase: true,
        tasks: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    if (!stage) throw new Error("Stage not found")

    // Get the highest order in the stage
    const maxOrder = stage.tasks.length > 0
      ? Math.max(...stage.tasks.map(t => t.order))
      : -1

    return prisma.task.create({
      data: {
        ...data,
        stageId,
        phaseId: stage.phaseId,
        povId: stage.phase.povId,
        order: maxOrder + 1,
        status: 'OPEN',
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) as Prisma.InputJsonValue : undefined,
      },
    })
  }
}

export const phaseService = new PhaseService()
