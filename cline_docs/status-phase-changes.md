# Changing POV Statuses and Phase Stages

This document outlines the process for modifying POV statuses and phase stages in the system. Since these are enum values in the database schema, changes require careful handling to maintain data integrity.

## 1. POV Status Changes

### Step 1: Create a New Migration

1. First, create a new Prisma migration:
```bash
npx prisma migrate dev --name update_pov_status_enum
```

2. This will create a new migration file in `prisma/migrations/`. Edit it to handle the enum change:
```sql
-- Example: Changing IN_PROGRESS to WORKING_ONIT
ALTER TYPE "POVStatus" RENAME VALUE 'IN_PROGRESS' TO 'WORKING_ONIT';
```

### Step 2: Update Schema

1. Update the POVStatus enum in `prisma/schema.prisma`:
```prisma
enum POVStatus {
  PROJECTED
  WORKING_ONIT  // Changed from IN_PROGRESS
  STALLED
  VALIDATION
  WON
  LOST
}
```

### Step 3: Update Code References

1. Update status transition service (`lib/pov/services/status.ts`):
```typescript
static transitions: StatusTransition[] = [
  {
    from: 'PROJECTED',
    to: 'WORKING_ONIT', // Updated from IN_PROGRESS
    conditions: [
      {
        type: 'PHASE',
        check: async (pov) => pov.phases.length > 0,
        errorMessage: 'POV must have at least one phase'
      }
    ],
    notifications: [
      {
        roles: ['OWNER', 'ADMIN'],
        template: 'POV_STATUS_CHANGE'
      }
    ]
  },
  // ... other transitions
];
```

2. Update any UI components that reference the status:
```typescript
// app/(authenticated)/pov/[povId]/status.tsx
const statusLabels = {
  PROJECTED: 'Projected',
  WORKING_ONIT: 'Working On It', // Updated from IN_PROGRESS
  STALLED: 'Stalled',
  // ...
};
```

3. Update test files that reference the status:
```typescript
// prisma/__tests__/schema.test.ts
test('POV status transitions', async () => {
  const pov = await createTestPOV({
    status: POVStatus.PROJECTED
  });
  
  await povService.updateStatus(pov.id, POVStatus.WORKING_ONIT); // Updated
  // ...
});
```

### Step 4: Data Migration Script

Create a script to handle any data transformations if needed:

```typescript
// scripts/migrations/update-pov-statuses.ts
import { prisma } from '@/lib/prisma';

async function migratePOVStatuses() {
  // This is only needed if you need to transform data beyond
  // the simple enum value rename in the migration
  const povs = await prisma.pOV.findMany({
    where: {
      // Add any specific conditions
    }
  });

  for (const pov of povs) {
    await prisma.pOV.update({
      where: { id: pov.id },
      data: {
        // Add any additional data transformations
      }
    });
  }
}
```

## 2. Phase Stage Changes

### Step 1: Create a New Migration

1. Generate a new Prisma migration:
```bash
npx prisma migrate dev --name update_phase_status_enum
```

2. Edit the migration file:
```sql
-- Example: Changing PROJECTED to BEGINNING
ALTER TYPE "PhaseStatus" RENAME VALUE 'PROJECTED' TO 'BEGINNING';
```

### Step 2: Update Schema

1. Update the PhaseStatus enum in `prisma/schema.prisma`:
```prisma
enum PhaseStatus {
  BEGINNING     // Changed from PROJECTED
  IN_PROGRESS
  COMPLETED
  BLOCKED
}
```

### Step 3: Update Code References

1. Update phase service (`lib/pov/services/phase.ts`):
```typescript
export class PhaseService {
  async initializePhase(povId: string): Promise<Phase> {
    return await prisma.phase.create({
      data: {
        povId,
        status: PhaseStatus.BEGINNING, // Updated from PROJECTED
        // ...
      }
    });
  }
}
```

2. Update UI components:
```typescript
// components/pov/PhaseStatus.tsx
const phaseStatusLabels = {
  BEGINNING: 'Beginning Phase', // Updated from PROJECTED
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  BLOCKED: 'Blocked'
};
```

## 3. Testing Changes

1. Create test cases for new status values:
```typescript
// prisma/__tests__/schema.test.ts
describe('POV Status Tests', () => {
  test('POV can transition to WORKING_ONIT', async () => {
    const pov = await createTestPOV();
    const result = await povService.updateStatus(
      pov.id, 
      POVStatus.WORKING_ONIT
    );
    expect(result.status).toBe(POVStatus.WORKING_ONIT);
  });
});
```

2. Test status transitions:
```typescript
test('Status transition validation', async () => {
  const validation = await statusService.validateTransition(
    pov,
    POVStatus.WORKING_ONIT
  );
  expect(validation.valid).toBe(true);
});
```

## 4. Deployment Process

1. Backup database before applying changes:
```bash
pg_dump -h localhost -U postgres -d copov2 > backups/pre_status_change_backup.sql
```

2. Apply migrations in order:
```bash
npx prisma migrate deploy
```

3. Run any data migration scripts:
```bash
npx ts-node scripts/migrations/update-pov-statuses.ts
```

4. Verify changes:
```bash
# Check database values
npx prisma studio

# Run tests
npm run test
```

## Important Considerations

1. **Database Impact**
   - Enum changes require database migrations
   - Consider impact on existing records
   - Plan for rollback scenarios

2. **Code Dependencies**
   - Update all references to the changed status values
   - Check both backend and frontend code
   - Update tests and fixtures

3. **Business Logic**
   - Review and update status transition rules
   - Update any status-based workflows
   - Review notification templates

4. **UI/UX**
   - Update status labels and translations
   - Review status-based styling
   - Update documentation and help text

5. **Testing**
   - Test all status transitions
   - Verify UI displays
   - Test API endpoints
   - Verify reporting functionality

## Best Practices

1. **Planning**
   - Document all places where status is used
   - Create comprehensive test cases
   - Plan deployment during low-traffic periods

2. **Implementation**
   - Use type-safe enums throughout the codebase
   - Maintain backward compatibility where possible
   - Update documentation

3. **Validation**
   - Test in staging environment first
   - Verify all status-dependent features
   - Check reporting and analytics

4. **Rollback Plan**
   - Keep database backups
   - Maintain old code version
   - Document rollback procedures

## Automated Status Changes

We provide an automation script that handles all the steps described in this document. The script is located at `scripts/update-status-enums.ts` and can be used to safely update status enums:

```typescript
// Example usage of the automation script
const changes = [
  {
    oldValue: 'IN_PROGRESS',
    newValue: 'WORKING_ONIT',
    type: 'POVStatus'
  },
  {
    oldValue: 'PROJECTED',
    newValue: 'BEGINNING',
    type: 'PhaseStatus'
  }
];

// Run the script
npx ts-node scripts/update-status-enums.ts
```

The script will:
1. Create a database backup
2. Generate and apply the necessary migrations
3. Update schema.prisma
4. Update code references
5. Run tests to verify changes
6. Provide clear next steps and rollback instructions

## Manual Status Update Example

```typescript
// Type-safe status update
interface StatusTransitionRequest {
  povId: string;
  newStatus: POVStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
}

interface StatusTransitionResult {
  success: boolean;
  pov: POV;
  transition: {
    from: POVStatus;
    to: POVStatus;
    timestamp: string;
    reason?: string;
  };
  notifications: Array<{
    userId: string;
    type: NotificationType;
    message: string;
  }>;
}

// Example of manually updating a POV status with type safety
async function updatePOVStatus(
  request: StatusTransitionRequest,
  user: User
): Promise<StatusTransitionResult> {
  try {
    // Start transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // Get POV with proper includes
      const pov = await tx.pOV.findUnique({
        where: { id: request.povId },
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: true
                }
              }
            }
          },
          phases: true
        }
      });

      if (!pov) {
        throw new Error(`POV not found: ${request.povId}`);
      }

      // Validate transition with type safety
      const validation = await statusService.validateTransition(
        pov,
        request.newStatus,
        {
          user,
          reason: request.reason,
          metadata: request.metadata
        }
      );

      if (!validation.valid) {
        throw new Error(
          `Invalid transition: ${validation.errors.join(', ')}`
        );
      }

      // Update status with proper type checking
      const updated = await tx.pOV.update({
        where: { id: pov.id },
        data: {
          status: request.newStatus,
          statusHistory: {
            create: {
              fromStatus: pov.status,
              toStatus: request.newStatus,
              reason: request.reason,
              userId: user.id,
              metadata: request.metadata
            }
          }
        },
        include: {
          team: true,
          phases: true
        }
      });

      // Create notifications with proper typing
      const notifications = await Promise.all(
        pov.team?.members.map(async (member) => {
          const notification = await tx.notification.create({
            data: {
              type: NotificationType.INFO,
              category: NotificationCategory.POV,
              title: 'POV Status Changed',
              message: `POV ${pov.title} status changed from ${pov.status} to ${request.newStatus}`,
              userId: member.user.id,
              actionUrl: `/pov/${pov.id}`,
              metadata: {
                povId: pov.id,
                fromStatus: pov.status,
                toStatus: request.newStatus,
                reason: request.reason,
                changedBy: user.id
              }
            }
          });
          return notification;
        }) ?? []
      );

      // Log activity with proper error handling
      await tx.activity.create({
        data: {
          type: 'STATUS_CHANGE',
          povId: pov.id,
          userId: user.id,
          details: {
            from: pov.status,
            to: request.newStatus,
            reason: request.reason,
            metadata: request.metadata
          }
        }
      });

      return {
        success: true,
        pov: updated,
        transition: {
          from: pov.status,
          to: request.newStatus,
          timestamp: new Date().toISOString(),
          reason: request.reason
        },
        notifications: notifications.map(n => ({
          userId: n.userId,
          type: n.type,
          message: n.message
        }))
      };
    });
  } catch (error) {
    console.error('[Status Update Error]:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to update status: ${error.message}`
        : 'Failed to update status'
    );
  }
}

// Example usage with type safety
try {
  const result = await updatePOVStatus({
    povId: 'pov_123',
    newStatus: POVStatus.WORKING_ONIT,
    reason: 'Project kickoff completed',
    metadata: {
      kickoffDate: new Date().toISOString(),
      approvedBy: 'user_456'
    }
  }, currentUser);

  console.log('Status updated successfully:', {
    povId: result.pov.id,
    newStatus: result.transition.to,
    notificationsSent: result.notifications.length
  });
} catch (error) {
  console.error('Failed to update status:', error);
}
```
