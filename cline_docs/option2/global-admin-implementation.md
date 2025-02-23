# Global Admin Implementation

## Overview

This document details the implementation of global administrative features that manage system-wide configurations, templates, and settings. These features are accessible through the Admin dashboard and provide the foundation for POV-specific implementations.

## Core Components

### Phase Type Management

#### Global Phase Configuration
```typescript
interface PhaseTypeConfig {
  id: string;
  name: string;
  description?: string;
  defaultDuration: number;  // in days
  requiredRoles: string[];
  defaultWorkflows: WorkflowTemplate[];
  validationRules: ValidationRule[];
  metadata?: Record<string, unknown>;
}
```

#### Workflow Templates
```typescript
interface WorkflowTemplate {
  id: string;
  name: string;
  steps: Array<{
    name: string;
    order: number;
    role: string;
    isRequired: boolean;
    validationRules: ValidationRule[];
  }>;
  metadata?: Record<string, unknown>;
}
```

### KPI Template Management

#### Global KPI Templates
```typescript
interface GlobalKPITemplate {
  id: string;
  name: string;
  description?: string;
  type: KPIType;
  calculation: string;
  defaultVisualization: VisualizationType;
  applicablePhases: string[];  // Phase type IDs
  metadata?: Record<string, unknown>;
}
```

#### Calculation Templates
```typescript
interface CalculationTemplate {
  id: string;
  name: string;
  formula: string;
  variables: Array<{
    name: string;
    type: 'number' | 'boolean' | 'string';
    description: string;
  }>;
  metadata?: Record<string, unknown>;
}
```

## Database Schema

```prisma
model PhaseType {
  id              String    @id @default(cuid())
  name            String
  description     String?
  defaultDuration Int
  requiredRoles   String[]
  validationRules Json
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  phases          Phase[]
}

model GlobalKPITemplate {
  id                   String   @id @default(cuid())
  name                 String
  description          String?
  type                 KPIType
  calculation          String
  defaultVisualization Json
  applicablePhases     String[]
  metadata             Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  kpis                KPI[]
}

model GlobalWorkflowTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  steps       Json
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  workflows   Workflow[]
}
```

## API Routes

### Phase Type Management
```typescript
// Create phase type
POST /api/admin/phase-types
Body: PhaseTypeConfig

// Update phase type
PUT /api/admin/phase-types/[id]
Body: Partial<PhaseTypeConfig>

// List phase types
GET /api/admin/phase-types
Query: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Delete phase type
DELETE /api/admin/phase-types/[id]
```

### KPI Template Management
```typescript
// Create KPI template
POST /api/admin/kpi-templates
Body: GlobalKPITemplate

// Update KPI template
PUT /api/admin/kpi-templates/[id]
Body: Partial<GlobalKPITemplate>

// List KPI templates
GET /api/admin/kpi-templates
Query: {
  search?: string;
  type?: KPIType;
  page?: number;
  limit?: number;
}
```

### Workflow Template Management
```typescript
// Create workflow template
POST /api/admin/workflow-templates
Body: WorkflowTemplate

// Update workflow template
PUT /api/admin/workflow-templates/[id]
Body: Partial<WorkflowTemplate>

// List workflow templates
GET /api/admin/workflow-templates
Query: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}
```

## Service Layer

### PhaseTypeService
```typescript
class PhaseTypeService {
  async createPhaseType(data: CreatePhaseTypeInput): Promise<PhaseType>
  async updatePhaseType(id: string, data: UpdatePhaseTypeInput): Promise<PhaseType>
  async deletePhaseType(id: string): Promise<void>
  async listPhaseTypes(filter: PhaseTypeFilter): Promise<PaginatedResult<PhaseType>>
  async validatePhaseType(id: string): Promise<ValidationResult>
}
```

### GlobalKPIService
```typescript
class GlobalKPIService {
  async createTemplate(data: CreateKPITemplateInput): Promise<GlobalKPITemplate>
  async updateTemplate(id: string, data: UpdateKPITemplateInput): Promise<GlobalKPITemplate>
  async validateCalculation(calculation: string): Promise<ValidationResult>
  async listTemplates(filter: TemplateFilter): Promise<PaginatedResult<GlobalKPITemplate>>
}
```

### GlobalWorkflowService
```typescript
class GlobalWorkflowService {
  async createTemplate(data: CreateWorkflowTemplateInput): Promise<GlobalWorkflowTemplate>
  async updateTemplate(id: string, data: UpdateWorkflowTemplateInput): Promise<GlobalWorkflowTemplate>
  async validateTemplate(id: string): Promise<ValidationResult>
  async listTemplates(filter: TemplateFilter): Promise<PaginatedResult<GlobalWorkflowTemplate>>
}
```

## UI Components

### Admin Dashboard
- PhaseTypeManager: Manage phase types and configurations
- KPITemplateManager: Manage KPI templates
- WorkflowTemplateManager: Manage workflow templates
- ValidationRuleBuilder: Build and test validation rules
- CalculationEditor: Create and test calculations

### Common Components
- TemplateList: Generic template listing component
- TemplateForm: Generic template creation/editing form
- ValidationBuilder: Validation rule builder
- MetadataEditor: JSON metadata editor
- StatusIndicator: Template status display

## Validation System

### Validation Rules
```typescript
interface ValidationRule {
  id: string;
  name: string;
  condition: string;  // JavaScript expression
  errorMessage: string;
  severity: 'ERROR' | 'WARNING';
  metadata?: Record<string, unknown>;
}
```

### Rule Categories
- Required fields
- Data type validation
- Dependency validation
- Permission validation
- Custom rules

## Integration Points

### POV System Integration
- Template instantiation
- Validation inheritance
- Configuration override
- Status synchronization

### Launch System Integration
- Template validation
- Configuration verification
- Status checks
- Resource validation

## Error Handling

### Error Types
```typescript
interface AdminError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  severity: 'ERROR' | 'WARNING' | 'INFO';
}
```

### Error Categories
- Validation errors
- Permission errors
- Configuration errors
- System errors

## Testing Strategy

### Unit Tests
- Service method testing
- Validation rule testing
- Template management testing
- Error handling testing

### Integration Tests
- API endpoint testing
- Database interaction testing
- Service integration testing
- UI component testing

### E2E Tests
- Admin workflow testing
- Template management testing
- Configuration testing
- Permission testing

## Monitoring & Analytics

### System Metrics
- Template usage statistics
- Validation success rates
- API performance metrics
- Error frequency

### Business Metrics
- Template adoption rates
- Configuration patterns
- Common validation failures
- Usage patterns

## Future Enhancements

### Phase 2 Features
- Advanced template management
- Custom validation rules
- Bulk operations
- Import/export capabilities

### Phase 3 Features
- Template versioning
- Change tracking
- Advanced analytics
- AI-assisted configuration
