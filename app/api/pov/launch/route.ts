import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/middleware/auth';
import { ResourceAction, ResourceType } from '@/lib/types/auth';

// Get POV ID from request URL
const getPoVId = async (req: NextRequest) => {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const povId = segments.find((s, i) => segments[i - 1] === 'pov' && s !== '[povId]');
  if (!povId) throw new Error('PoV ID not found');
  return povId;
};

// GET /api/pov/launch - List all launches
export const GET = async (req: NextRequest) => {
  try {
    // Get all POVs with their launch status
    const povs = await prisma.pOV.findMany({
      where: {
        // Only get POVs that are in progress or ready for launch
        status: {
          in: ['IN_PROGRESS', 'VALIDATION']
        }
      },
      select: {
        id: true,
        title: true,
        launch: {
          select: {
            id: true,
            confirmed: true,
            checklist: true,
            launchedAt: true,
            launchedBy: true
          }
        }
      }
    });

    // Map POVs to launch items
    const launches = povs.map(pov => ({
      povId: pov.id,
      povTitle: pov.title,
      status: pov.launch
        ? pov.launch.confirmed
          ? 'LAUNCHED'
          : 'IN_PROGRESS'
        : 'NOT_INITIATED',
      checklist: pov.launch?.checklist || null,
      launchedAt: pov.launch?.launchedAt || null,
      launchedBy: pov.launch?.launchedBy || null
    }));

    return NextResponse.json({ data: launches });
  } catch (error) {
    console.error('[Launch List Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch launches' },
      { status: 500 }
    );
  }
};

// POST /api/pov/launch - Initiate a new launch
export const POST = requirePermission(
  ResourceAction.EDIT,
  ResourceType.PoV,
  getPoVId
)(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const povId = body.povId;

    if (!povId) {
      return NextResponse.json(
        { error: 'POV ID is required' },
        { status: 400 }
      );
    }

    // Verify POV exists and is in valid status
    const pov = await prisma.pOV.findUnique({
      where: { id: povId }
    });

    if (!pov) {
      return NextResponse.json(
        { error: 'POV not found' },
        { status: 404 }
      );
    }

    if (!['IN_PROGRESS', 'VALIDATION'].includes(pov.status)) {
      return NextResponse.json(
        { error: 'POV must be in progress or validation status to initiate launch' },
        { status: 400 }
      );
    }
    const launch = await prisma.pOVLaunch.create({
      data: {
        povId,
        confirmed: false,
        checklist: {
          items: [
            { key: 'teamConfirmed', label: 'Team members confirmed', completed: false },
            { key: 'phasesReviewed', label: 'All phases reviewed', completed: false },
            { key: 'budgetApproved', label: 'Budget approved', completed: false },
            { key: 'resourcesAllocated', label: 'Resources allocated', completed: false },
            { key: 'detailsConfirmed', label: 'Details confirmed', completed: false }
          ]
        }
      }
    });

    return NextResponse.json({ data: launch });
  } catch (error) {
    console.error('[Launch Creation Error]:', error);
    return NextResponse.json(
      { error: 'Failed to initiate launch' },
      { status: 500 }
    );
  }
});

// PUT /api/pov/launch - Update launch status or checklist
export const PUT = requirePermission(
  ResourceAction.EDIT,
  ResourceType.PoV,
  getPoVId
)(async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const launchId = url.searchParams.get('launchId');

    if (!launchId) {
      return NextResponse.json(
        { error: 'Launch ID is required' },
        { status: 400 }
      );
    }

    if (type === 'validate') {
      // Validate launch readiness
      const launch = await prisma.pOVLaunch.findUnique({
        where: { id: launchId },
        include: { pov: { include: { phases: true } } }
      });

      if (!launch) {
        return NextResponse.json(
          { error: 'Launch not found' },
          { status: 404 }
        );
      }

      const checklist = launch.checklist as any;
      const errors: string[] = [];

      // Check checklist completion
      checklist.items.forEach((item: any) => {
        if (!item.completed) {
          errors.push(`Checklist item "${item.label}" not completed`);
        }
      });

      // Check phases through workflow status
      const phaseWorkflows = await prisma.workflow.findMany({
        where: {
          povId: launch.povId,
          type: 'PHASE_APPROVAL'
        }
      });

      const incompletePhases = phaseWorkflows.filter(
        workflow => workflow.status !== 'COMPLETED'
      );

      if (incompletePhases.length > 0) {
        errors.push(`${incompletePhases.length} phases need approval workflow completion`);
      }

      return NextResponse.json({
        data: {
          valid: errors.length === 0,
          errors
        }
      });
    }

    if (type === 'confirm') {
      // Get user from request headers (set by auth middleware)
      const userId = req.headers.get('x-user-id');
      if (!userId) {
        return NextResponse.json(
          { error: 'User information not found' },
          { status: 401 }
        );
      }

      // Update launch status
      const launch = await prisma.pOVLaunch.update({
        where: { id: launchId },
        data: {
          confirmed: true,
          launchedAt: new Date(),
          launchedBy: userId
        }
      });

      return NextResponse.json({ data: launch });
    }

    // Default: update checklist
    const updates = await req.json();
    const launch = await prisma.pOVLaunch.findUnique({
      where: { id: launchId }
    });

    if (!launch) {
      return NextResponse.json(
        { error: 'Launch not found' },
        { status: 404 }
      );
    }

    const checklist = launch.checklist as any;
    const updatedItems = checklist.items.map((item: any) => {
      const update = updates.find((u: any) => u.key === item.key);
      return update ? { ...item, completed: update.completed } : item;
    });

    const updatedLaunch = await prisma.pOVLaunch.update({
      where: { id: launchId },
      data: {
        checklist: { items: updatedItems }
      }
    });

    return NextResponse.json({ data: updatedLaunch });
  } catch (error) {
    console.error('[Launch Update Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update launch' },
      { status: 500 }
    );
  }
});
