import { NextRequest, NextResponse } from 'next/server';
import { getTaskHandler, updateTaskHandler } from '@/lib/tasks/handlers/task';

export async function GET(
  req: NextRequest,
  { params }: { params: { povId: string; phaseId: string; taskId: string } }
) {
  try {
    const response = await getTaskHandler(req, params.povId, params.phaseId, params.taskId);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Task Get Error]:', {
      error,
      params,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch task' },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { povId: string; phaseId: string; taskId: string } }
) {
  try {
    // Parse request body
    const data = await req.json();
    console.log('[Task Update] Request:', { params, data });

    // Validate taskId
    if (!params.taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Update task
    const response = await updateTaskHandler(req, params.povId, params.phaseId, params.taskId, data);
    console.log('[Task Update] Success:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Task Update Error]:', {
      error,
      params,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Check if it's a Prisma error
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 400 }
      );
    }

    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
