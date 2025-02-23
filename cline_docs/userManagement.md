# User Management Implementation

## Authentication & Authorization

The application uses a middleware-based authentication and authorization system:

- **Auth Middleware**: Handles basic authentication for all protected routes
  - Verifies the `accessToken` cookie with proper JWT validation
  - Adds user information to request headers
  - Redirects to login if token is invalid or missing
  - Handles token expiration and refresh

- **Admin Middleware**: Provides additional authorization for admin routes
  - Runs after auth middleware for admin routes
  - Verifies user has ADMIN or SUPER_ADMIN role
  - Redirects to dashboard if user lacks admin privileges
  - Protects all `/admin/*` routes
  - Logs unauthorized access attempts

### Protected Routes
```typescript
// Protected routes (require authentication)
'/dashboard'
'/api/dashboard'
'/api/pov'
'/api/notifications'
'/pov'
'/pov/create'
'/pov/list'

// Admin routes (require admin role)
'/admin'
'/admin/users'
'/admin/roles'
'/admin/team'
'/admin/pov'
'/admin/analytics'
'/admin/settings'
'/api/admin'
```

## Features

The User Management system provides the following features:

### Role-Based Access Control
- **Admin Access**: Full visibility of all users, teams, and POVs
- **User Access**: Limited to own POVs and team collaborations
- **Team-Based Access**: Users can access POVs where they are team members
- **Data Filtering**: Automatic filtering based on user role and team membership
- **Team Role Permissions**: Fine-grained access control based on team roles

### User Interface Components
- **UserMenu**: Top-right account menu with role-specific options
  - Displays user avatar with initials
  - Shows admin badge for admin users
  - Provides quick access to profile and admin sections
  - Handles secure logout functionality
  - Shows team role badges

- **AppLayout**: Role-aware application layout
  - Conditional navigation based on user role
  - Integrated user menu
  - Responsive design for all screen sizes
  - Team context switcher

### User Table Features
- **Sortable Columns**: All columns can be sorted in ascending or descending order
- **Status Management**: Users can be marked as Active, Inactive, or Suspended
- **Role Assignment**: Users can be assigned roles (User, Admin, Super Admin)
- **User Actions**: Individual user actions including edit and delete
- **Responsive Layout**: Works well on different screen sizes
- **Team Role Management**: Assign and manage team roles

### User Form Features
- **Create New Users**: Add new users with email, name, role, and status
- **Edit Existing Users**: Modify user details except email (which is immutable)
- **Status Control**: Set user status during creation or update
- **Role Assignment**: Assign or change user roles
- **Validation**: Form validation for required fields and email format
- **Team Assignment**: Add users to teams with specific roles

## Components

The implementation consists of the following components:

### UserMenu.tsx
Account management component that provides:
- User profile display
- Role-based menu options
- Secure logout functionality
- Visual role indicators
- Team role badges

```typescript
// Type-safe user interface
interface User {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  teamRoles?: Array<{
    teamId: string;
    teamName: string;
    role: TeamRole;
  }>;
  metadata?: {
    lastActive?: string;
    preferences?: UserPreferences;
  };
}

export function UserMenu() {
  const { user, isAdmin, activeTeam } = useAuth();
  // Component implementation
}
```

### UserManagement.tsx
Main component that handles:
- User data display and sorting
- User creation and editing
- User deletion
- Table layout and responsive design
- Team role management

```typescript
// Type-safe interfaces
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  teamRoles: TeamRole[];
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface UserManagementProps {
  users: User[];
  onUserCreate: (userData: UserFormData) => Promise<void>;
  onUserEdit: (userId: string, userData: UserFormData) => Promise<void>;
  onUserDelete: (userId: string) => Promise<void>;
  onTeamRoleChange: (userId: string, teamId: string, role: TeamRole) => Promise<void>;
}
```

### UserForm.tsx
Modal form component for user creation and editing:
- Handles both create and edit modes
- Manages form state and validation
- Provides role and status selection
- Handles form submission and error display
- Team role assignment

```typescript
// Type-safe form interfaces
interface UserFormData {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  teamRoles?: Array<{
    teamId: string;
    role: TeamRole;
  }>;
  metadata?: {
    preferences?: UserPreferences;
    [key: string]: unknown;
  };
}

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: UserFormData) => Promise<void>;
  initialData?: UserFormData;
  mode: 'create' | 'edit';
  availableTeams?: Array<{
    id: string;
    name: string;
  }>;
}
```

## API Endpoints

### GET /api/auth/me
```typescript
// Type-safe response interface
interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    teamRoles: Array<{
      teamId: string;
      teamName: string;
      role: TeamRole;
    }>;
    metadata?: {
      lastActive?: string;
      preferences?: UserPreferences;
    };
  };
}

// Implementation with error handling
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user with team roles
    const userWithRoles = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        teamMembers: {
          include: {
            team: true
          }
        }
      }
    });

    if (!userWithRoles) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: userWithRoles.id,
        email: userWithRoles.email,
        name: userWithRoles.name,
        role: userWithRoles.role,
        status: userWithRoles.status,
        teamRoles: userWithRoles.teamMembers.map(tm => ({
          teamId: tm.team.id,
          teamName: tm.team.name,
          role: tm.role
        })),
        metadata: userWithRoles.metadata
      }
    });
  } catch (error) {
    console.error('[Me Endpoint Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### POST /api/auth/logout
```typescript
// Type-safe implementation
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (user) {
      // Remove refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId: user.userId }
      });

      // Log activity
      await prisma.activity.create({
        data: {
          type: 'LOGOUT',
          userId: user.userId
        }
      });
    }

    // Clear cookies
    const response = NextResponse.json({ success: true });
    response.cookies.delete(config.cookie.accessToken);
    response.cookies.delete(config.cookie.refreshToken);
    
    return response;
  } catch (error) {
    console.error('[Logout Error]:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
```

### GET /api/admin/users
```typescript
// Type-safe response interface
interface UsersResponse {
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    teamRoles: Array<{
      teamId: string;
      teamName: string;
      role: TeamRole;
    }>;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
}

// Implementation with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const { page = 1, limit = 50, search, status, role } = parseQueryParams(req.url);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { email: { contains: search } },
          { name: { contains: search } }
        ]
      }),
      ...(status && { status }),
      ...(role && { role })
    };

    // Get users with pagination
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          teamMembers: {
            include: {
              team: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        teamRoles: user.teamMembers.map(tm => ({
          teamId: tm.team.id,
          teamName: tm.team.name,
          role: tm.role
        })),
        metadata: user.metadata,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      })),
      total
    });
  } catch (error) {
    console.error('[Get Users Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
```

## Data Models

### User Model
```typescript
// Type-safe user model
model User {
  id        String     @id @default(cuid())
  name      String
  email     String     @unique
  password  String
  role      UserRole   @default(USER)
  status    UserStatus @default(ACTIVE)
  lastLogin DateTime?
  metadata  Json?      // Additional user metadata
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  // Relations with proper cascading
  ownedPOVs     POV[]          @relation("POVOwner")
  teamMembers   TeamMember[]
  refreshTokens RefreshToken[]  @relation(onDelete: Cascade)
  notifications Notification[]  @relation(onDelete: Cascade)
  activities    Activity[]      @relation(onDelete: Cascade)

  // Indexes for performance
  @@index([email])
  @@index([role, status])
}

// Type-safe enums
enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

// Type-safe user interfaces
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  metadata?: {
    lastActive?: string;
    preferences?: UserPreferences;
    [key: string]: unknown;
  };
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    inApp?: boolean;
    desktop?: boolean;
  };
  timezone?: string;
}

// Type-safe error handling
interface UserError {
  code: 'USER_NOT_FOUND' | 'EMAIL_TAKEN' | 'INVALID_ROLE' | 'INVALID_STATUS';
  message: string;
  details?: Record<string, unknown>;
}
```

## Usage

The User Management interface is accessible through:
```
/admin/users
```

### Required Permissions
- Access requires ADMIN or SUPER_ADMIN role
- Protected by both auth and admin middleware
- Failed auth redirects to login page with error message
- Failed admin check redirects to dashboard with notification
- Team role changes require OWNER or MANAGER role

### Test Users
The system includes the following test accounts:
- Admin: admin@example.com (password: admin123)
- EMEA User: rika@example.com (password: Rikrik123!)
- APAC User: chris@example.com (password: chris123)

## Next Steps

1. Implement email notifications for:
   - User creation (welcome email with temporary password)
   - Status changes with reason
   - Role changes with audit trail
   - Team role assignments

2. Add bulk actions for:
   - Status updates with confirmation
   - Role assignments with validation
   - User deletion with safeguards
   - Team role management

3. Enhance filtering capabilities:
   - Add date range filters
   - Add status filters
   - Add search by email/name
   - Add team role filters

4. Implement audit logging for:
   - User management actions
   - Role changes
   - Status updates
   - Team role modifications

5. Enhance team management:
   - Team creation/deletion UI with validation
   - Team member management interface
   - Team role management with permissions
   - Cross-team collaboration controls
   - Team activity tracking
