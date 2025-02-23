import { prisma } from '@/lib/prisma';
import { TeamMemberSelection } from '../types/team';
import { teamMemberSelect } from '../prisma/team';

export class TeamService {
  /**
   * Get available users for team member selection
   */
  static async getAvailableMembers({ povId, ownerId }: TeamMemberSelection) {
    try {
      return await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          NOT: {
            id: ownerId,
          },
        },
        select: teamMemberSelect,
        orderBy: {
          name: 'asc',
        },
      });
    } catch (error) {
      console.error('[TeamService.getAvailableMembers]:', error);
      throw error;
    }
  }

  /**
   * Check if a user is a member of a team
   */
  static async isTeamMember({ teamId, userId }: { teamId: string; userId: string }) {
    try {
      const member = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId,
        },
      });
      return !!member;
    } catch (error) {
      console.error('[TeamService.isTeamMember]:', error);
      throw error;
    }
  }

  /**
   * Add members to a team
   */
  static async addMembers(teamId: string, userIds: string[]) {
    try {
      return await prisma.team.update({
        where: { id: teamId },
        data: {
          members: {
            createMany: {
              data: userIds.map(userId => ({
                userId,
                role: 'MEMBER',
              })),
            },
          },
        },
      });
    } catch (error) {
      console.error('[TeamService.addMembers]:', error);
      throw error;
    }
  }

  /**
   * Create a new team with members
   */
  static async createTeam(name: string, userIds: string[]) {
    try {
      return await prisma.team.create({
        data: {
          name,
          members: {
            createMany: {
              data: userIds.map(userId => ({
                userId,
                role: 'MEMBER',
              })),
            },
          },
        },
      });
    } catch (error) {
      console.error('[TeamService.createTeam]:', error);
      throw error;
    }
  }

  /**
   * Update team members
   */
  static async updateMembers(teamId: string, userIds: string[]) {
    try {
      return await prisma.team.update({
        where: { id: teamId },
        data: {
          members: {
            deleteMany: {},
            createMany: {
              data: userIds.map(userId => ({
                userId,
                role: 'MEMBER',
              })),
            },
          },
        },
      });
    } catch (error) {
      console.error('[TeamService.updateMembers]:', error);
      throw error;
    }
  }
}
