# Custom Roles Architecture

## Overview

The application implements a three-tier role system:
1. System Roles (Role Types)
2. User Permissions (Access Control)
3. Job Titles (Organizational Structure)

This separation allows for clear distinction between role types, granular permissions, and organizational positions.

## System Roles, Permissions, and Job Titles

### System Roles
- Purpose: Define user type and base access level
- Defined in `UserRole` enum:
  - Standard User: Basic system access
  - System Admin: System management access
  - Super Admin: Full system control
- Characteristics:
  - Required for every user
  - Cannot be modified through standard UI
  - Hierarchical structure
  - Determines base access level

### User Permissions
- Purpose: Fine-grained access control for system resources
- Defined through Permission Management:
  ```typescript
  interface Permission {
    action: ResourceAction;
    resourceType: ResourceType;
    conditions?: {
      isOwner?: boolean;
      isTeamMember?: boolean;
      hasRole?: UserRole[];
      teamRole?: TeamRole;
    };
  }

  // Type-safe permission checking
  async function checkPermission(
    user: { id: string; role: UserRole },
    resource: {
      id: string;
      type: ResourceType;
      ownerId?: string;
      teamId?: string;
    },
    action: ResourceAction
  ): Promise<boolean> {
    // Check system role permissions
    const rolePermissions = await getRolePermissions(user.role);
    const hasPermission = rolePermissions.some(p => 
      p.resourceType === resource.type && 
      p.action === action
    );
    if (!hasPermission) return false;

    // Check ownership condition
    if (resource.ownerId === user.id) return true;

    // Check team membership
    if (resource.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: resource.teamId,
          userId: user.id
        }
      });
      if (teamMember) return true;
    }

    return false;
  }
  ```
- Characteristics:
  - Configurable per system role
  - Resource-based permissions (POV, Phase, Task, etc.)
  - Action-based controls (View, Create, Edit, etc.)
  - Conditional access rules

### Job Titles (Custom Roles)
- Purpose: Represent organizational positions
- Stored in `Role` model:
  ```prisma
  model Role {
    id          String   @id @default(cuid())
    name        String   @unique
    permissions String[]
    users       User[]
  }
  ```
- Characteristics:
  - Optional assignment
  - Can be created/modified by admins
  - Case-insensitive unique names
  - No impact on system access

## Database Schema

```prisma
// User Model with both role types
model User {
  id           String     @id @default(cuid())
  role         UserRole   @default(USER)      // System role
  customRole   Role?      @relation(...)      // Optional job title
  customRoleId String?
  // ... other fields
}
```

## Implementation Details

### 1. User Interface
```typescript
// User Form with type safety
interface RoleSelectProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  error?: string;
}

const RoleSelect: React.FC<RoleSelectProps> = ({
  value,
  onChange,
  disabled,
  error
}) => (
  <FormControl error={!!error} disabled={disabled}>
    <InputLabel>System Role</InputLabel>
    <Select
      value={value}
      onChange={e => onChange(e.target.value as UserRole)}
      label="System Role"
    >
      <MenuItem value={UserRole.USER}>Standard User</MenuItem>
      <MenuItem value={UserRole.ADMIN}>System Admin</MenuItem>
      <MenuItem value={UserRole.SUPER_ADMIN}>Super Admin</MenuItem>
    </Select>
    <FormHelperText>
      {error || "Determines system access level"}
    </FormHelperText>
  </FormControl>
);

interface CustomRoleSelectProps {
  value: string | null;
  onChange: (roleId: string | null) => void;
  roles: Array<{
    id: string;
    name: string;
  }>;
  disabled?: boolean;
  error?: string;
}

const CustomRoleSelect: React.FC<CustomRoleSelectProps> = ({
  value,
  onChange,
  roles,
  disabled,
  error
}) => (
  <FormControl error={!!error} disabled={disabled}>
    <InputLabel>Job Title</InputLabel>
    <Select
      value={value || ''}
      onChange={e => onChange(e.target.value || null)}
      label="Job Title"
    >
      <MenuItem value="">None</MenuItem>
      {roles.map(role => (
        <MenuItem key={role.id} value={role.id}>
          {role.name}
        </MenuItem>
      ))}
    </Select>
    <FormHelperText>
      {error || "Organizational position (optional)"}
    </FormHelperText>
  </FormControl>
);

// Permission Management
<PermissionManagement
  role={selectedRole}
  rolePermissions={permissions}
  onPermissionChange={handlePermissionChange}
/>
```

### 2. Validation Rules
- System Roles:
  - Required field
  - Cannot assign higher role than own level
  - Hierarchical validation
- User Permissions:
  - Cannot modify Super Admin permissions
  - Resource and action-based validation
  - Conditional access checks
- Job Titles:
  - Optional field
  - Case-insensitive unique names
  - No hierarchical restrictions

### 3. API Structure
```typescript
// System Role Management with type safety
interface UpdateRoleRequest {
  role: UserRole;
  reason?: string;
}

interface UpdateRoleResponse {
  success: boolean;
  user: {
    id: string;
    role: UserRole;
    email: string;
  };
}

// API Routes with proper error handling
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    if (!isValidRole(data.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check permission to update roles
    const hasPermission = await checkPermission(
      { id: user.userId, role: user.role },
      { id: params.id, type: ResourceType.USER },
      ResourceAction.UPDATE_ROLE
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Update role with audit log
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: params.id },
        data: { role: data.role },
        select: {
          id: true,
          role: true,
          email: true
        }
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE_ROLE',
          userId: user.userId,
          targetId: params.id,
          details: {
            oldRole: user.role,
            newRole: data.role,
            reason: data.reason
          }
        }
      });

      return updated;
    });

    return NextResponse.json({ 
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('[Update Role Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Security Considerations

1. System Role Protection
   - System role changes require specific permissions
   - Hierarchical validation prevents escalation
   - Clear separation from job titles

2. Permission Management
   - Admin-only configuration
   - Super Admin permissions locked
   - Resource-based access control

3. Job Title Management
   - Admin-only creation/modification
   - Safe deletion checks
   - Case-insensitive uniqueness

## Best Practices

1. Clear Distinction
   - Use "System Role" for base access level
   - Use "User Permissions" for granular access control
   - Use "Job Title" for organizational structure
   - Maintain separation of concerns

2. User Interface
   - Clear labels and descriptions
   - Separate sections for each aspect
   - Helpful validation messages

3. Data Integrity
   - Validate all role aspects independently
   - Maintain proper relationships
   - Handle edge cases gracefully

## Future Enhancements

1. Job Title Features
   - Department grouping
   - Reporting structure
   - Role-specific dashboards

2. Permission System
   - Custom permission templates
   - Bulk permission updates
   - Permission inheritance
   - Impact analysis tools

3. Audit Trail
   - Track role and permission changes
   - Change history
   - Security impact analysis
