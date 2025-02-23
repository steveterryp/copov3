# Integration Layer Implementation

## Overview

This document details the integration layer that connects global administrative features with POV-specific implementations. It handles template instantiation, validation inheritance, status synchronization, and data flow between the two layers.

## Core Components

### Template Instantiation

#### Instance Factory
```typescript
interface InstanceFactory<T, U> {
  createInstance(template: T, customizations?: Record<string, unknown>): U;
  validateCustomizations(template: T, customizations: Record<string, unknown>): ValidationResult;
  mergeCustomizations(template: T, instance: U): U;
}
```

#### Instance Types
```typescript
interface InstanceMapping {
  PhaseType: PhaseInstance;
  WorkflowTemplate: WorkflowInstance;
  GlobalKPITemplate: KPIInstance;
}
```

### Validation Bridge

#### Validation Inheritance
```typescript
interface ValidationInheritance {
  id: string;
  sourceType: 'GLOBAL' | 'INSTANCE';
  sourceId: string;
  targetType: 'GLOBAL' | 'INSTANCE';
  targetId: string;
  rules: ValidationRule[];
  overrides?: ValidationRule[];
  metadata?: Record<string, unknown>;
}
```

#### Rule Propagation
```typescript
interface RulePropagation {
  id: string;
  rule: ValidationRule;
  targets: Array<{
    type: 'PHASE' | 'WORKFLOW' | 'KPI';
    id: string;
  }>;
  status: 'ACTIVE' | 'OVERRIDDEN' | 'DISABLED';
  metadata?: Record<string, unknown>;
}
```

## Database Schema

```prisma
model TemplateInstance {
  id            String   @id @default(cuid())
  templateId    String
  templateType  String   // e.g., "PhaseType", "WorkflowTemplate"
  instanceId    String
  instanceType  String   // e.g., "Phase", "Workflow"
  customizations Json?
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ValidationInheritance {
  id          String   @id @default(cuid())
  sourceType  String
  sourceId    String
  targetType  String
  targetId    String
  rules       Json
  overrides   Json?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model StatusSync {
  id          String   @id @default(cuid())
  sourceType  String
  sourceId    String
  targetType  String
  targetId    String
  mapping     Json     // Status mapping rules
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Service Layer

### TemplateInstantiationService
```typescript
class TemplateInstantiationService {
  async createPhaseInstance(
    template: PhaseType,
    customizations?: PhaseCustomizations
  ): Promise<Phase>

  async createWorkflowInstance(
    template: WorkflowTemplate,
    customizations?: WorkflowCustomizations
  ): Promise<Workflow>

  async createKPIInstance(
    template: GlobalKPITemplate,
    customizations?: KPICustomizations
  ): Promise<KPI>

  async validateCustomizations<T extends keyof InstanceMapping>(
    templateType: T,
    template: T,
    customizations: Record<string, unknown>
  ): Promise<ValidationResult>
}
```

### ValidationBridgeService
```typescript
class ValidationBridgeService {
  async inheritValidation(
    source: ValidationSource,
    target: ValidationTarget
  ): Promise<ValidationInheritance>

  async overrideRules(
    inheritanceId: string,
    overrides: ValidationRule[]
  ): Promise<ValidationInheritance>

  async propagateRules(
    rules: ValidationRule[],
    targets: ValidationTarget[]
  ): Promise<RulePropagation[]>
}
```

### StatusSyncService
```typescript
class StatusSyncService {
  async createStatusSync(
    source: StatusSource,
    target: StatusTarget,
    mapping: StatusMapping
  ): Promise<StatusSync>

  async updateStatus(
    sourceType: string,
    sourceId: string,
    status: string
  ): Promise<void>

  async validateStatusTransition(
    source: StatusSource,
    target: StatusTarget,
    newStatus: string
  ): Promise<ValidationResult>
}
```

## Integration Points

### Template to Instance
```typescript
interface TemplateToInstance {
  // Phase type to phase instance
  createPhaseFromType(
    typeId: string,
    povId: string,
    customizations?: PhaseCustomizations
  ): Promise<Phase>

  // Workflow template to workflow instance
  createWorkflowFromTemplate(
    templateId: string,
    phaseId: string,
    customizations?: WorkflowCustomizations
  ): Promise<Workflow>

  // KPI template to KPI instance
  createKPIFromTemplate(
    templateId: string,
    povId: string,
    customizations?: KPICustomizations
  ): Promise<KPI>
}
```

### Validation Flow
```typescript
interface ValidationFlow {
  // Inherit global rules
  inheritGlobalRules(
    targetType: string,
    targetId: string
  ): Promise<ValidationRule[]>

  // Apply instance-specific rules
  applyInstanceRules(
    targetType: string,
    targetId: string,
    rules: ValidationRule[]
  ): Promise<ValidationResult>

  // Validate against global rules
  validateAgainstGlobal(
    instanceType: string,
    instanceId: string
  ): Promise<ValidationResult>
}
```

### Status Synchronization
```typescript
interface StatusSync {
  // Sync status changes
  syncStatus(
    sourceType: string,
    sourceId: string,
    status: string
  ): Promise<void>

  // Get sync status
  getSyncStatus(
    targetType: string,
    targetId: string
  ): Promise<StatusSyncResult>

  // Validate sync rules
  validateSync(
    sourceType: string,
    sourceId: string,
    targetType: string,
    targetId: string
  ): Promise<ValidationResult>
}
```

## Error Handling

### Integration Errors
```typescript
interface IntegrationError {
  code: string;
  message: string;
  source: {
    type: string;
    id: string;
  };
  target: {
    type: string;
    id: string;
  };
  details?: Record<string, unknown>;
}
```

### Error Categories
- Template instantiation errors
- Validation inheritance errors
- Status sync errors
- Customization conflicts

## Testing Strategy

### Unit Tests
- Template instantiation
- Validation inheritance
- Status synchronization
- Error handling

### Integration Tests
- Cross-layer communication
- Data consistency
- Status propagation
- Rule inheritance

### E2E Tests
- Full template lifecycle
- Validation flow
- Status sync flow
- Error scenarios

## Monitoring & Analytics

### Performance Metrics
- Instantiation time
- Validation latency
- Sync delay
- Error frequency

### Business Metrics
- Template usage
- Customization patterns
- Validation success
- Sync patterns

## Future Enhancements

### Phase 2 Features
- Advanced template inheritance
- Custom validation bridges
- Flexible status mapping
- Batch operations

### Phase 3 Features
- Real-time synchronization
- Conflict resolution
- Performance optimization
- Advanced monitoring
