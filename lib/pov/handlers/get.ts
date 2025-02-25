import { NextRequest } from "next/server"
import { ApiError } from "@/lib/errors"
import { povService } from "@/lib/pov/services/pov"
import { getAuthUser } from "@/lib/auth"
import { UserRole } from "@/lib/types/auth"
import { TeamMember } from "@prisma/client"

export async function getPoVHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "No user found");
  }

  const { povId } = params;
  console.log(`[POV Get] Fetching POV ${povId} for user ${user.userId} (${user.role})`);

  const pov = await povService.get(povId);
  if (!pov) {
    console.error(`[POV Get] POV ${povId} not found`);
    throw new ApiError("NOT_FOUND", "PoV not found");
  }

  console.log(`[POV Get] Found POV ${povId}:`, {
    ownerId: pov.ownerId,
    hasTeam: !!pov.team,
    teamMembersCount: pov.team?.members?.length ?? 0
  });

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  
  // Ensure team and members are properly initialized
  const teamMembers = pov.team?.members ?? [];
  const isTeamMember = Array.isArray(teamMembers) && 
    teamMembers.some((member: TeamMember & { user: { id: string } }) => 
      member.user?.id === user.userId
    );

  const hasAccess = isAdmin || pov.ownerId === user.userId || isTeamMember;

  console.log(`[POV Get] Access check for POV ${povId}:`, {
    isAdmin,
    isOwner: pov.ownerId === user.userId,
    isTeamMember,
    hasAccess
  });

  if (!hasAccess) {
    console.error(`[POV Get] Access denied for user ${user.userId} to POV ${povId}`);
    throw new ApiError("FORBIDDEN", "Access denied");
  }

  // Return the POV data directly instead of a Response object
  return pov;
}

export async function getPoVListHandler(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      throw new ApiError("UNAUTHORIZED", "No user found");
    }

    console.log(`[POV List] Fetching POVs for user ${user.userId} (${user.role})`);

    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    const povs = await povService.list(user.userId, isAdmin);

    console.log(`[POV List] Found ${povs.length} POVs for user ${user.userId}`);

    // Return the data directly
    return { data: povs };
  } catch (error) {
    console.error('[POV List Error]:', error);
    throw error;
  }
}

export async function getPhaseHandler(
  request: NextRequest,
  { params }: { params: { povId: string; phaseId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "No user found");
  }

  const { phaseId } = params;
  console.log(`[Phase Get] Fetching phase ${phaseId} for user ${user.userId} (${user.role})`);

  const phase = await povService.getPhase(phaseId);
  if (!phase) {
    console.error(`[Phase Get] Phase ${phaseId} not found`);
    throw new ApiError("NOT_FOUND", "Phase not found");
  }

  console.log(`[Phase Get] Found phase ${phaseId} for POV ${phase.pov.id}`);

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  
  // Ensure team and members are properly initialized
  const teamMembers = phase.pov.team?.members ?? [];
  const isTeamMember = Array.isArray(teamMembers) && 
    teamMembers.some((member: TeamMember & { user: { id: string } }) => 
      member.user?.id === user.userId
    );

  const hasAccess = isAdmin || phase.pov.ownerId === user.userId || isTeamMember;

  console.log(`[Phase Get] Access check for phase ${phaseId}:`, {
    isAdmin,
    isOwner: phase.pov.ownerId === user.userId,
    isTeamMember,
    hasAccess
  });

  if (!hasAccess) {
    console.error(`[Phase Get] Access denied for user ${user.userId} to phase ${phaseId}`);
    throw new ApiError("FORBIDDEN", "Access denied");
  }

  // Return the phase data directly
  return phase;
}

export async function getPoVPhasesHandler(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError("UNAUTHORIZED", "No user found");
  }

  const { povId } = params;
  console.log(`[POV Phases] Fetching phases for POV ${povId}, user ${user.userId} (${user.role})`);

  const pov = await povService.get(povId);
  if (!pov) {
    console.error(`[POV Phases] POV ${povId} not found`);
    throw new ApiError("NOT_FOUND", "PoV not found");
  }

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  
  // Ensure team and members are properly initialized
  const teamMembers = pov.team?.members ?? [];
  const isTeamMember = Array.isArray(teamMembers) && 
    teamMembers.some((member: TeamMember & { user: { id: string } }) => 
      member.user?.id === user.userId
    );

  const hasAccess = isAdmin || pov.ownerId === user.userId || isTeamMember;

  console.log(`[POV Phases] Access check for POV ${povId}:`, {
    isAdmin,
    isOwner: pov.ownerId === user.userId,
    isTeamMember,
    hasAccess
  });

  if (!hasAccess) {
    console.error(`[POV Phases] Access denied for user ${user.userId} to POV ${povId}`);
    throw new ApiError("FORBIDDEN", "Access denied");
  }

  const phases = await povService.getPhases(povId);
  console.log(`[POV Phases] Found ${phases.length} phases for POV ${povId}`);

  // Return the phases data directly
  return phases;
}
