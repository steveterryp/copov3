import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { workflowService } from './workflow';
import { 
  LaunchChecklistItem, 
  LaunchChecklist, 
  LaunchChecklistUpdate,
  LaunchStatusResponse,
  LaunchValidation 
} from '../types/launch';

class LaunchService {
  private static instance: LaunchService;

  private constructor() {}

  static getInstance(): LaunchService {
    if (!LaunchService.instance) {
      LaunchService.instance = new LaunchService();
    }
    return LaunchService.instance;
  }

  private defaultChecklist: LaunchChecklistItem[] = [
    { key: 'teamConfirmed', label: 'Team members confirmed', completed: false },
    { key: 'phasesReviewed', label: 'All phases reviewed', completed: false },
    { key: 'budgetApproved', label: 'Budget approved', completed: false },
    { key: 'resourcesAllocated', label: 'Resources allocated', completed: false },
    { key: 'detailsConfirmed', label: 'Details confirmed', completed: false }
  ];

  async initiateLaunch(povId: string) {
    // Verify POV exists
    const pov = await prisma.pOV.findUnique({
      where: { id: povId }
    });

    if (!pov) {
      throw new Error('POV not found');
    }

    // Create launch checklist
    return await prisma.pOVLaunch.create({
      data: {
        povId,
        confirmed: false,
        checklist: this.defaultChecklist as unknown as Prisma.InputJsonValue
      }
    });
  }

  async updateLaunchChecklist(
    launchId: string,
    updates: LaunchChecklistUpdate[]
  ) {
    const launch = await prisma.pOVLaunch.findUnique({
      where: { id: launchId }
    });

    if (!launch) {
      throw new Error('Launch not found');
    }

    const checklist = launch.checklist as unknown as LaunchChecklist;
    const updatedItems = checklist.items.map(item => {
      const update = updates.find(u => u.key === item.key);
      return update ? { ...item, completed: update.completed } : item;
    });

    return await prisma.pOVLaunch.update({
      where: { id: launchId },
      data: {
        checklist: { items: updatedItems } as unknown as Prisma.InputJsonValue
      }
    });
  }

  async validateLaunch(launchId: string): Promise<LaunchValidation> {
    const launch = await prisma.pOVLaunch.findUnique({
      where: { id: launchId },
      include: {
        pov: {
          include: {
            phases: true
          }
        }
      }
    });

    if (!launch) {
      throw new Error('Launch not found');
    }

    const errors: string[] = [];

    // Verify checklist
    const checklist = launch.checklist as unknown as LaunchChecklist;
    checklist.items.forEach((item: LaunchChecklistItem) => {
      if (!item.completed) {
        errors.push(`Checklist item "${item.label}" not completed`);
      }
    });

    // Verify phases
    const phaseValidations = await Promise.all(
      launch.pov.phases.map(async (phase) => workflowService.validatePhaseProgress(phase.id))
    );

    phaseValidations.forEach((validation, index) => {
      if (!validation.valid) {
        errors.push(`Phase ${index + 1} validation failed: ${validation.errors.join(', ')}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async confirmLaunch(launchId: string, userId: string) {
    const validation = await this.validateLaunch(launchId);
    if (!validation.valid) {
      throw new Error(`Launch validation failed: ${validation.errors.join(', ')}`);
    }

    return await prisma.pOVLaunch.update({
      where: { id: launchId },
      data: {
        confirmed: true,
        launchedAt: new Date(),
        launchedBy: userId
      }
    });
  }

  async getLaunchStatus(povId: string): Promise<LaunchStatusResponse> {
    const launch = await prisma.pOVLaunch.findFirst({
      where: { povId },
      orderBy: { createdAt: 'desc' }
    });

    if (!launch) {
      return {
        status: 'NOT_INITIATED',
        checklist: null,
        launchedAt: null,
        launchedBy: null
      };
    }

    return {
      status: launch.confirmed ? 'LAUNCHED' : 'IN_PROGRESS',
      checklist: launch.checklist,
      launchedAt: launch.launchedAt,
      launchedBy: launch.launchedBy
    };
  }
}

export const launchService = LaunchService.getInstance();
