import { prisma } from "@/lib/prisma"
import { Phase, PhaseTemplate, PhaseType, Prisma } from "@prisma/client"
import { PhaseTemplateCreateInput, PhaseTemplateUpdateInput, WorkflowStage, PhaseDetails } from "../types/phase"

const defaultPhaseDetails: PhaseDetails = {
  tasks: [],
  metadata: {},
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
    templateId: string;
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
}

export const phaseService = new PhaseService()
