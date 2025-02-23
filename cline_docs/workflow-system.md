# Workflow System Documentation

## Overview

The workflow system manages approval processes and step-based workflows within the POV system. It supports different types of workflows (POV approval, phase approval, etc.) with configurable steps and role-based approvals.

## Core Components

### 1. Models

```prisma
enum WorkflowType {
  POV_APPROVAL
  PHASE_APPROVAL
  TASK_APPROVAL
  CUSTOM
}

enum WorkflowStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  REJECTED
  CANCELLED
}

enum WorkflowStepStatus {
  PENDING
  IN_PROGRESS
  APPROVED
  REJECTED
  SKIPPED
}

model Workflow {
  id        String         @id @default(cuid())
  type      WorkflowType
  status    WorkflowStatus @default(PENDING)
  povId     String
  pov       POV            @relation(fields: [povId], references: [id], onDelete: Cascade)
  steps     WorkflowStep[]
  metadata  Json?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}

model WorkflowStep {
  id         String            @id @default(cuid())
  name       String
  order      Int
  status     WorkflowStepStatus @default(PENDING)
  role       String
  workflowId String
  workflow   Workflow          @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  metadata   Json?
  comment    String?
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
}
```

### 2. Service Layer

The workflow system uses a singleton service pattern with proper error handling and type safety:

```typescript
class WorkflowService {
  private static instance: WorkflowService;

  static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  // Type-safe error handling
  private handleError(error: unknown): never {
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Workflow not found');
      }
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (error instanceof Error) {
      throw new Error(`Workflow error: ${error.message}`);
    }
    
    throw new Error('Unknown workflow error');
  }

  // Type-safe workflow validation
  private async validateWorkflow(
    workflow: Workflow & { steps: WorkflowStep[] }
  ): Promise<ValidationResult> {
    try {
      const errors: string[] = [];

      // Validate step order
      const steps = workflow.steps.sort((a, b) => a.order - b.order);
      const hasGaps = steps.some((step, index) => 
        step.order !== index + 1
      );
      if (hasGaps) {
        errors.push('Invalid step order sequence');
      }

      // Validate step dependencies
      for (const step of steps) {
        if (step.status === 'APPROVED' && 
            steps.some(s => 
              s.order < step.order && 
              s.status !== 'APPROVED' && 
              s.status !== 'SKIPPED'
            )) {
          errors.push(`Step ${step.order} approved before previous steps`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Type-safe workflow initialization
  async initialize(povId: string, data: WorkflowInitData) {
    try {
      return await prisma.workflow.create({
        data: {
          povId,
          type: data.type,
          status: WorkflowStatus.PENDING,
          metadata: data.metadata
        },
        include: { 
          steps: true,
          pov: {
            include: {
              team: {
                include: {
                  members: {
                    include: {
                      user: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Type-safe step management
  async addStep(workflowId: string, data: WorkflowStepData) {
    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { steps: true }
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Validate step order
      const existingOrders = workflow.steps.map(s => s.order);
      if (existingOrders.includes(data.order)) {
        throw new Error(`Step with order ${data.order} already exists`);
      }

      return await prisma.workflowStep.create({
        data: {
          workflowId,
          name: data.name,
          order: data.order,
          role: data.role,
          status: WorkflowStepStatus.PENDING,
          metadata: data.metadata
        }
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  // Type-safe status updates with validation
  async updateStepStatus(stepId: string, update: StepStatusUpdate) {
    try {
      const step = await prisma.workflowStep.update({
        where: { id: stepId },
        data: {
          status: update.status,
          comment: update.comment,
          metadata: update.metadata
        },
        include: {
          workflow: {
            include: { 
              steps: true,
              pov: {
                include: {
                  team: {
                    include: {
                      members: {
                        include: {
                          user: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Validate workflow after update
      if (step.workflow) {
        const validation = await this.validateWorkflow(step.workflow);
        if (!validation.valid) {
          throw new Error(`Invalid workflow state: ${validation.errors.join(', ')}`);
        }

        // Auto-update workflow status
        const newStatus = this.determineWorkflowStatus(step.workflow.steps);
        if (newStatus !== step.workflow.status) {
          await this.updateStatus(step.workflow.id, { status: newStatus });
        }
      }

      return step;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const workflowService = WorkflowService.getInstance();
```

Key operations:

1. **Workflow Initialization**
```typescript
// Initialize workflow with type safety
const workflow = await workflowService.initialize(povId, {
  type: WorkflowType.POV_APPROVAL,
  metadata: {
    requiredApprovers: ['MANAGER', 'DIRECTOR'],
    validationRules: {
      requireAllApprovers: true,
      allowSkipSteps: false
    }
  }
});
```

2. **Step Management**
```typescript
// Add step with validation
const step = await workflowService.addStep(workflowId, {
  name: 'Manager Approval',
  order: nextOrder,
  role: TeamRole.MANAGER,
  metadata: {
    requiredDocuments: ['proposal', 'budget'],
    notifyOnComplete: true
  }
});
```

3. **Status Updates**
```typescript
// Update status with validation
const updatedStep = await workflowService.updateStepStatus(stepId, {
  status: WorkflowStepStatus.APPROVED,
  comment: 'Approved after review',
  metadata: {
    reviewedDocuments: ['proposal', 'budget'],
    approvalDate: new Date().toISOString()
  }
});
```

## Usage Examples

### 1. Creating a POV Approval Workflow

```typescript
// Initialize workflow with proper error handling
try {
  const workflow = await workflowService.initialize(povId, {
    type: WorkflowType.POV_APPROVAL,
    metadata: {
      requiredApprovers: ['MANAGER', 'DIRECTOR'],
      validationRules: {
        requireAllApprovers: true,
        allowSkipSteps: false
      }
    }
  });

  // Add approval steps with validation
  await workflowService.addStep(workflow.id, {
    name: 'Manager Approval',
    order: 1,
    role: TeamRole.MANAGER,
    metadata: {
      requiredDocuments: ['proposal']
    }
  });

  await workflowService.addStep(workflow.id, {
    name: 'Director Approval',
    order: 2,
    role: TeamRole.DIRECTOR,
    metadata: {
      requiredDocuments: ['proposal', 'budget']
    }
  });
} catch (error) {
  console.error('[Workflow Creation Error]:', error);
  throw error;
}
```

### 2. Phase Validation

```typescript
// Validate phase progress with proper error handling
try {
  const validation = await workflowService.validatePhaseProgress(phaseId);
  if (!validation.valid) {
    console.error('[Phase Validation Failed]:', validation.errors);
    throw new Error(validation.errors.join(', '));
  }
} catch (error) {
  console.error('[Phase Validation Error]:', error);
  throw error;
}
```

## Integration Points

1. **POV Model**
- Type-safe workflows relation in POV model
- Automatic status updates with validation
- Phase validation integration with error handling

2. **Launch Process**
- Phase approval verification with proper validation
- Type-safe workflow status checks
- Role-based approvals with permission validation

## Testing

The workflow system includes comprehensive tests in `scripts/test-workflow.ts`:

1. Basic Operations
```typescript
describe('Workflow Operations', () => {
  it('should initialize workflow with validation', async () => {
    const workflow = await workflowService.initialize(povId, {
      type: WorkflowType.POV_APPROVAL,
      metadata: { /* workflow data */ }
    });
    expect(workflow).toBeDefined();
    expect(workflow.status).toBe(WorkflowStatus.PENDING);
  });

  it('should handle step creation with order validation', async () => {
    const step = await workflowService.addStep(workflow.id, {
      name: 'Manager Approval',
      order: 1,
      role: TeamRole.MANAGER
    });
    expect(step.order).toBe(1);
    expect(step.status).toBe(WorkflowStepStatus.PENDING);
  });
});
```

2. Status Updates
```typescript
describe('Status Updates', () => {
  it('should update status with validation', async () => {
    const updatedStep = await workflowService.updateStepStatus(step.id, {
      status: WorkflowStepStatus.APPROVED,
      comment: 'Approved after review',
      metadata: {
        reviewDate: new Date().toISOString()
      }
    });
    expect(updatedStep.status).toBe(WorkflowStepStatus.APPROVED);
    expect(updatedStep.comment).toBeDefined();
  });

  it('should prevent invalid status transitions', async () => {
    await expect(
      workflowService.updateStepStatus(step2.id, {
        status: WorkflowStepStatus.APPROVED
      })
    ).rejects.toThrow('Previous steps must be approved first');
  });
});
```

## Error Handling

1. **Validation Errors**
```typescript
// Type-safe validation error handling
interface ValidationError {
  code: 'INVALID_WORKFLOW' | 'INVALID_STEP' | 'INVALID_TRANSITION';
  message: string;
  details?: Record<string, unknown>;
}

function handleValidationError(error: ValidationError): never {
  console.error(`[Workflow Validation Error] ${error.code}:`, error.message);
  throw new Error(`Validation failed: ${error.message}`);
}
```

2. **Status Transitions**
```typescript
// Type-safe status transition validation
function validateStatusTransition(
  currentStatus: WorkflowStepStatus,
  newStatus: WorkflowStepStatus,
  step: WorkflowStep & { workflow: Workflow & { steps: WorkflowStep[] } }
): boolean {
  // Prevent approval of later steps before earlier ones
  if (newStatus === WorkflowStepStatus.APPROVED) {
    const previousSteps = step.workflow.steps.filter(s => 
      s.order < step.order
    );
    
    const allPreviousApproved = previousSteps.every(s => 
      s.status === WorkflowStepStatus.APPROVED || 
      s.status === WorkflowStepStatus.SKIPPED
    );
    
    if (!allPreviousApproved) {
      return false;
    }
  }

  return true;
}
```

## Best Practices

1. **Workflow Creation**
- Always specify required approvers in metadata
- Set proper step order with validation
- Include clear step names and descriptions
- Use type-safe metadata structures

2. **Status Updates**
- Add meaningful comments with context
- Verify role permissions before updates
- Handle concurrent updates with optimistic locking
- Validate status transitions
- Log status changes for audit

3. **Phase Validation**
- Check workflow completion with proper validation
- Verify all required steps are completed
- Handle missing workflows gracefully
- Log validation failures
- Provide clear error messages

## Migration Notes

1. **Schema Changes**
- Added Workflow and WorkflowStep models with proper relations
- Created necessary indexes for performance
- Added metadata support with JSON validation
- Added cascade deletes for cleanup

2. **Data Migration**
- No data migration needed (new feature)
- Backup created at prisma/schema.prisma.workflow_backup
- Added validation for existing data

## Future Considerations

1. **Enhancements**
- Support for custom workflow types with validation
- Advanced validation rules with type safety
- Workflow templates with inheritance
- Dynamic step generation based on rules

2. **Performance**
- Caching for workflow status with invalidation
- Batch status updates with validation
- Optimized queries with proper indexes
- Connection pooling for concurrent operations

3. **Integration**
- Type-safe notification system integration
- Comprehensive audit logging
- Analytics tracking with aggregation
- Real-time updates via WebSocket
