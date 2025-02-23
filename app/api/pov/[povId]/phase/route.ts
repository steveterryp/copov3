import { NextRequest, NextResponse } from 'next/server';
import { createPhaseHandler } from '@/lib/pov/handlers/post';

interface RouteParams {
  params: {
    povId: string;
  };
}

/**
 * POST /api/pov/[povId]/phase
 * Create a new phase in a PoV
 */
export async function POST(req: NextRequest, params: RouteParams) {
  try {
    const response = await createPhaseHandler(req, params);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Phase Create Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create phase' },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
