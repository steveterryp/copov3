import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { ResourceAction, ResourceType, UserRole } from '@/lib/types/auth';
import { checkPermission } from '@/lib/auth/permissions';
import { TaskService } from '../services/task';

/**
 * Get available assignees handler
 */
export async function getAvailableAssigneesHandler(
  req: NextRequest,
  povId: string,
  phaseId: string
): Promise<{ data: any[] }> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get PoV for permission check
  const pov = await prisma.pOV.findUnique({
    where: { id: povId },
    select: { ownerId: true, teamId: true },
  });

  if (!pov) {
    throw new Error('PoV not found');
  }

  // Check view permission on PoV
  const hasViewPermission = await checkPermission(
    { id: user.userId, role: user.role as UserRole },
    { id: povId, type: ResourceType.PoV, ownerId: pov.ownerId, teamId: pov.teamId || undefined },
    ResourceAction.VIEW
  );

  if (!hasViewPermission) {
    throw new Error('Permission denied - requires VIEW access to PoV');
  }

  if (!pov.teamId) {
    throw new Error('PoV has no team assigned');
  }

  const users = await TaskService.getAvailableAssignees(pov.teamId);
  return { data: users };
}
