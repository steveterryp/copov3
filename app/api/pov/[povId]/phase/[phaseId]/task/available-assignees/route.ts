import { NextRequest, NextResponse } from 'next/server';
import { getAvailableAssigneesHandler } from '@/lib/tasks/handlers/assignee';

export async function GET(
  req: NextRequest,
  { params }: { params: { povId: string; phaseId: string } }
) {
  try {
    const response = await getAvailableAssigneesHandler(req, params.povId, params.phaseId);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Available Assignees Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch available assignees' },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
