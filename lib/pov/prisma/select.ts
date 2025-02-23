import { Prisma } from '@prisma/client';

// User Select Types
export const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true
} as const;

// POV Select Types
export const povWithOwner = Prisma.validator<Prisma.POVDefaultArgs>()({
  include: {
    owner: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
});

export const povWithTeam = Prisma.validator<Prisma.POVDefaultArgs>()({
  include: {
    team: {
      select: {
        id: true,
        name: true
      }
    }
  }
});

export const povWithPhases = Prisma.validator<Prisma.POVDefaultArgs>()({
  include: {
    phases: {
      include: {
        template: true
      }
    }
  }
});

export const povWithMilestones = Prisma.validator<Prisma.POVDefaultArgs>()({
  include: {
    milestones: true
  }
});

export const povWithKPIs = Prisma.validator<Prisma.POVDefaultArgs>()({
  include: {
    kpis: {
      include: {
        template: true
      }
    }
  }
});

export const povWithLaunch = Prisma.validator<Prisma.POVDefaultArgs>()({
  include: {
    launch: true
  }
});

export const povWithSyncHistory = Prisma.validator<Prisma.POVDefaultArgs>()({
  include: {
    syncHistory: {
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    }
  }
});

export const fullPOV = Prisma.validator<Prisma.POVDefaultArgs>()({
  include: {
    owner: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    team: {
      select: {
        id: true,
        name: true
      }
    },
    phases: {
      include: {
        template: true
      }
    },
    milestones: true,
    kpis: {
      include: {
        template: true
      }
    },
    launch: true,
    syncHistory: {
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    }
  }
});

// Phase Select Types
export const phaseWithTemplate = Prisma.validator<Prisma.PhaseDefaultArgs>()({
  include: {
    template: true
  }
});

export const phaseWithTasks = Prisma.validator<Prisma.PhaseDefaultArgs>()({
  include: {
    tasks: true
  }
});

export const fullPhase = Prisma.validator<Prisma.PhaseDefaultArgs>()({
  include: {
    template: true,
    tasks: true,
    pov: {
      select: {
        id: true,
        title: true,
        status: true
      }
    }
  }
});

// KPI Select Types
export const kpiWithTemplate = Prisma.validator<Prisma.POVKPIDefaultArgs>()({
  include: {
    template: true
  }
});

export const fullKPI = Prisma.validator<Prisma.POVKPIDefaultArgs>()({
  include: {
    template: true,
    pov: {
      select: {
        id: true,
        title: true,
        status: true
      }
    }
  }
});

// Types based on selects
export type POVWithOwner = Prisma.POVGetPayload<typeof povWithOwner>;
export type POVWithTeam = Prisma.POVGetPayload<typeof povWithTeam>;
export type POVWithPhases = Prisma.POVGetPayload<typeof povWithPhases>;
export type POVWithMilestones = Prisma.POVGetPayload<typeof povWithMilestones>;
export type POVWithKPIs = Prisma.POVGetPayload<typeof povWithKPIs>;
export type POVWithLaunch = Prisma.POVGetPayload<typeof povWithLaunch>;
export type POVWithSyncHistory = Prisma.POVGetPayload<typeof povWithSyncHistory>;
export type FullPOV = Prisma.POVGetPayload<typeof fullPOV>;

export type PhaseWithTemplate = Prisma.PhaseGetPayload<typeof phaseWithTemplate>;
export type PhaseWithTasks = Prisma.PhaseGetPayload<typeof phaseWithTasks>;
export type FullPhase = Prisma.PhaseGetPayload<typeof fullPhase>;

export type KPIWithTemplate = Prisma.POVKPIGetPayload<typeof kpiWithTemplate>;
export type FullKPI = Prisma.POVKPIGetPayload<typeof fullKPI>;
