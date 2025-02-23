import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { checkPermission } from '@/lib/auth/permissions';
import { ResourceAction, ResourceType, UserRole } from '@/lib/types/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { povService } from '../services/pov';
import { phaseService } from '../services/phase';
import { createPoVSchema, createPhaseSchema } from '../types/requests';

export async function createPoVHandler(
  request: NextRequest,
  { params }: { params: { povId?: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Unauthorized');
  }

  // Check if user has permission to create PoVs
  const hasPermission = await checkPermission(
    { id: user.userId, role: user.role as UserRole },
    { id: '', type: ResourceType.PoV },
    ResourceAction.CREATE
  );

  if (!hasPermission) {
    throw new ApiError('FORBIDDEN', 'Permission denied');
  }

  const data = await request.json();

  // Validate request body
  const validatedData = createPoVSchema.safeParse(data);
  if (!validatedData.success) {
    throw new ApiError('BAD_REQUEST', 'Invalid request body', validatedData.error);
  }

  // Create PoV
  const pov = await povService.create({
    ...validatedData.data,
    owner: {
      connect: { id: user.userId },
    },
  });

  return Response.json(pov);
}

export async function createPhaseHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Unauthorized');
  }

  const { povId } = params;

  // Get PoV to check permissions
  const pov = await prisma.pOV.findUnique({
    where: { id: povId },
    select: {
      ownerId: true,
      teamId: true,
    },
  });

  if (!pov) {
    throw new ApiError('NOT_FOUND', 'PoV not found');
  }

  // Check if user has permission to create phases
  const hasPermission = await checkPermission(
    { id: user.userId, role: user.role as UserRole },
    { id: povId, type: ResourceType.PoV, ownerId: pov.ownerId, teamId: pov.teamId || undefined },
    ResourceAction.EDIT
  );

  if (!hasPermission) {
    throw new ApiError('FORBIDDEN', 'Permission denied');
  }

  const data = await request.json();

  // Validate request body
  const validatedData = createPhaseSchema.safeParse(data);
  if (!validatedData.success) {
    throw new ApiError('BAD_REQUEST', 'Invalid request body', validatedData.error);
  }

  // Get current phases to determine order
  const phases = await phaseService.getPoVPhases(povId);
  const order = phases.length;

  // Create phase
  const phase = await phaseService.createPhase({
    ...validatedData.data,
    povId,
    order,
    templateId: validatedData.data.templateId,
  });

  return Response.json(phase);
}
