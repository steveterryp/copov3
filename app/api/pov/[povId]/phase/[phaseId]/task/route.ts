import { NextRequest, NextResponse } from 'next/server';
import { createTaskHandler, getPhaseTasksHandler, getTaskHandler, updateTaskHandler } from '@/lib/tasks/handlers/task';

export async function POST(
  req: NextRequest,
  { params }: { params: { povId: string; phaseId: string } }
) {
  try {
    const data = await req.json();
    const response = await createTaskHandler(req, params.povId, params.phaseId, data);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Task Create Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { povId: string; phaseId: string; taskId?: string } }
) {
  try {
    // Get the taskId from the URL if it exists
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const taskId = segments[segments.length - 1];

    // If taskId is present in the URL, get a single task
    if (taskId && taskId !== 'task') {
      const response = await getTaskHandler(req, params.povId, params.phaseId, taskId);
      return NextResponse.json(response);
    }

    // Otherwise, get all tasks for the phase
    const response = await getPhaseTasksHandler(req, params.povId, params.phaseId);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Task Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch task(s)' },
      { status: error instanceof Error ? 400 : 500 }
    );
  }
}
