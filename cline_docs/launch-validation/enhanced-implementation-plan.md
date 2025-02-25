# Enhanced Launch Validation Implementation Plan

This document outlines the plan for enhancing the Launch Validation System, addressing the limitations of the current implementation and adding new features to improve functionality, usability, and integration with other systems.

## Implementation Phases

The enhanced implementation will be delivered in four phases, each building on the previous one:

1. **Phase 1: Enhanced Validation System** (2-3 weeks)
2. **Phase 2: Audit Trail and Status Management** (1-2 weeks)
3. **Phase 3: Interactive Checklist and System Integration** (2-3 weeks)
4. **Phase 4: Advanced Features** (3-4 weeks)

## Phase 1: Enhanced Validation System

### Objectives

- Implement detailed validation for each checklist category
- Create a validation results UI
- Add support for warnings vs. errors
- Implement custom validation rules

### Database Schema Updates

```prisma
// No schema changes required for this phase
```

### Type Definition Updates

```typescript
// lib/pov/types/launch.ts
export type ValidationSeverity = 'ERROR' | 'WARNING';

export interface ValidationError {
  code: string;
  message: string;
  severity: ValidationSeverity;
  category: string;
  details?: Record<string, unknown>;
}

export interface LaunchValidation {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: ValidationSeverity;
  validate: (pov: any) => Promise<boolean>;
  errorMessage: string;
}
```

### Service Layer Updates

#### ValidationService

```typescript
// lib/pov/services/validation.ts
class ValidationService {
  private static instance: ValidationService;
  static getInstance(): ValidationService { /* ... */ }

  // Validation rules registry
  private rules: Record<string, ValidationRule[]> = {
    team: [
      // Team validation rules
    ],
    phase: [
      // Phase validation rules
    ],
    budget: [
      // Budget validation rules
    ],
    resources: [
      // Resource validation rules
    ],
    details: [
      // Detail validation rules
    ]
  };

  // Register a new validation rule
  registerRule(category: string, rule: ValidationRule): void { /* ... */ }

  // Validate a specific category
  async validateCategory(povId: string, category: string): Promise<ValidationResult> { /* ... */ }

  // Validate team configuration
  async validateTeam(povId: string): Promise<ValidationResult> { /* ... */ }

  // Validate phase completion
  async validatePhases(povId: string): Promise<ValidationResult> { /* ... */ }

  // Validate budget approval
  async validateBudget(povId: string): Promise<ValidationResult> { /* ... */ }

  // Validate resource allocation
  async validateResources(povId: string): Promise<ValidationResult> { /* ... */ }

  // Validate POV details
  async validateDetails(povId: string): Promise<ValidationResult> { /* ... */ }
}

export const validationService = ValidationService.getInstance();
```

#### LaunchService Updates

```typescript
// lib/pov/services/launch.ts
class LaunchService {
  // ... existing methods

  // Enhanced validation
  async validateLaunch(povId: string): Promise<LaunchValidation> {
    const teamValidation = await validationService.validateTeam(povId);
    const phaseValidation = await validationService.validatePhases(povId);
    const budgetValidation = await validationService.validateBudget(povId);
    const resourceValidation = await validationService.validateResources(povId);
    const detailValidation = await validationService.validateDetails(povId);

    const errors = [
      ...teamValidation.errors,
      ...phaseValidation.errors,
      ...budgetValidation.errors,
      ...resourceValidation.errors,
      ...detailValidation.errors
    ];

    const warnings = [
      ...teamValidation.warnings,
      ...phaseValidation.warnings,
      ...budgetValidation.warnings,
      ...resourceValidation.warnings,
      ...detailValidation.warnings
    ];

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

### API Route Updates

```typescript
// app/api/pov/[povId]/launch/validate/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Unauthorized');
  }

  const validation = await launchService.validateLaunch(params.povId);
  return Response.json(validation);
}
```

### UI Component Updates

#### ValidationResults Component

```tsx
// components/pov/launch/ValidationResults.tsx
export function ValidationResults({ 
  validation,
  onRetry
}: { 
  validation: LaunchValidation;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      {validation.valid ? (
        <Alert variant="success">
          <AlertTitle>Validation Passed</AlertTitle>
          <AlertDescription>
            All validation checks have passed. You can now proceed with the launch.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Validation Failed</AlertTitle>
          <AlertDescription>
            There are {validation.errors.length} errors that need to be fixed before launch.
          </AlertDescription>
        </Alert>
      )}

      {validation.errors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Errors</h3>
          <ul className="space-y-2">
            {validation.errors.map((error, index) => (
              <li key={index} className="p-3 bg-destructive/10 rounded-md">
                <p className="font-medium">{error.message}</p>
                <p className="text-sm text-muted-foreground">
                  Category: {error.category} | Code: {error.code}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Warnings</h3>
          <ul className="space-y-2">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="p-3 bg-warning/10 rounded-md">
                <p className="font-medium">{warning.message}</p>
                <p className="text-sm text-muted-foreground">
                  Category: {warning.category} | Code: {warning.code}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={onRetry}>
        Retry Validation
      </Button>
    </div>
  );
}
```

#### Launch Validation Page

```tsx
// app/(authenticated)/pov/[povId]/launch/validate/page.tsx
export default function LaunchValidationPage() {
  const params = useParams();
  const povId = params.povId as string;

  const { data: validation, isLoading, error, refetch } = useQuery<LaunchValidation, Error>({
    queryKey: ["launch-validation", povId],
    queryFn: () => fetch(`/api/pov/${povId}/launch/validate`).then(res => res.json()),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load validation results</AlertDescription>
      </Alert>
    );
  }

  return (
    <Container className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Launch Validation</h2>
        <p className="text-muted-foreground">
          Validate the POV before launch
        </p>
      </div>

      {validation && (
        <ValidationResults 
          validation={validation} 
          onRetry={() => refetch()} 
        />
      )}
    </Container>
  );
}
```

## Phase 2: Audit Trail and Status Management

### Objectives

- Implement the `LaunchAudit` model
- Add `FAILED` status and related transitions
- Create audit trail UI
- Implement retry functionality

### Database Schema Updates

```prisma
model LaunchAudit {
  id        String    @id @default(cuid())
  launchId  String
  launch    POVLaunch @relation(fields: [launchId], references: [id])
  action    String    // e.g., "checklist_update", "status_change"
  userId    String
  details   Json
  createdAt DateTime  @default(now())
}
```

### Type Definition Updates

```typescript
// lib/pov/types/launch.ts
export type LaunchStatus = 'NOT_INITIATED' | 'IN_PROGRESS' | 'LAUNCHED' | 'FAILED';

export interface LaunchAuditEntry {
  id: string;
  action: string;
  userId: string;
  userName: string;
  details: any;
  createdAt: Date;
}
```

### Service Layer Updates

#### LaunchService Updates

```typescript
// lib/pov/services/launch.ts
class LaunchService {
  // ... existing methods

  // Create audit entry
  async createAudit(
    launchId: string,
    userId: string,
    action: string,
    details: any
  ): Promise<void> {
    await prisma.launchAudit.create({
      data: {
        launchId,
        userId,
        action,
        details: details as Prisma.InputJsonValue
      }
    });
  }

  // Get audit trail
  async getAuditTrail(launchId: string): Promise<LaunchAuditEntry[]> {
    const audits = await prisma.launchAudit.findMany({
      where: { launchId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    return audits.map(audit => ({
      id: audit.id,
      action: audit.action,
      userId: audit.userId,
      userName: audit.user.name,
      details: audit.details,
      createdAt: audit.createdAt
    }));
  }

  // Mark launch as failed
  async markAsFailed(
    launchId: string,
    userId: string,
    reason: string
  ): Promise<void> {
    await prisma.pOVLaunch.update({
      where: { id: launchId },
      data: {
        status: 'FAILED'
      }
    });

    await this.createAudit(launchId, userId, 'status_change', {
      from: 'IN_PROGRESS',
      to: 'FAILED',
      reason
    });
  }

  // Retry failed launch
  async retryLaunch(
    launchId: string,
    userId: string
  ): Promise<void> {
    await prisma.pOVLaunch.update({
      where: { id: launchId },
      data: {
        status: 'IN_PROGRESS'
      }
    });

    await this.createAudit(launchId, userId, 'status_change', {
      from: 'FAILED',
      to: 'IN_PROGRESS',
      reason: 'Retry'
    });
  }
}
```

### API Route Updates

```typescript
// app/api/pov/[povId]/launch/audit/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Unauthorized');
  }

  const launch = await launchService.getLaunchByPovId(params.povId);
  if (!launch) {
    throw new ApiError('NOT_FOUND', 'Launch not found');
  }

  const audit = await launchService.getAuditTrail(launch.id);
  return Response.json(audit);
}
```

```typescript
// app/api/pov/[povId]/launch/retry/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Unauthorized');
  }

  const launch = await launchService.getLaunchByPovId(params.povId);
  if (!launch) {
    throw new ApiError('NOT_FOUND', 'Launch not found');
  }

  await launchService.retryLaunch(launch.id, user.userId);
  return Response.json({ success: true });
}
```

### UI Component Updates

#### Audit Trail Component

```tsx
// components/pov/launch/AuditTrail.tsx
export function AuditTrail({ 
  auditEntries 
}: { 
  auditEntries: LaunchAuditEntry[] 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Audit Trail</h3>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.action}</TableCell>
                <TableCell>{entry.userName}</TableCell>
                <TableCell>
                  {typeof entry.details === 'object' 
                    ? JSON.stringify(entry.details) 
                    : entry.details}
                </TableCell>
                <TableCell>
                  {new Date(entry.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

#### Launch Audit Page

```tsx
// app/(authenticated)/pov/[povId]/launch/audit/page.tsx
export default function LaunchAuditPage() {
  const params = useParams();
  const povId = params.povId as string;

  const { data: auditEntries, isLoading, error } = useQuery<LaunchAuditEntry[], Error>({
    queryKey: ["launch-audit", povId],
    queryFn: () => fetch(`/api/pov/${povId}/launch/audit`).then(res => res.json()),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load audit trail</AlertDescription>
      </Alert>
    );
  }

  return (
    <Container className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Launch Audit Trail</h2>
        <p className="text-muted-foreground">
          Track changes to the launch process
        </p>
      </div>

      {auditEntries && <AuditTrail auditEntries={auditEntries} />}
    </Container>
  );
}
```

## Phase 3: Interactive Checklist and System Integration

### Objectives

- Make checklist items interactive
- Enhance CRM integration
- Implement POV creation integration
- Create launch confirmation flow

### Service Layer Updates

#### CRM Integration

```typescript
// lib/pov/services/crm.ts
class CRMService {
  // ... existing methods

  // Validate CRM data for launch
  async validateForLaunch(povId: string): Promise<ValidationResult> {
    const pov = await povService.get(povId);
    if (!pov) {
      throw new Error('POV not found');
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check if CRM sync is up to date
    if (!pov.lastCrmSync || isOlderThan(pov.lastCrmSync, 24)) {
      errors.push({
        code: 'CRM_SYNC_OUTDATED',
        message: 'CRM data is outdated. Please sync before launch.',
        severity: 'ERROR',
        category: 'crm'
      });
    }

    // Check if required CRM fields are present
    if (!pov.dealId) {
      errors.push({
        code: 'CRM_DEAL_ID_MISSING',
        message: 'CRM Deal ID is missing.',
        severity: 'ERROR',
        category: 'crm'
      });
    }

    // Check for warnings
    if (pov.crmSyncStatus === 'PARTIAL') {
      warnings.push({
        code: 'CRM_SYNC_PARTIAL',
        message: 'CRM sync was only partially successful.',
        severity: 'WARNING',
        category: 'crm'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Update CRM after launch
  async updateAfterLaunch(povId: string): Promise<void> {
    // Update CRM with launch status
    // This would be replaced with actual CRM API calls
    console.log(`Updating CRM after launch for POV ${povId}`);
  }
}
```

#### POV Creation Integration

```typescript
// lib/pov/handlers/post.ts
export async function createPoVHandler(
  request: NextRequest,
  { params }: { params: { povId?: string } }
) {
  // ... existing code

  // Create POV
  const pov = await povService.create({
    // ... existing code
  });

  // Initialize launch process
  await launchService.initiateLaunch(pov.id);

  // Return the POV data
  return pov;
}
```

### UI Component Updates

#### Interactive Checklist Component

```tsx
// components/pov/launch/ChecklistManager.tsx
export function ChecklistManager({ 
  povId,
  checklist,
  onUpdate
}: { 
  povId: string;
  checklist: LaunchChecklist;
  onUpdate: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);

  const updateItem = async (key: string, completed: boolean) => {
    setUpdating(key);
    try {
      await fetch(`/api/pov/${povId}/launch/checklist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, completed })
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    } finally {
      setUpdating(null);
    }
  };

  // Group items by category
  const groupedItems = groupByCategory(checklist.items);

  return (
    <div className="space-y-6">
      {Object.entries(groupedItems).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <h3 className="text-lg font-semibold">{category}</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.key} className="flex items-start gap-4">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => updateItem(item.key, !!checked)}
                    disabled={updating === item.key}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">{item.label}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

#### Launch Confirmation Component

```tsx
// components/pov/launch/LaunchConfirmation.tsx
export function LaunchConfirmation({ 
  povId,
  onSuccess
}: { 
  povId: string;
  onSuccess: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmLaunch = async () => {
    setConfirming(true);
    setError(null);
    try {
      await fetch(`/api/pov/${povId}/launch/status`, {
        method: 'POST'
      });
      onSuccess();
    } catch (error) {
      setError('Failed to confirm launch. Please try again.');
      console.error('Launch confirmation error:', error);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Launch Confirmation</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          You are about to launch this POV. This action cannot be undone.
          Please make sure all validations have passed before confirming.
        </p>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            onClick={confirmLaunch}
            disabled={confirming}
          >
            {confirming ? 'Confirming...' : 'Confirm Launch'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Phase 4: Advanced Features

### Objectives

- Implement custom checklist templates
- Add automated validations
- Create launch analytics
- Enhance notification system

### Database Schema Updates

```prisma
model LaunchChecklistTemplate {
  id          String    @id @default(cuid())
  name        String
  description String?
  items       Json
  isDefault   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Service Layer Updates

#### Template Management

```typescript
// lib/pov/services/launchTemplate.ts
class LaunchTemplateService {
  private static instance: LaunchTemplateService;
  static getInstance(): LaunchTemplateService { /* ... */ }

  // Get all templates
  async getTemplates(): Promise<LaunchChecklistTemplate[]> { /* ... */ }

  // Get template by ID
  async getTemplate(id: string): Promise<LaunchChecklistTemplate | null> { /* ... */ }

  // Get default template
  async getDefaultTemplate(): Promise<LaunchChecklistTemplate | null> { /* ... */ }

  // Create template
  async createTemplate(data: LaunchChecklistTemplateCreateInput): Promise<LaunchChecklistTemplate> { /* ... */ }

  // Update template
  async updateTemplate(id: string, data: LaunchChecklistTemplateUpdateInput): Promise<LaunchChecklistTemplate> { /* ... */ }

  // Delete template
  async deleteTemplate(id: string): Promise<void> { /* ... */ }

  // Set default template
  async setDefaultTemplate(id: string): Promise<void> { /* ... */ }
}

export const launchTemplateService = LaunchTemplateService.getInstance();
```

#### Analytics Service

```typescript
// lib/pov/services/launchAnalytics.ts
class LaunchAnalyticsService {
  private static instance: LaunchAnalyticsService;
  static getInstance(): LaunchAnalyticsService { /* ... */ }

  // Get launch success rate
  async getLaunchSuccessRate(
    startDate?: Date,
    endDate?: Date
  ): Promise<{ total: number; successful: number; failed: number; rate: number }> { /* ... */ }

  // Get common validation errors
  async getCommonValidationErrors(
    startDate?: Date,
    endDate?: Date
  ): Promise<{ code: string; count: number; percentage: number }[]> { /* ... */ }

  // Get average time to launch
  async getAverageTimeToLaunch(
    startDate?: Date,
    endDate?: Date
  ): Promise<{ averageDays: number }> { /* ... */ }

  // Get launches by user
  async getLaunchesByUser(
    startDate?: Date,
    endDate?: Date
  ): Promise<{ userId: string; userName: string; count: number }[]> { /* ... */ }
}

export const launchAnalyticsService = LaunchAnalyticsService.getInstance();
```

#### Notification Integration

```typescript
// lib/pov/services/launch.ts
class LaunchService {
  // ... existing methods

  // Send launch status notification
  async sendStatusNotification(
    povId: string,
    status: LaunchStatus,
    userId: string
  ): Promise<void> {
    const pov = await povService.get(povId);
    if (!pov) {
      throw new Error('POV not found');
    }

    // Notify POV owner
    await notificationService.create({
      userId: pov.ownerId,
      message: `POV "${pov.title}" launch status changed to ${status}`,
      type: status === 'LAUNCHED' ? 'success' : status === 'FAILED' ? 'error' : 'info',
      actionUrl: `/pov/${povId}/launch/status`
    });

    // Notify team members if team exists
    if (pov.teamId) {
      const teamMembers = await teamService.getTeamMembers(pov.teamId);
      for (const member of teamMembers) {
        if (member.userId !== pov.ownerId) {
          await notificationService.create({
            userId: member.userId,
            message: `POV "${pov.title}" launch status changed to ${status}`,
            type: status === 'LAUNCHED' ? 'success' : status === 'FAILED' ? 'error' : 'info',
            actionUrl: `/pov/${povId}/launch/status`
          });
        }
      }
    }
  }
}
```

### API Route Updates

```typescript
// app/api/pov/launch/analytics/route.ts
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Unauthorized');
  }

  // Check if user has permission to view analytics
  const hasPermission = await checkPermission(
    { id: user.userId, role: user.role as UserRole },
    { id: '', type: ResourceType.Analytics },
    ResourceAction.VIEW
  );

  if (!hasPermission) {
    throw new ApiError('FORBIDDEN', 'Permission denied');
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

  const successRate = await launchAnalyticsService.getLaunchSuccessRate(startDate, endDate);
  const commonErrors = await launchAnalyticsService.getCommonValidationErrors(startDate, endDate);
  const averageTime = await launchAnalyticsService.getAverageTimeToLaunch(startDate, endDate);
  const byUser = await launchAnalyticsService.getLaunchesByUser(startDate, endDate);

  return Response.json({
    successRate,
    commonErrors,
    averageTime,
    byUser
  });
}
```

### UI Component Updates

#### Launch Analytics Dashboard

```tsx
// app/(authenticated)/admin/analytics/launch/page.tsx
export default function LaunchAnalyticsPage() {
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({});

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["launch-analytics", dateRange],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateRange.startDate) {
        params.append('startDate', dateRange.startDate.toISOString());
      }
      if (dateRange.endDate) {
        params.append('endDate', dateRange.endDate.toISOString());
      }
      return fetch(`/api/pov/launch/analytics?${params.toString()}`).then(res => res.json());
    },
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load analytics</AlertDescription>
      </Alert>
    );
  }

  return (
    <Container className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Launch Analytics</h2>
        <p className="text-muted-foreground">
          Insights into launch performance and trends
        </p>
      </div>

      {/* Date range picker */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <DatePicker
              selected={dateRange.startDate}
              onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
              placeholderText="Start Date"
            />
            <span>to</span>
            <DatePicker
              selected={dateRange.endDate}
              onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
              placeholderText="End Date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Analytics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Success Rate */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Success Rate</h3>
          </CardHeader>
          <CardContent>
            {analytics && (
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {(analytics.successRate.rate * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {analytics.successRate.successful} successful out of {analytics.successRate.total} launches
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Time to Launch */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Average Time to Launch</h3>
          </CardHeader>
