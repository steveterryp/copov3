import { prisma } from '@/lib/prisma';
import { POVStatus } from '@prisma/client';
import {
  activePoVsSelect,
  teamStatusSelect,
  milestonesSelect,
  resourceUsageSelect,
  riskOverviewSelect,
  successRateSelect,
} from '../prisma/select';
import {
  mapToActivePoVStats,
  mapToTeamStatusData,
  mapToMilestones,
  mapToResourceUsageData,
  mapToRiskOverviewData,
  mapToSuccessRateData,
} from '../prisma/mappers';

export async function getActivePoVStats() {
  console.log('[Dashboard Service] Fetching active PoVs');
  
  try {
    const povs = await prisma.pOV.findMany({
      where: {
        status: {
          in: [POVStatus.PROJECTED, POVStatus.IN_PROGRESS, POVStatus.WON],
        },
      },
      select: activePoVsSelect,
    });
    console.log('[Dashboard Service] Active PoVs raw data:', JSON.stringify(povs, null, 2));
    
    const result = mapToActivePoVStats(povs);
    console.log('[Dashboard Service] Active PoVs mapped data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('[Dashboard Service] Error fetching active PoVs:', error);
    throw error;
  }
}

export async function getTeamStatusData() {
  console.log('[Dashboard Service] Fetching team status');
  
  try {
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: teamStatusSelect,
    });
    console.log('[Dashboard Service] Team status raw data:', JSON.stringify(users, null, 2));
    
    const result = mapToTeamStatusData(users);
    console.log('[Dashboard Service] Team status mapped data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('[Dashboard Service] Error fetching team status:', error);
    throw error;
  }
}

export async function getMilestones() {
  console.log('[Dashboard Service] Fetching milestones');
  
  try {
    const povs = await prisma.pOV.findMany({
      where: {
        status: POVStatus.IN_PROGRESS,
      },
      select: milestonesSelect,
    });
    console.log('[Dashboard Service] Milestones raw data:', JSON.stringify(povs, null, 2));
    
    const result = mapToMilestones(povs);
    console.log('[Dashboard Service] Milestones mapped data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('[Dashboard Service] Error fetching milestones:', error);
    throw error;
  }
}

export async function getResourceUsage() {
  console.log('[Dashboard Service] Fetching resource usage');
  
  try {
    const povs = await prisma.pOV.findMany({
      where: {
        status: POVStatus.IN_PROGRESS,
      },
      select: resourceUsageSelect,
    });
    console.log('[Dashboard Service] Resource usage raw data:', JSON.stringify(povs, null, 2));
    
    const result = mapToResourceUsageData(povs);
    console.log('[Dashboard Service] Resource usage mapped data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('[Dashboard Service] Error fetching resource usage:', error);
    throw error;
  }
}

export async function getRiskOverview() {
  console.log('[Dashboard Service] Fetching risk overview');
  
  try {
    const povs = await prisma.pOV.findMany({
      where: {
        status: {
          in: [POVStatus.IN_PROGRESS, POVStatus.WON],
        },
      },
      select: riskOverviewSelect,
    });
    console.log('[Dashboard Service] Risk overview raw data:', JSON.stringify(povs, null, 2));
    
    const result = mapToRiskOverviewData(povs);
    console.log('[Dashboard Service] Risk overview mapped data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('[Dashboard Service] Error fetching risk overview:', error);
    throw error;
  }
}

export async function getSuccessRate() {
  console.log('[Dashboard Service] Fetching success rate');
  
  try {
    const povs = await prisma.pOV.findMany({
      where: {
        status: {
          in: [POVStatus.IN_PROGRESS, POVStatus.WON],
        },
      },
      select: successRateSelect,
    });
    console.log('[Dashboard Service] Success rate raw data:', JSON.stringify(povs, null, 2));
    
    const result = mapToSuccessRateData(povs);
    console.log('[Dashboard Service] Success rate mapped data:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('[Dashboard Service] Error fetching success rate:', error);
    throw error;
  }
}

// Retry configuration
const RETRY_OPTIONS = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
};

// Helper function to implement exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error && 
        error.message.includes('Too many database connections') &&
        retryCount < RETRY_OPTIONS.maxRetries) {
      const delay = Math.min(
        RETRY_OPTIONS.initialDelay * Math.pow(2, retryCount),
        RETRY_OPTIONS.maxDelay
      );
      console.log(`[Dashboard Service] Retrying after ${delay}ms (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retryCount + 1);
    }
    throw error;
  }
}

export interface DashboardData {
  activePoVStats: Awaited<ReturnType<typeof getActivePoVStats>>;
  teamStatus: Awaited<ReturnType<typeof getTeamStatusData>>;
  milestones: Awaited<ReturnType<typeof getMilestones>>;
  resourceUsage: Awaited<ReturnType<typeof getResourceUsage>>;
  riskOverview: Awaited<ReturnType<typeof getRiskOverview>>;
  successRate: Awaited<ReturnType<typeof getSuccessRate>>;
}

// Batch fetch for dashboard with optimized querying and retry logic
export async function getDashboardData(): Promise<DashboardData> {
  console.log('[Dashboard Service] Starting optimized batch fetch');
  
  return withRetry<DashboardData>(async () => {
    try {
      // Fetch data directly without transaction
      const povs = await prisma.pOV.findMany({
        where: {
          status: {
            in: [POVStatus.PROJECTED, POVStatus.IN_PROGRESS, POVStatus.WON],
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
          phases: {
            select: {
              id: true,
              name: true,
              description: true,
              type: true,
              startDate: true,
              endDate: true,
              order: true,
              tasks: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  priority: true,
                  assignee: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          team: {
            select: {
              members: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      assignedTasks: {
                        select: {
                          id: true,
                          status: true,
                          priority: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Fetch team data 
      const users = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: teamStatusSelect,
      });

      console.log('[Dashboard Service] Type of PoVs:', typeof povs);
      if (povs && povs.length > 0) {
        console.log('[Dashboard Service] First PoV element:', povs[0]);
      }

      // Map data to respective formats
      return {
        activePoVStats: mapToActivePoVStats(povs),
        teamStatus: mapToTeamStatusData(users),
        milestones: mapToMilestones(povs),
        resourceUsage: mapToResourceUsageData(povs),
        riskOverview: mapToRiskOverviewData(povs),
        successRate: mapToSuccessRateData(povs),
      };
    } catch (error) {
      console.error('[Dashboard Service] Error in batch fetch:', error);
      throw error;
    }
  });
}
