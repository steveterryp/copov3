# Dashboard Specification

## Overview
The dashboard serves as the central hub for PoV management, providing real-time insights, analytics, and quick access to key features. It follows a modular widget-based architecture with a responsive layout.

## Current Implementation

### 1. Active PoVs Widget
```typescript
interface ActivePoVStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
  byStatus: {
    [key: string]: number;
  };
}
```

#### Features
- Total PoV count
- Status distribution
- Active vs Completed metrics
- Pending PoVs tracking

### 2. Team Status Widget
```typescript
interface TeamStatusData {
  members: TeamMemberActivity[];
  recentActivities: Array<{
    id: string;
    type: 'USER_ROLE' | 'POV_ACTION';
    action: string;
    userId: string;
    userName: string;
    timestamp: Date;
    details: string;
    role?: string;
    povName?: string;
  }>;
}

interface TeamMemberActivity {
  userId: string;
  userName: string;
  activityCount: number;
  lastActive: Date;
  currentTasks: number;
  completedTasks: number;
}
```

#### Features
- Team member activity tracking
- Task completion metrics
- Last active timestamps
- Recent activity feed

### 3. Milestones Widget
```typescript
interface Milestone {
  id: string;
  povId: string;
  title: string;
  dueDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number;
  assignees: Array<{
    id: string;
    name: string;
  }>;
}
```

#### Features
- Phase tracking
- Progress indicators
- Due date monitoring
- Assignee management

### 4. Resource Usage Widget
```typescript
interface ResourceUsageData {
  team: ResourceAllocation;
  tasks: ResourceAllocation;
  timeline: ResourceAllocation;
}

interface ResourceAllocation {
  resourceType: string;
  allocated: number;
  available: number;
  total: number;
}
```

#### Features
- Team allocation tracking
- Task distribution
- Timeline management
- Resource availability metrics

### 5. Risk Overview Widget
```typescript
interface RiskOverviewData {
  overall: RiskMetric[];
  byCategory: {
    [key: string]: RiskMetric[];
  };
}

interface RiskMetric {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  count: number;
  percentage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}
```

#### Features
- Risk level distribution
- Category-based analysis
- Trend indicators
- Percentage calculations

### 6. Success Rate Widget
```typescript
interface SuccessRateData {
  current: number;
  historical: SuccessMetric[];
  byCategory: {
    [key: string]: number;
  };
}

interface SuccessMetric {
  period: string;
  rate: number;
  total: number;
  successful: number;
  factors: Array<{
    name: string;
    impact: number;
  }>;
}
```

#### Features
- Current success rate
- Historical trends
- Category breakdown
- Success factors analysis

## Layout System

### Current Grid Layout
```typescript
// Dashboard Page Layout
<Grid container spacing={3}>
  <Grid item xs={12} md={4}>
    <ActivePoVs />
  </Grid>
  <Grid item xs={12} md={4}>
    <SuccessRate />
  </Grid>
  <Grid item xs={12} md={4}>
    <Milestones />
  </Grid>
  <Grid item xs={12} md={4}>
    <ResourceUsage />
  </Grid>
  <Grid item xs={12} md={4}>
    <RiskOverview />
  </Grid>
  <Grid item xs={12} md={4}>
    <TeamStatus />
  </Grid>
</Grid>
```

### Features
- Responsive grid using Material-UI
- 3-column layout on desktop
- Single column on mobile
- Consistent widget spacing

## Data Management

### Data Fetching
```typescript
// Custom hook implementation (lib/dashboard/hooks/useDashboard.ts)
export function useDashboardData<T>(widget: string) {
  return useQuery<ResponseWrapper<T>>({
    queryKey: ['dashboard', widget],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/${widget}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch dashboard data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data fresh for 15 seconds
    retry: (failureCount, error) => {
      // Don't retry on 401/403 errors
      if (error instanceof Error && 
          error.message.includes('Unauthorized')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

// Usage in widget components with type safety
interface POVWidgetData {
  id: string;
  title: string;
  status: POVStatus;
  priority: Priority;
  team: {
    id: string;
    name: string;
    members: Array<{
      user: {
        id: string;
        name: string;
        email: string;
      };
      role: TeamRole;
    }>;
  };
}

const { data, isLoading, error } = useDashboardData<POVWidgetData[]>('povs');

// Batch data fetching in service layer with proper error handling
try {
  const [
    activePoVStats,
    teamStatus,
    milestones,
    resourceUsage,
    riskOverview,
    successRate,
  ] = await Promise.all([
    getDashboardData('activePoVs'),
    getDashboardData('teamStatus'),
    getDashboardData('milestones'),
    getDashboardData('resourceUsage'),
    getDashboardData('riskOverview'),
    getDashboardData('successRate'),
  ]);
} catch (error) {
  console.error('[Dashboard Data Error]:', error);
  // Handle error appropriately
}
```

### API Structure
```typescript
// API Endpoints with proper error handling
GET /api/dashboard/{widgetName}

// Response Format with type safety
interface ResponseWrapper<T> {
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Example response for POV widget
{
  "data": [{
    "id": "cln1234abc",
    "title": "UPS Security Infrastructure Assessment",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "team": {
      "id": "team123",
      "name": "Enterprise Security",
      "members": [{
        "user": {
          "id": "user123",
          "name": "Rika Terry",
          "email": "rika@example.com"
        },
        "role": "OWNER"
      }]
    }
  }],
  "error": null
}

// Error response example
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User not authenticated"
  }
}
```

## Implementation Status

### Completed
1. Core Widget Implementation
   - Widget components with TypeScript
   - Loading states with skeletons
   - Error handling with alerts
   - Responsive layouts
   - Type-safe data fetching
   - Proper error boundaries
   - Retry strategies
   - Loading state management

2. Data Layer
   - Type-safe Prisma queries
   - Efficient data mapping
   - Batch fetching capability
   - Error logging

3. UI Components
   - Material-UI integration
   - Consistent styling
   - Responsive design
   - Loading states

### Planned Enhancements

1. Widget Customization
   - User-specific layouts
   - Widget visibility toggles
   - Refresh interval settings
   - Custom metrics

2. Advanced Analytics
   - Trend analysis
   - Predictive metrics
   - Custom reporting
   - Data exports

3. Performance Optimizations
   - Data pagination
   - Caching improvements
   - Bundle optimization
   - Real-time updates

## Technical Requirements

### Performance
- Optimized Prisma queries
- Efficient data mapping
- Proper error handling
- Loading state management

### Security
- Authentication middleware
- Type-safe implementations
- Data access validation
- Error logging

### Testing
1. Unit Tests
   - Widget components
   - Data mapping functions
   - Utility functions

2. Integration Tests
   - API endpoints
   - Database queries
   - Data transformations

## Next Steps
1. Implement widget customization
2. Add advanced analytics
3. Optimize performance
4. Enhance visualization options
