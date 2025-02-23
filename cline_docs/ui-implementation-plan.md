# UI Implementation Plan

[← Back to Documentation Index](./README.md)

## Overview

This document outlines the implementation plan for new UI features based on the enhanced POV architecture. The plan focuses on four key areas: CRM Integration, Phase Templates, KPI System, and Launch Process.

## Route Structure

```
app/
├── (authenticated)/
│   ├── pov/
│   │   ├── [povId]/
│   │   │   ├── crm/              # CRM Integration
│   │   │   │   ├── sync.tsx      # Sync status and history
│   │   │   │   └── mapping.tsx   # Field mapping config
│   │   │   ├── phases/           # Phase Management
│   │   │   │   ├── templates/    # Template management
│   │   │   │   └── [phaseId]/    # Phase details & approval
│   │   │   ├── kpi/              # KPI Management
│   │   │   │   ├── templates/    # KPI template management
│   │   │   │   └── [kpiId]/      # KPI details and history
│   │   │   └── launch/           # Launch Process
│   │   │       ├── checklist.tsx # Launch checklist
│   │   │       └── status.tsx    # Launch status
│   │   └── create/               # Enhanced POV creation
│   └── admin/
│       ├── templates/            # Global template management
│       └── kpi-templates/        # Global KPI template management
└── api/
    ├── pov/
    │   ├── [povId]/
    │   │   ├── crm/             # CRM endpoints
    │   │   ├── phases/          # Phase endpoints
    │   │   ├── kpi/             # KPI endpoints
    │   │   └── launch/          # Launch endpoints
    │   └── templates/           # Template endpoints
```

## Component Structure

### 1. POV Creation Components

#### Import Standards
```typescript
// Standard import patterns for POV components
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Form from '@/components/ui/Form';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import Select from '@/components/ui/Select';
```

#### POVCreationForm
```typescript
// components/pov/create/POVCreationForm.tsx
interface POVCreationFormProps {
  onSubmit: (data: CreatePOVRequest) => Promise<void>;
}

interface CreatePOVRequest {
  title: string;
  description: string;
  status: POVStatus;
  priority: Priority;
  startDate: Date;
  endDate: Date;
  metadata: {
    customer: string;
    teamSize: string;
    successCriteria: string;
    technicalRequirements: string;
  };
}

// Features:
// - Form validation with Zod schema
// - Date range selection
// - Metadata field validation
// - Auto team creation
// - Initial phase setup
```

### 2. CRM Integration Components

#### CRMSyncStatus
```typescript
// components/pov/crm/SyncStatus.tsx
interface SyncStatusProps {
  povId: string;
  onSync: () => void;
}

// Features:
// - Real-time sync status display
// - Sync history timeline
// - Error handling and retry
// - Last sync timestamp
```

#### CRMFieldMapping
```typescript
// components/pov/crm/FieldMapping.tsx
interface FieldMappingProps {
  povId: string;
  mappings: CRMFieldMapping[];
  onUpdate: (mappings: CRMFieldMapping[]) => void;
}

// Features:
// - Drag-and-drop field mapping
// - Field transformation rules
// - Validation preview
// - Required field indicators
```

### 2. Phase Template Components

#### PhaseTemplateSelector
```typescript
// components/pov/phases/TemplateSelector.tsx
interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
  preselectedType?: PhaseType;
}

// Features:
// - Template preview cards
// - Filtering by type/category
// - Quick template comparison
// - Custom template creation
```

#### PhaseApprovalWorkflow
```typescript
// components/pov/phases/ApprovalWorkflow.tsx
interface ApprovalWorkflowProps {
  phaseId: string;
  steps: WorkflowStep[];
  currentStep: number;
}

// Features:
// - Step progression visualization
// - Approval action buttons
// - Comment/feedback system
// - Status notifications
```

### 3. KPI System Components

#### KPITemplateManager
```typescript
// components/pov/kpi/TemplateManager.tsx
interface KPITemplateManagerProps {
  templates: KPITemplate[];
  onCreateTemplate: (template: KPITemplate) => void;
  onUpdateTemplate: (id: string, template: KPITemplate) => void;
}

// Features:
// - Template CRUD operations
// - Calculation formula editor
// - Visualization settings
// - Default target configuration
```

#### KPIHistoryChart
```typescript
// components/pov/kpi/HistoryChart.tsx
interface KPIHistoryChartProps {
  kpiId: string;
  history: KPIHistoryEntry[];
  target: KPITarget;
}

// Features:
// - Interactive timeline
// - Trend analysis
// - Target comparison
// - Milestone markers
```

### 4. Launch Process Components

#### LaunchChecklist
```typescript
// components/pov/launch/Checklist.tsx
interface LaunchChecklistProps {
  povId: string;
  checklist: LaunchChecklistItem[];
  onItemComplete: (itemKey: string) => void;
}

// Features:
// - Interactive checklist
// - Dependency handling
// - Progress tracking
// - Validation indicators
```

#### LaunchStatusDashboard
```typescript
// components/pov/launch/StatusDashboard.tsx
interface LaunchStatusDashboardProps {
  povId: string;
  status: LaunchStatus;
  metrics: LaunchMetrics;
}

// Features:
// - Status visualization
// - Blocker identification
// - Team readiness indicators
// - Launch metrics display
```

## Implementation Phases

### Phase 0: Shadcn Migration (2 Weeks)
1. **Setup & Infrastructure (Week 1, Days 1-3)** ✅
   - Install Shadcn UI and dependencies
   - Configure Tailwind CSS
   - Set up theme system
   - Create component migration template

2. **Core Components (Week 1, Days 4-7)** ✅
   - Migrate basic UI components
   - Update layout components
   - Convert form components
   - Implement feedback components

3. **Complex Components (Week 2, Days 1-4)** ✅
   - Dialog System
     - Base Dialog with accessibility
     - Dialog compatibility layer
   - Navigation Components
     - Tabs with compatibility layer
     - Breadcrumbs with compatibility layer
     - Menu (Dropdown Menu) with compatibility layer
     - Drawer (Sheet) with compatibility layer
   - Data Display Components
     - Table System with sorting and pagination
     - Card System with media support
     - Charts with multiple types

4. **Documentation & Migration (Week 2, Days 5-7)** ✅
   - Created component migration guide ✅
   - Updated component exports to use default exports ✅
   - Completed compat layer implementation ✅
   - Ready to begin Phase 1

### Phase 1: Core Infrastructure (2 Weeks)
1. Set up route structure with new components
2. Create base components using Shadcn
3. Implement API handlers
4. Add authentication middleware

### Phase 2: CRM Integration (2 Weeks)
1. Implement sync status components with Shadcn
2. Build field mapping UI with new drag-and-drop
3. Add sync history tracking
4. Create CRM API endpoints

### Phase 3: Phase Templates (2 Weeks)
1. Build template management UI with Shadcn
2. Implement approval workflows
3. Add template selection to POV creation
4. Create phase progression system

### Phase 4: KPI System (2 Weeks)
1. Implement KPI template management
2. Build history visualization with new charts
3. Add KPI tracking components
4. Create dashboard integration

### Phase 5: Launch Process (2 Weeks)
1. Build launch checklist UI with Shadcn
2. Implement status tracking
3. Add validation system
4. Create launch confirmation flow

## Testing Strategy

### Component Testing with Shadcn
```typescript
// Example test structure with Shadcn components
describe('CRMSyncStatus', () => {
  it('displays current sync status', async () => {
    const { getByRole } = render(<CRMSyncStatus />);
    
    // Test Shadcn Alert component
    expect(getByRole('alert')).toHaveClass(
      'inline-flex items-center rounded-lg border px-4 py-3'
    );
    
    // Test Shadcn Button component
    const button = getByRole('button', { name: /sync now/i });
    expect(button).toHaveClass(
      'inline-flex items-center justify-center rounded-md'
    );
    
    // Test interaction
    await userEvent.click(button);
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('shows sync history with proper styling', () => {
    const { container } = render(<CRMSyncHistory />);
    
    // Test Shadcn ScrollArea component
    expect(container.querySelector('.scroll-area')).toBeInTheDocument();
    
    // Test Shadcn Card components
    expect(container.querySelectorAll('.rounded-lg border bg-card')).toHaveLength(5);
  });

  it('handles sync errors with Shadcn components', async () => {
    const { getByRole } = render(<CRMSyncStatus error="Failed to sync" />);
    
    // Test Shadcn Toast component
    expect(getByRole('alert')).toHaveClass(
      'bg-destructive text-destructive-foreground'
    );
  });

  it('allows retry on failure with proper feedback', async () => {
    const { getByRole } = render(<CRMSyncStatus />);
    
    // Test Shadcn Button loading state
    const button = getByRole('button', { name: /retry/i });
    await userEvent.click(button);
    expect(button).toHaveClass('opacity-50 pointer-events-none');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
```

### Integration Testing
```typescript
// Example test structure
describe('POV Creation Flow', () => {
  it('applies selected phase template', () => {});
  it('sets up initial KPIs', () => {});
  it('configures CRM mapping', () => {});
  it('initializes launch checklist', () => {});
});
```

## Performance Considerations

1. Component Lazy Loading
```typescript
// Example implementation
const KPIHistoryChart = dynamic(() => 
  import('@/components/pov/kpi/HistoryChart'), {
    loading: () => <KPIHistoryChartSkeleton />
  }
);
```

2. Data Caching
```typescript
// Example implementation
export function usePOVData(povId: string) {
  return useQuery({
    queryKey: ['pov', povId],
    queryFn: () => fetchPOVData(povId),
    staleTime: 30000,
    cacheTime: 3600000
  });
}
```

## Error Handling

1. Component Error Boundaries
```typescript
// Example implementation
export class POVErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <POVErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

2. API Error Handling
```typescript
// Example implementation
export async function handleAPIError(error: unknown): Promise<APIError> {
  if (error instanceof ValidationError) {
    return {
      type: 'VALIDATION',
      message: 'Validation failed',
      fields: error.details
    };
  }
  
  if (error instanceof NetworkError) {
    return {
      type: 'SERVER_ERROR',
      message: 'Network error occurred',
      code: 'NETWORK_ERROR'
    };
  }

  if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) {
      return {
        type: 'UNAUTHORIZED',
        message: 'Authentication required'
      };
    }

    if (error.message.includes('Not found')) {
      return {
        type: 'NOT_FOUND',
        message: 'Resource not found',
        resourceId: extractResourceId(error.message)
      };
    }
  }

  return {
    type: 'SERVER_ERROR',
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
}

// Type-safe error response
interface APIErrorResponse {
  error: APIError;
  status: number;
}

// Error response helper
export function createErrorResponse(error: APIError): APIErrorResponse {
  const status = getStatusCode(error.type);
  return {
    error,
    status
  };
}

// Usage in API routes
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // ... handle request
  } catch (error) {
    const apiError = await handleAPIError(error);
    return NextResponse.json(
      { error: apiError },
      { status: getStatusCode(apiError.type) }
    );
  }
}
```

## Next Steps

1. Begin with Phase 1 implementation
   - Set up POV creation form ✓
   - Implement team creation ✓
   - Add initial phase setup ✓
   - Configure error handling ✓

2. Create component prototypes
   - POV creation form ✓
   - Team management ✓
   - Phase templates ✓
   - Error boundaries ✓

3. Set up testing infrastructure
   - Unit tests for form validation
   - Integration tests for POV creation
   - Error handling tests
   - API endpoint tests

4. Implement core API handlers
   - POV creation endpoint ✓
   - Team creation endpoint ✓
   - Phase creation endpoint ✓
   - Error handling middleware ✓

5. Begin iterative development through phases 2-5
   - CRM integration
   - Phase template system
   - KPI framework
   - Launch process
