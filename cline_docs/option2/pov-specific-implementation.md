# POV-Specific Implementation

## Overview

This document details the implementation of POV-specific features that extend and customize global templates and configurations. These features handle individual POV instances, their phases, workflows, and KPIs.

## Core Components

### POV Phase Management

#### Phase Instance
```typescript
interface PhaseInstance {
  id: string;
  typeId: string;  // References global PhaseType
  povId: string;
  name: string;
  status: PhaseStatus;
  startDate: Date;
  endDate: Date;
  workflows: WorkflowInstance[];
  customizations?: {
    validationRules?: ValidationRule[];
    requiredRoles?: string[];
  };
  metadata?: Record<string, unknown>;
}
```

#### Workflow Instance
```typescript
interface WorkflowInstance {
  id: string;
  templateId: string;  // References global WorkflowTemplate
  phaseId: string;
  name: string;
  status: WorkflowStatus;
  steps: StepInstance[];
  customizations?: {
    validationRules?: ValidationRule[];
    roleOverrides?: Record<string, string>;
  };
  metadata?: Record<string, unknown>;
}
```

### POV KPI Management

#### KPI Instance
```typescript
interface KPIInstance {
  id: string;
  templateId: string;  // References global KPITemplate
  povId: string;
  phaseId?: string;
  name: string;
  currentValue: number;
  target: {
    value: number;
    threshold?: {
      warning: number;
      critical: number;
    };
  };
  status: KPIStatus;
  customizations?: {
    calculation?: string;
    visualization?: VisualizationType;
  };
  metadata?: Record<string, unknown>;
}
```

## Database Schema

```prisma
model Phase {
  id            String       @id @default(cuid())
  typeId        String      // References PhaseType
  povId         String
  pov           POV         @relation(fields: [povId], references: [id])
  name          String
  status        PhaseStatus @default(PENDING)
  startDate     DateTime
  endDate       DateTime
  customizations Json?
  metadata      Json?
  workflows     Workflow[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Workflow {
  id            String          @id @default(cuid())
  templateId    String         // References GlobalWorkflowTemplate
  phaseId       String
  phase         Phase          @relation(fields: [phaseId], references: [id])
  name          String
  status        WorkflowStatus @default(PENDING)
  customizations Json?
  metadata      Json?
  steps         Step[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model KPI {
  id            String     @id @default(cuid())
  templateId    String    // References GlobalKPITemplate
  povId         String
  pov           POV       @relation(fields: [povId], references: [id])
  phaseId       String?
  phase         Phase?    @relation(fields: [phaseId], references: [id])
  name          String
  currentValue  Float
  target        Json
  status        KPIStatus @default(ON_TRACK)
  customizations Json?
  metadata      Json?
  history       KPIHistory[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## API Routes

### Phase Management
```typescript
// Create phase instance
POST /api/pov/[povId]/phases
Body: {
  typeId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  customizations?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Update phase instance
PUT /api/pov/[povId]/phases/[phaseId]
Body: {
  name?: string;
  status?: PhaseStatus;
  startDate?: Date;
  endDate?: Date;
  customizations?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

### Workflow Management
```typescript
// Create workflow instance
POST /api/pov/[povId]/phases/[phaseId]/workflows
Body: {
  templateId: string;
  name: string;
  customizations?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Update workflow instance
PUT /api/pov/[povId]/phases/[phaseId]/workflows/[workflowId]
Body: {
  name?: string;
  status?: WorkflowStatus;
  customizations?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

### KPI Management
```typescript
// Create KPI instance
POST /api/pov/[povId]/kpis
Body: {
  templateId: string;
  name: string;
  phaseId?: string;
  target: {
    value: number;
    threshold?: {
      warning: number;
      critical: number;
    };
  };
  customizations?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Update KPI value
PUT /api/pov/[povId]/kpis/[kpiId]/value
Body: {
  value: number;
  metadata?: Record<string, unknown>;
}
```

## Service Layer

### PhaseInstanceService
```typescript
class PhaseInstanceService {
  async createPhase(data: CreatePhaseInput): Promise<Phase>
  async updatePhase(id: string, data: UpdatePhaseInput): Promise<Phase>
  async validatePhase(id: string): Promise<ValidationResult>
  async calculateProgress(id: string): Promise<number>
  async getCustomizations(id: string): Promise<PhaseCustomizations>
}
```

### WorkflowInstanceService
```typescript
class WorkflowInstanceService {
  async createWorkflow(data: CreateWorkflowInput): Promise<Workflow>
  async updateWorkflow(id: string, data: UpdateWorkflowInput): Promise<Workflow>
  async validateWorkflow(id: string): Promise<ValidationResult>
  async calculateProgress(id: string): Promise<number>
  async getCustomizations(id: string): Promise<WorkflowCustomizations>
}
```

### KPIInstanceService
```typescript
class KPIInstanceService {
  async createKPI(data: CreateKPIInput): Promise<KPI>
  async updateValue(id: string, value: number, metadata?: unknown): Promise<KPI>
  async calculateStatus(id: string): Promise<KPIStatus>
  async getHistory(id: string, options?: HistoryOptions): Promise<KPIHistory[]>
  async getCustomizations(id: string): Promise<KPICustomizations>
}
```

## UI Components

### Phase Management
- PhaseInstanceList: List of POV phases
- PhaseInstanceCard: Individual phase display
- PhaseCustomizationForm: Phase customization
- PhaseTimeline: Visual timeline
- PhaseProgress: Progress tracking

### Workflow Management
- WorkflowInstanceList: List of phase workflows
- WorkflowInstanceCard: Individual workflow display
- WorkflowCustomizationForm: Workflow customization
- StepList: Workflow steps
- StepProgress: Step tracking

### KPI Management
- KPIInstanceList: List of POV KPIs
- KPIInstanceCard: Individual KPI display
- KPICustomizationForm: KPI customization
- KPIChart: Value visualization
- KPIHistory: Historical data

## Validation System

### Instance Validation
```typescript
interface InstanceValidation {
  id: string;
  instanceType: 'PHASE' | 'WORKFLOW' | 'KPI';
  instanceId: string;
  rules: ValidationRule[];
  customRules?: ValidationRule[];
  metadata?: Record<string, unknown>;
}
```

### Validation Categories
- Template compliance
- Custom rule validation
- Dependency validation
- Progress validation
- Status validation

## Integration Points

### Global System Integration
- Template inheritance
- Validation inheritance
- Configuration override
- Status synchronization

### Launch System Integration
- Instance validation
- Progress tracking
- Status verification
- Resource validation

## Error Handling

### Instance Errors
```typescript
interface InstanceError {
  code: string;
  message: string;
  instanceType: 'PHASE' | 'WORKFLOW' | 'KPI';
  instanceId: string;
  details?: Record<string, unknown>;
}
```

### Error Categories
- Template mismatch
- Validation failure
- Status conflict
- Resource conflict

## Testing Strategy

### Unit Tests
- Instance creation testing
- Customization testing
- Validation testing
- Progress calculation

### Integration Tests
- Template inheritance
- Status synchronization
- Data consistency
- Error propagation

### E2E Tests
- Instance lifecycle
- Customization workflow
- Status transitions
- Data visualization

## Monitoring & Analytics

### Instance Metrics
- Creation frequency
- Customization patterns
- Validation success rate
- Progress tracking

### Performance Metrics
- Instance load time
- Calculation speed
- Update frequency
- Storage usage

## Future Enhancements

### Phase 2 Features
- Advanced customization
- Bulk instance operations
- Template overrides
- Custom calculations

### Phase 3 Features
- Instance versioning
- Change tracking
- Performance optimization
- Advanced analytics
