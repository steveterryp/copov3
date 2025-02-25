import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { checkPermission } from '@/lib/auth/permissions';
import { ResourceAction, ResourceType, UserRole } from '@/lib/types/auth';
import { prisma } from '@/lib/prisma';
import { TeamService } from '../services/team';
import { AvailableTeamMembersResponse } from '../types/team';
import { mapTeamMemberFromPrisma } from '../prisma/team';

/**
 * Get available team members handler
 */
export async function getAvailableTeamMembersHandler(
  req: NextRequest,
  povId: string
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get PoV to check permissions
    const pov = await prisma.pOV.findUnique({
      where: { id: povId },
      select: {
        ownerId: true,
        teamId: true,
      },
    });

    if (!pov) {
      throw new Error('PoV not found');
    }

    // Check edit permission since this is for team member selection
    const hasEditPermission = await checkPermission(
      { id: user.userId, role: user.role as UserRole },
      { id: povId, type: ResourceType.PoV, ownerId: pov.ownerId, teamId: pov.teamId || undefined },
      ResourceAction.EDIT
    );

    if (!hasEditPermission) {
      throw new Error('Permission denied');
    }

    // Get available team members
    const availableMembers = await TeamService.getAvailableMembers({
      povId,
      ownerId: pov.ownerId,
      teamId: pov.teamId || undefined,
    });

    // Return the data directly without wrapping it in a data property
    return Response.json(availableMembers.map(mapTeamMemberFromPrisma));
  } catch (error) {
    console.error('[getAvailableTeamMembersHandler]:', error);
    throw error;
  }
}
