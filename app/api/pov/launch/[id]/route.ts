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

// GET /api/pov/launch/[id] - Get launch details
export const GET = async (req: NextRequest) => {
  try {
    // Extract launch ID from URL
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const launchId = segments[segments.length - 1];

    // Get launch with POV details
    const launch = await prisma.pOVLaunch.findUnique({
      where: { id: launchId },
      include: {
        pov: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    if (!launch) {
      return NextResponse.json(
        { error: 'Launch not found' },
        { status: 404 }
      );
    }

    // Get validation status if launch is in progress
    let validation;
    if (!launch.confirmed) {
      // Check checklist completion
      const checklist = launch.checklist as any;
      const errors: string[] = [];

      checklist.items.forEach((item: any) => {
        if (!item.completed) {
          errors.push(`Checklist item "${item.label}" not completed`);
        }
      });

      // Check phase workflows
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

      validation = {
        valid: errors.length === 0,
        errors
      };
    }

    // Map response
    const response = {
      id: launch.id,
      povId: launch.povId,
      povTitle: launch.pov.title,
      status: launch.confirmed ? 'LAUNCHED' : 'IN_PROGRESS',
      checklist: launch.checklist,
      launchedAt: launch.launchedAt,
      launchedBy: launch.launchedBy,
      validation
    };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('[Launch Details Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch launch details' },
      { status: 500 }
    );
  }
};
