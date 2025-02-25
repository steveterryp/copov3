import { prisma } from "@/lib/prisma"
import { ApiError } from "@/lib/errors"
import { Prisma } from "@prisma/client"
import { PoVCreateInput, PoVUpdateInput } from "@/lib/pov/types/core"

import { fullPOV } from '../prisma/select';

export class PoVService {
  async create(data: PoVCreateInput) {
    return prisma.pOV.create({
      data,
      include: fullPOV.include,
    })
  }

  async get(id: string) {
    console.log(`[povService.get] Fetching POV with ID: ${id}`);
    const pov = await prisma.pOV.findUnique({
      where: { id },
      include: fullPOV.include,
    });
    console.log(`[povService.get] Prisma query result for POV ID ${id}:`, pov);
    return pov;
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
      include: fullPOV.include,
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  async update(id: string, data: PoVUpdateInput) {
    return prisma.pOV.update({
      where: { id },
      data,
      include: fullPOV.include,
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
          include: fullPOV.include,
        },
      },
    })
  }

  async getPhases(povId: string) {
    return prisma.phase.findMany({
      where: {
        povId,
      },
      include: {
        tasks: {
          include: {
            assignee: true
          }
        },
        template: true
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
      include: {
        tasks: {
          include: {
            assignee: true
          }
        },
        template: true
      },
    })
  }

  async updatePhase(id: string, data: Prisma.PhaseUpdateInput) {
    return prisma.phase.update({
      where: { id },
      data,
      include: {
        tasks: {
          include: {
            assignee: true
          }
        },
        template: true
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
