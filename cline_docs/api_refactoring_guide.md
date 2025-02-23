# API Refactoring Guide

## Overview
This document outlines our approach to refactoring large API route files into smaller, more maintainable modules. We'll use the tasks API refactoring as a case study.

## Problem Statement
Large API route files often become difficult to maintain due to:
- Mixed concerns (database queries, permissions, notifications, etc.)
- Complex type definitions
- Duplicated code
- Difficult testing
- Poor separation of concerns

## Solution: Modular API Architecture

### Directory Structure
```
lib/[feature]/
├── types.ts                 # Feature-specific type definitions
├── prisma/
│   ├── select.ts           # Prisma select types
│   └── mappers.ts          # Prisma to domain type mappers
├── handlers/
│   ├── get.ts              # GET request handler
│   └── post.ts             # POST request handler
└── services/
    ├── activity.ts         # Activity logging service
    └── notification.ts     # Notification service
```

### Component Responsibilities

#### 1. Types (types.ts)
- Domain-specific type definitions
- API request/response types
- Enums and constants
```typescript
export interface Task {
  id: string;
  title: string;
  // ...
}

export interface TaskResponse {
  data: Task;
}
```

#### 2. Prisma Layer (prisma/)
- **select.ts**: Defines Prisma select types for consistent data fetching
```typescript
export const taskSelect = {
  id: true,
  title: true,
  // ...
} as const;
```

- **mappers.ts**: Maps between Prisma and domain types
```typescript
export function mapTaskFromPrisma(task: TaskWithRelations): Task {
  return {
    id: task.id,
    // ...
  };
}
```

#### 3. Handlers (handlers/)
- Request handling logic
- Permission checks
- Input validation
```typescript
export const getTasksHandler: ApiHandler<TaskListResponse> = async (
  req,
  context,
  user
) => {
  // Handler logic
};
```

#### 4. Services (services/)
- Isolated business logic
- Reusable functionality
```typescript
export async function createTaskActivity(data: {
  userId: string;
  taskId: string;
  // ...
}) {
  // Activity logging logic
}
```

### Main Route File
The main route file becomes a thin wrapper:
```typescript
export const GET = createHandler(getTasksWrapper, { requireAuth: true });
export const POST = createHandler(createTaskWrapper, { requireAuth: true });
```

## Benefits
1. **Maintainability**
   - Each file has a single responsibility
   - Easier to understand and modify
   - Clear separation of concerns

2. **Type Safety**
   - Consistent type definitions
   - Better type inference
   - Reduced runtime errors

3. **Testability**
   - Isolated components are easier to test
   - Clear dependencies
   - Mockable services

4. **Reusability**
   - Shared services and utilities
   - Consistent patterns across features
   - DRY code

## Candidates for Refactoring

Looking at the current codebase, these API routes could benefit from similar refactoring:

1. **POV API** (`app/api/pov/route.ts`)
   - Complex CRUD operations
   - Phase management
   - Team permissions
   - Activity logging

2. **Notifications API** (`app/api/notifications/route.ts`)
   - Notification types
   - User preferences
   - Delivery methods
   - Read/unread status

3. **Admin API** (`app/api/admin/users/route.ts`)
   - User management
   - Role assignments
   - Audit logging
   - System settings

4. **Settings API** (`app/api/settings/route.ts`)
   - User preferences
   - System configuration
   - Validation logic

## Implementation Steps

1. **Analysis**
   - Identify core responsibilities
   - Map data flows
   - List external dependencies

2. **Structure**
   - Create feature directory
   - Set up module structure
   - Define types

3. **Migration**
   - Move type definitions
   - Extract Prisma logic
   - Create service modules
   - Split handlers

4. **Integration**
   - Update imports
   - Add type wrappers
   - Update tests

5. **Validation**
   - Test all endpoints
   - Verify type safety
   - Check error handling

## Best Practices

1. **Type Safety**
   - Use strict TypeScript settings
   - Avoid any types
   - Define clear interfaces

2. **Error Handling**
   - Consistent error types
   - Proper error propagation
   - Informative error messages

3. **Testing**
   - Unit tests for services
   - Integration tests for handlers
   - E2E tests for routes

4. **Documentation**
   - Clear JSDoc comments
   - API documentation
   - Usage examples

## Case Study: Team Member Selection Refactoring

### Problem
The POV edit functionality was using the admin-only `/api/admin/users` endpoint for team member selection, which caused:
- Unauthorized access errors for non-admin users
- HTML error pages instead of JSON responses
- Poor separation of concerns (admin vs. user functionality)
- Mixed responsibilities in route handlers

### Solution Implementation

1. **Type Definitions** (`lib/pov/types/team.ts`)
   ```typescript
   export interface TeamMemberResponse {
     id: string;
     name: string;
     email: string;
   }

   export interface AvailableTeamMembersResponse {
     data: TeamMemberResponse[];
   }

   export interface TeamMemberSelection {
     povId: string;
     ownerId: string;
     teamId?: string;
   }
   ```

2. **Prisma Layer** (`lib/pov/prisma/team.ts`)
   ```typescript
   export const teamMemberSelect = {
     id: true,
     name: true,
     email: true,
   } as const satisfies Prisma.UserSelect;

   export function mapTeamMemberFromPrisma(user: TeamMemberFromPrisma): TeamMemberResponse {
     return {
       id: user.id,
       name: user.name,
       email: user.email,
     };
   }
   ```

3. **Service Layer** (`lib/pov/services/team.ts`)
   ```typescript
   export class TeamService {
     static async getAvailableMembers({ povId, ownerId }: TeamMemberSelection) {
       return await prisma.user.findMany({
         where: {
           status: 'ACTIVE',
           NOT: { id: ownerId },
         },
         select: teamMemberSelect,
         orderBy: { name: 'asc' },
       });
     }

     static async updateMembers(teamId: string, userIds: string[]) {
       return await prisma.team.update({
         where: { id: teamId },
         data: {
           members: {
             deleteMany: {},
             createMany: {
               data: userIds.map(userId => ({
                 userId,
                 role: 'MEMBER',
               })),
             },
           },
         },
       });
     }
   }
   ```

4. **Handler Layer** (`lib/pov/handlers/team.ts`)
   ```typescript
   export async function getAvailableTeamMembersHandler(
     req: NextRequest,
     povId: string
   ): Promise<AvailableTeamMembersResponse> {
     const user = await getAuthUser(req);
     if (!user) throw new Error('Unauthorized');

     const pov = await prisma.pOV.findUnique({
       where: { id: povId },
       select: { ownerId: true, teamId: true },
     });

     if (!pov) throw new Error('POV not found');

     const hasEditPermission = await checkPermission(
       { id: user.userId, role: user.role as UserRole },
       { id: povId, type: ResourceType.POV, ownerId: pov.ownerId, teamId: pov.teamId || undefined },
       ResourceAction.EDIT
     );

     if (!hasEditPermission) throw new Error('Permission denied');

     const availableMembers = await TeamService.getAvailableMembers({
       povId,
       ownerId: pov.ownerId,
       teamId: pov.teamId || undefined,
     });

     return {
       data: availableMembers.map(mapTeamMemberFromPrisma),
     };
   }
   ```

5. **Route Layer** (`app/api/pov/[povId]/team/available/route.ts`)
   ```typescript
   export async function GET(
     req: NextRequest,
     { params }: { params: { povId: string } }
   ) {
     try {
       const response = await getAvailableTeamMembersHandler(req, params.povId);
       return NextResponse.json(response);
     } catch (error) {
       return NextResponse.json(
         { error: error instanceof Error ? error.message : 'Failed to fetch available team members' },
         { status: error instanceof Error ? 400 : 500 }
       );
     }
   }
   ```

### Benefits Achieved
1. **Improved Architecture**
   - Clear separation of concerns with dedicated modules
   - Type-safe operations throughout the stack
   - Reusable team management functionality
   - Consistent error handling patterns

2. **Enhanced Security**
   - Proper permission checks at handler level
   - No unauthorized admin access
   - Consistent JSON responses
   - Type-safe request/response handling

3. **Better Maintainability**
   - Each module has a single responsibility
   - Easy to extend with new team features
   - Clear integration points
   - Consistent patterns across modules

4. **Type Safety**
   - Strong typing for all operations
   - Prisma select types for database queries
   - Consistent request/response interfaces
   - Proper error type handling

### Lessons Learned
1. Break down complex route handlers into modular components
2. Use dedicated types for each layer of the application
3. Implement service layer for reusable business logic
4. Keep route handlers thin and focused on request/response handling
5. Consider permission checks early in the design process
6. For nested resources (like phases in POVs):
   - Use parent resource type for permission checks (e.g., ResourceType.POV for phases)
   - Use appropriate parent action (e.g., EDIT for creating/updating/deleting phases)
   - This ensures consistent permission handling and reflects the hierarchical nature of the resources
7. Handle type conversions between layers:
   - Use mappers to convert between Prisma and domain types
   - Convert dates to ISO strings at the handler level
   - Use proper type casting for enums between Prisma and domain types
   - Keep type definitions consistent across the application

## Case Study: Notifications API Refactoring

### Problem
The notifications API had several challenges:
- Mixed concerns (delivery, cleanup, user preferences)
- Complex state management
- Tight coupling with authentication
- Inconsistent error handling

### Solution Implementation

1. **Modular Directory Structure**
   ```
   lib/notifications/
   ├── types.ts                 # Notification type definitions
   ├── prisma/
   │   ├── select.ts           # Prisma select types
   │   └── mappers.ts          # Type mappers
   ├── handlers/
   │   ├── get.ts              # GET notifications handler
   │   ├── post.ts             # Create notification handler
   │   └── read.ts             # Mark as read handler
   └── services/
       ├── activity.ts         # Activity logging
       ├── delivery.ts         # Notification delivery
       └── cleanup.ts          # Auto-cleanup service
   ```

2. **Type Definitions**
   ```typescript
   // types.ts
   export interface Notification {
     id: string;
     type: NotificationType;
     title: string;
     message: string;
     userId: string;
     read: boolean;
     actionUrl?: string;
     createdAt: Date;
   }

   export interface NotificationResponse {
     data: Notification[];
     unreadCount: number;
   }
   ```

3. **Handler Implementation**
   ```typescript
   // handlers/get.ts
   export const getNotificationsHandler: ApiHandler<NotificationResponse> = 
     async (req, context, user) => {
       const notifications = await prisma.notification.findMany({
         where: { userId: user.id },
         orderBy: { createdAt: 'desc' },
         select: notificationSelect,
       });

       const unreadCount = await prisma.notification.count({
         where: { 
           userId: user.id,
           read: false,
         },
       });

       return {
         data: notifications.map(mapNotificationFromPrisma),
         unreadCount,
       };
     };
   ```

### Benefits Achieved
1. **Clear Separation of Concerns**
   - Notification delivery isolated from state management
   - Cleanup service separated from core functionality
   - Authentication integration through proper handlers

2. **Type Safety**
   - Strong typing for notification operations
   - Consistent request/response types
   - Better error handling

3. **Maintainable Structure**
   - Each module has a single responsibility
   - Easy to extend with new notification types
   - Clear integration points with other systems

4. **Performance**
   - Efficient database queries through Prisma layer
   - Proper caching of notification state
   - Optimized cleanup processes

### Lessons Learned
1. Separate core notification logic from delivery mechanisms
2. Use proper type definitions for all operations
3. Implement efficient cleanup strategies
4. Consider authentication integration early

## Conclusion
This modular approach to API development improves code quality, maintainability, and developer experience. The team member selection and notifications refactoring demonstrate how following these patterns leads to more secure, maintainable, and user-friendly APIs. These principles should be applied consistently across the codebase.
