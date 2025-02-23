import { POVStatus } from '@prisma/client';
import { StatusTransition, ValidationResult, StatusTransitionResult, NotificationConfig, StatusCondition } from '../types/status';
import { PhaseResponse, PhaseTask } from '../types/core';
import { povService } from './pov';
import { mapPoVToResponse } from '../prisma/mappers';

class StatusTransitionService {
  private static instance: StatusTransitionService;

  private constructor() {}

  static getInstance(): StatusTransitionService {
    if (!StatusTransitionService.instance) {
      StatusTransitionService.instance = new StatusTransitionService();
    }
    return StatusTransitionService.instance;
  }

  private transitions: StatusTransition[] = [
    {
      from: POVStatus.PROJECTED,
      to: POVStatus.IN_PROGRESS,
      conditions: [
        {
          type: 'PHASE',
          check: async (pov) => Boolean(pov.phases && pov.phases.length > 0),
          errorMessage: 'PoV must have at least one phase'
        }
      ],
      notifications: [
        {
          roles: ['OWNER', 'ADMIN'],
          template: 'POV_STATUS_CHANGE'
        }
      ]
    },
    {
      from: POVStatus.IN_PROGRESS,
      to: POVStatus.VALIDATION,
      conditions: [
        {
          type: 'PHASE',
          check: async (pov) => {
            const completedPhases = pov.phases?.filter((p: PhaseResponse) => 
              p.details.tasks.every((t: PhaseTask) => t.completed)
            );
            return Boolean(completedPhases?.length === pov.phases?.length);
          },
          errorMessage: 'All phases must be completed'
        }
      ],
      notifications: [
        {
          roles: ['OWNER', 'ADMIN'],
          template: 'POV_READY_FOR_VALIDATION'
        }
      ]
    },
    {
      from: POVStatus.VALIDATION,
      to: POVStatus.WON,
      conditions: [
        {
          type: 'KPI',
          check: async (pov) => {
            // TODO: Implement KPI validation logic
            return true;
          },
          errorMessage: 'KPI targets not met'
        }
      ],
      notifications: [
        {
          roles: ['OWNER', 'ADMIN'],
          template: 'POV_WON',
          data: {
            notifyCustomer: true
          }
        }
      ]
    },
    {
      from: POVStatus.IN_PROGRESS,
      to: POVStatus.STALLED,
      conditions: [],
      notifications: [
        {
          roles: ['OWNER', 'ADMIN'],
          template: 'POV_STALLED'
        }
      ]
    },
    {
      from: POVStatus.VALIDATION,
      to: POVStatus.LOST,
      conditions: [],
      notifications: [
        {
          roles: ['OWNER', 'ADMIN'],
          template: 'POV_LOST'
        }
      ]
    }
  ];

  async validateTransition(
    povId: string,
    newStatus: POVStatus
  ): Promise<ValidationResult> {
    const rawPov = await povService.get(povId);
    if (!rawPov) {
      return {
        valid: false,
        errors: ['PoV not found']
      };
    }

    const pov = mapPoVToResponse(rawPov);
    const transition = this.transitions.find(
      (transition: StatusTransition) => transition.from === pov.status && transition.to === newStatus
    );
    
    if (!transition) {
      return {
        valid: false,
        errors: ['Invalid status transition']
      };
    }

    const results = await Promise.all(
      transition.conditions.map((condition: StatusCondition) => condition.check(pov))
    );

    const errors = transition.conditions
      .filter((_: StatusCondition, i: number) => !results[i])
      .map((condition: StatusCondition) => condition.errorMessage);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async transitionStatus(
    povId: string,
    newStatus: POVStatus
  ): Promise<StatusTransitionResult> {
    const validation = await this.validateTransition(povId, newStatus);
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors.map(message => ({
          type: 'CONDITION_NOT_MET',
          message
        }))
      };
    }

    try {
      const rawPov = await povService.update(povId, { status: newStatus });
      const pov = mapPoVToResponse(rawPov);
      const transition = this.transitions.find(
        (transition: StatusTransition) => transition.from === pov.status && transition.to === newStatus
      );

      // TODO: Implement notification sending
      const notifications = transition?.notifications || [];

      return {
        success: true,
        newStatus,
        notifications
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        errors: [{
          type: 'CUSTOM',
          message: 'Failed to update PoV status',
          details: { error: errorMessage }
        }]
      };
    }
  }

  getAvailableTransitions(currentStatus: POVStatus): POVStatus[] {
    return this.transitions
      .filter((transition: StatusTransition) => transition.from === currentStatus)
      .map((transition: StatusTransition) => transition.to);
  }
}

export const statusService = StatusTransitionService.getInstance();
