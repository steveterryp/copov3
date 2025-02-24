import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/errors"
import { Prisma } from "@prisma/client"
import { PoVCreateInput, PoVUpdateInput } from "@/lib/pov/types/core"

const povInclude = {
  phases: {
    include: {
      tasks: true
    }
  },
  owner: true,
  team: {
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  },
  country: true,
  region: true,
} satisfies Prisma.POVInclude;

export class PoVService {
  async create(data: PoVCreateInput) {
    return prisma.pOV.create({
      data,
      include: povInclude,
    })
  }

  async get(id: string) {
    return prisma.pOV.findUnique({
      where: { id },
      include: povInclude,
    })
  }

  async list(userId?: string, isAdmin: boolean = false) {
    return prisma.pOV.findMany({
      where: isAdmin ? undefined : {
        OR: [
          { ownerId: userId },
          {
            team: {
              members: {
                some: {
                  userId: userId
                }
              }
            }
          }
        ]
      },
      include: {
        ...povInclude,
        kpis: {
          include: {
            template: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async update(id: string, data: PoVUpdateInput) {
    return prisma.pOV.update({
      where: { id },
      data,
      include: povInclude,
    })
  }

  async delete(id: string) {
    return prisma.pOV.delete({
      where: { id },
    })
  }

  async getPhase(id: string) {
    return prisma.phase.findUnique({
      where: { id },
      include: {
        pov: {
          include: povInclude,
        },
      },
    })
  }

  async getPhases(povId: string) {
    return prisma.phase.findMany({
      where: {
        povId,
      },
      orderBy: {
        order: 'asc',
      },
    })
  }

  async createPhase(povId: string, data: Prisma.PhaseCreateInput) {
    return prisma.phase.create({
      data: {
        ...data,
        pov: {
          connect: { id: povId },
        },
      },
    })
  }

  async updatePhase(id: string, data: Prisma.PhaseUpdateInput) {
    return prisma.phase.update({
      where: { id },
      data,
    })
  }

  async deletePhase(id: string) {
    return prisma.phase.delete({
      where: { id },
    })
  }

  async reorderPhases(povId: string, phaseIds: string[], order: number[]) {
    if (phaseIds.length !== order.length) {
      throw new ApiError("BAD_REQUEST", "Phase IDs and order arrays must have the same length")
    }

    const updates = phaseIds.map((id, index) => 
      prisma.phase.update({
        where: { id },
        data: { order: order[index] },
      })
    )

    await prisma.$transaction(updates)

    return this.getPhases(povId)
  }
}

export const povService = new PoVService()
