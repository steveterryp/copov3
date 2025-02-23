import { NextRequest, NextResponse } from 'next/server';
import { getAvailableTeamMembersHandler } from '@/lib/pov/handlers/team';

/**
 * GET /api/pov/[povId]/team/available
 * Get available users for team member selection
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { povId: string } }
) {
  try {
    const response = await getAvailableTeamMembersHandler(req, params.povId);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Available Team Members Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch available team members' },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
