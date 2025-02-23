# Role-Based Access Control (RBAC) Implementation

[← Back to Documentation Index](./README.md)

## Overview
The RBAC (Role-Based Access Control) system integrates with our [Authentication & Token Architecture](./auth-token-architecture.md) to provide granular permission control across the application, with support for:
- Resource-level permissions
- Team-based access
- Role inheritance
- Permission caching
- Activity tracking

## Type-Safe Resource System

### Resource Types
```typescript
// Type-safe resource types
enum ResourceType {
  // Core resources
  POV = 'pov',
  PHASE = 'phase',
  TASK = 'task',
  USER = 'user',
  TEAM = 'team',
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',

  // Admin section resources (matching route paths)
  USER_MANAGEMENT = 'user-management',
  PERMISSIONS = 'permissions',
  JOB_TITLES = 'job-titles',

  // Additional resources
  NOTIFICATION = 'notification',
  KPI = 'kpi',
  CRM = 'crm',
  CRM_SETTINGS = 'crm-settings',
  CRM_MAPPING = 'crm-mapping',
  CRM_SYNC = 'crm-sync',
  AUDIT = 'audit'
}

// Type-safe resource interface
interface Resource<T extends ResourceType> {
  id: string;
  type: T;
  ownerId?: string;
  teamId?: string;
  metadata?: ResourceMetadata<T>;
}

// Type-safe resource metadata
type ResourceMetadata<T extends ResourceType> = T extends 'pov'
  ? {
      status: POVStatus;
      phaseCount: number;
      teamSize: number;
    }
  : T extends 'phase'
  ? {
      order: number;
      status: PhaseStatus;
      taskCount: number;
    }
  : T extends 'task'
  ? {
      status: TaskStatus;
      priority: TaskPriority;
      dueDate?: string;
    }
  : Record<string, unknown>;
```

### Actions
```typescript
// Type-safe resource actions
enum ResourceAction {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  ASSIGN = 'assign',
  COMMENT = 'comment',
  UPLOAD = 'upload'
}

// Type-safe action requirements
type ActionRequirements<T extends ResourceType> = {
  [K in ResourceAction]?: {
    roles: UserRole[];
    conditions?: Array<{
      type: 'OWNERSHIP' | 'TEAM' | 'STATUS' | 'CUSTOM';
      check: (resource: Resource<T>, user: User) => boolean;
    }>;
  };
};

// Type-safe permission configuration
interface PermissionConfig {
  resources: {
    [T in ResourceType]: {
      actions: ActionRequirements<T>;
      inheritance?: ResourceType[];
    };
  };
}
```

## Route-Based Permission System

### Route Permission Checking
```typescript
// Admin layout permission check
useEffect(() => {
  if (!isLoadingUser && (!user || !isAdmin)) {
    router.push('/dashboard');
    return;
  }

  // Get the resource type based on the current path
  const path = pathname.split('/').filter(Boolean);
  if (path.length > 1 && path[0] === 'admin') {
    const section = path[1];
    let resourceType: ResourceType;

    switch (section) {
      case 'user-management':
        resourceType = ResourceType.USER_MANAGEMENT;
        break;
      case 'permissions':
        resourceType = ResourceType.PERMISSIONS;
        break;
      case 'job-titles':
        resourceType = ResourceType.JOB_TITLES;
        break;
      default:
        return;
    }

    // Check if user has permission to view this section
    const canView = hasPermission(resourceType, ResourceAction.VIEW);
    if (!canView) {
      router.push('/dashboard');
    }
  }
}, [user, isAdmin, isLoadingUser, router, pathname, hasPermission]);
```

### Client-Side Permission Validation
```typescript
const hasPermission = (resourceType: ResourceType, action: ResourceAction) => {
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true;
  
  // For admin sections, check if the user is an admin
  if ([
    ResourceType.USER_MANAGEMENT,
    ResourceType.PERMISSIONS,
    ResourceType.JOB_TITLES,
    ResourceType.CRM,
    ResourceType.CRM_SETTINGS,
    ResourceType.CRM_MAPPING,
    ResourceType.CRM_SYNC,
    ResourceType.AUDIT
  ].includes(resourceType)) {
    return [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);
  }

  return true;
};
```

### Dynamic Navigation
```typescript
const getBreadcrumbItems = (path: string): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { title: 'Home', href: '/', icon: Home }
  ];

  const segments = path.split('/').filter(Boolean);
  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    let title = segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    let icon;

    switch (segment) {
      case 'user-management':
        icon = Users;
        break;
      case 'permissions':
        icon = Settings;
        break;
      case 'job-titles':
        icon = Briefcase;
        break;
    }

    items.push({
      title,
      href: currentPath,
      icon
    });
  });

  return items;
};
```

## Permission Rules

### Super Admin
- Has unrestricted access to all resources and actions
- No conditions applied to permissions
- Can modify all permissions including ADMIN permissions
- Full system access across all sections
- Can manage system-wide settings and configurations

### Admin
- Full access to POVs, Phases, and Tasks
- Can manage users and teams
- Can view analytics
- Can configure system settings
- Access to admin sections with route-based validation:
  - User Management (/admin/user-management)
  - Permissions (/admin/permissions)
  - Job Titles (/admin/job-titles)
- Cannot modify SUPER_ADMIN permissions
- Restricted access based on resource types

### User
POV Permissions:
- Can view POVs they own or are team members of
- Can create new POVs
- Can edit POVs they own
- Can comment on POVs they're team members of

Phase Permissions:
- Can view phases in POVs they're team members of
- Can create phases in POVs they're team members of
- Can edit phases in POVs they're team members of
- Can reorder phases in POVs they're team members of

Task Permissions:
- Can view tasks in phases they're team members of
- Can create tasks in phases they're team members of
- Can edit tasks they own
- Can comment on tasks they're team members of

Team Permissions:
- Can view teams they're members of

## Resource Resolution
Resources are resolved through dedicated functions that handle:
1. Resource type identification
2. Owner resolution
3. Team membership checks
4. Permission validation

Example for Phase resource:
```typescript
export async function getPhaseResource(phaseId: string): Promise<Resource> {
  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: {
      pov: {
        select: {
          ownerId: true,
          teamId: true,
        },
      },
    },
  });

  if (!phase) {
    throw new Error('Phase not found');
  }

  return {
    id: phase.id,
    type: ResourceType.PHASE,
    ownerId: phase.pov.ownerId,
    teamId: phase.pov.teamId || undefined,
  };
}
```

## Route-Based Permission Checking

The system now includes route-based permission checking in the admin layout:

```typescript
// Admin layout permission check
useEffect(() => {
  if (!isLoadingUser && (!user || !isAdmin)) {
    router.push('/dashboard');
    return;
  }

  // Get the resource type based on the current path
  const path = pathname.split('/').filter(Boolean);
  if (path.length > 1 && path[0] === 'admin') {
    const section = path[1];
    let resourceType: ResourceType;

    switch (section) {
      case 'user-management':
        resourceType = ResourceType.USER_MANAGEMENT;
        break;
      case 'permissions':
        resourceType = ResourceType.PERMISSIONS;
        break;
      case 'job-titles':
        resourceType = ResourceType.JOB_TITLES;
        break;
      default:
        return;
    }

    // Check if user has permission to view this section
    const canView = hasPermission(resourceType, ResourceAction.VIEW);
    if (!canView) {
      router.push('/dashboard');
    }
  }
}, [user, isAdmin, isLoadingUser, router, pathname, hasPermission]);
```

## Client-Side Permission Checking

The AuthProvider now includes client-side permission checking:

```typescript
const hasPermission = (resourceType: ResourceType, action: ResourceAction) => {
  if (!user) return false;
  
  // Super admin has all permissions
  if (user.role === UserRole.SUPER_ADMIN) return true;
  
  // For admin sections, check if the user is an admin
  if ([ResourceType.USER_MANAGEMENT, ResourceType.PERMISSIONS, ResourceType.JOB_TITLES].includes(resourceType)) {
    return [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role);
  }

  return true;
};
```

## Security Measures

### Authentication Security
- HTTP-only cookies for token storage
- Environment-aware security settings
- CSRF protection through token validation
- XSS prevention with proper content encoding
- Proper token expiration and rotation

### Permission Security
- Route-based access validation
- Client-side permission checks
- Server-side verification
- Resource type validation
- Action-based authorization

### Audit Trail
- Permission change logging
- Access attempt tracking
- Security event monitoring
- User action history

## Permission Management

### UI Configuration
```typescript
// Type-safe permission configuration UI
interface PermissionMatrix<T extends ResourceType> {
  resource: T;
  actions: Array<{
    action: ResourceAction;
    roles: Record<UserRole, boolean>;
    conditions?: Array<{
      type: 'OWNERSHIP' | 'TEAM' | 'STATUS' | 'CUSTOM';
      description: string;
      configurable: boolean;
    }>;
  }>;
}

// Type-safe permission update
interface UpdatePermissionRequest {
  resource: ResourceType;
  action: ResourceAction;
  role: UserRole;
  value: boolean;
  conditions?: Array<{
    type: string;
    enabled: boolean;
    config?: Record<string, unknown>;
  }>;
}
```

### Permission Setup
The system includes a setup script (`scripts/setup-admin-permissions.ts`) for initializing and maintaining permissions:

```typescript
async function setupAdminPermissions() {
  try {
    // Create permissions for standard resources
    for (const resource of Object.values(ResourceType)) {
      for (const action of Object.values(ResourceAction)) {
        await prisma.rolePermission.upsert({
          where: {
            role_resourceType_action: {
              role: UserRole.ADMIN,
              resourceType: resource,
              action: action,
            },
          },
          update: {
            enabled: true,
          },
          create: {
            role: UserRole.ADMIN,
            resourceType: resource,
            action: action,
            enabled: true,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error setting up permissions:', error);
  }
}
```

This script serves several purposes:
1. Initializes default permissions for new resources
2. Updates permissions when new resource types are added
3. Ensures consistency in permission settings
4. Handles permission migration during system updates

The script should be run:
- After adding new resource types
- During system initialization
- After major permission structure changes
- When deploying permission-related updates

Recent updates include:
- Added CRM-related resource types (CRM_SETTINGS, CRM_MAPPING, CRM_SYNC)
- Added AUDIT resource type for audit log access
- Updated admin permissions to include new resource types

### Permission Checking
```typescript
// Type-safe permission checking
async function checkPermission<T extends ResourceType>(
  user: User,
  resource: Resource<T>,
  action: ResourceAction
): Promise<{
  granted: boolean;
  reason?: string;
  conditions?: Array<{
    type: string;
    result: boolean;
    details?: Record<string, unknown>;
  }>;
}> {
  try {
    // Get permission config
    const config = await getPermissionConfig(resource.type);
    const actionConfig = config.resources[resource.type].actions[action];

    if (!actionConfig) {
      return {
        granted: false,
        reason: 'Action not configured'
      };
    }

    // Check role
    if (!actionConfig.roles.includes(user.role)) {
      return {
        granted: false,
        reason: 'Insufficient role'
      };
    }

    // Check conditions
    if (actionConfig.conditions) {
      const conditionResults = await Promise.all(
        actionConfig.conditions.map(async condition => ({
          type: condition.type,
          result: await condition.check(resource, user)
        }))
      );

      const failedConditions = conditionResults.filter(c => !c.result);
      if (failedConditions.length > 0) {
        return {
          granted: false,
          reason: 'Failed conditions',
          conditions: conditionResults
        };
      }
    }

    // Log success
    await logPermissionCheck({
      userId: user.id,
      resourceType: resource.type,
      resourceId: resource.id,
      action,
      granted: true
    });

    return { granted: true };
  } catch (error) {
    console.error('[Permission Check Error]:', error);
    throw new Error(
      `Failed to check permission: ${error.message}`
    );
  }
}
```

### Permission Updates
Permission changes are handled through:
1. Admin-only access to permission management
2. API endpoints for permission updates
3. Real-time permission validation
4. Audit logging of permission changes

```typescript
// Permission Management API
PUT /api/admin/permissions
{
  role: UserRole;
  resource: ResourceType;
  action: ResourceAction;
  value: boolean;
}
```

## Access Control Layers

### 1. System Roles
- Base level access control (USER, ADMIN, SUPER_ADMIN)
- Hierarchical permission structure
- Non-configurable through UI

### 2. User Permissions
- Fine-grained access control
- Configurable through UI
- Resource and action based
- Team and ownership conditions

### 3. Team-Based Access
- Team membership tracking
- Resource-team associations
- Permission conditions based on team membership

Example:
```typescript
const hasViewPermission = await checkPermission(
  { id: user.userId, role: user.role },
  {
    id: phase.id,
    type: ResourceType.PHASE,
    ownerId: phase.pov.ownerId,
    teamId: phase.pov.teamId || undefined,
  },
  ResourceAction.VIEW
);
```

## Activity Tracking
All permission-related actions are logged:
1. Permission checks
2. Resource access attempts
3. Permission denials
4. Role changes

Example:
```typescript
await trackActivity({
  userId: user.id,
  action: 'update',
  type: 'phase',
  metadata: {
    phaseId: phase.id,
    changes: ['order'],
  },
});
```

## Caching Strategy
Permissions are cached to improve performance:
1. Role permissions cached in memory
2. Resource permissions cached with short TTL
3. Team membership cached with medium TTL
4. Cache invalidation on role/team changes

## Error Handling
Permission errors are handled consistently:
1. Structured error responses
2. Detailed error logging
3. Activity tracking for failures
4. User-friendly error messages

## Implementation Examples

### Route Protection
```typescript
// Check edit permission
const hasEditPermission = await checkPermission(
  { id: user.userId, role: user.role },
  {
    id: pov.id,
    type: ResourceType.POV,
    ownerId: pov.ownerId,
    teamId: pov.teamId || undefined,
  },
  ResourceAction.EDIT
);

if (!hasEditPermission) {
  return NextResponse.json(
    { error: 'Permission denied' },
    { status: 403 }
  );
}
```

### UI Integration
```typescript
const canEdit = isAdmin || isOwner || isTeamMember;

{canEdit && (
  <IconButton onClick={handleEdit}>
    <EditIcon />
  </IconButton>
)}
```

## Testing
Permission checks are thoroughly tested:
1. Unit tests for permission logic
2. Integration tests for resource resolution
3. E2E tests for permission enforcement
4. Performance tests for caching

## Related Documentation
- [Authentication & Token Architecture](./auth-token-architecture.md)
- [Technical Learnings](./technicalLearnings.md)
- [Type System Guidelines](./typeSystemGuidelines.md)
