# Task Management Architecture

## Overview

The task management system is designed to support collaborative work within POVs (Point of Views) and their phases. Tasks represent actionable items that can be assigned to team members, tracked through various statuses, and organized within phases.

## Core Components

### Data Model

```prisma
model Task {
  id          String      @id @default(cuid())
  title       String
  description String?
  status      TaskStatus  @default(OPEN)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  assigneeId  String?
  povId       String
  phaseId     String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  pov         POV         @relation(fields: [povId], references: [id])
  phase       Phase       @relation(fields: [phaseId], references: [id])
  assignee    User?       @relation(fields: [assigneeId], references: [id])
}

enum TaskStatus {
  OPEN
  IN_PROGRESS
  COMPLETED
  BLOCKED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### Permission System

Tasks inherit their permission model directly from POVs with proper error handling and type safety:

```typescript
// Permission check example from task creation endpoint
async function validateTaskAccess(
  user: { id: string; role: UserRole },
  povId: string,
  action: ResourceAction
): Promise<void> {
  try {
    const pov = await prisma.pOV.findUnique({
      where: { id: povId },
      select: { 
        id: true,
        ownerId: true,
        teamId: true,
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
    });

    if (!pov) {
      throw new Error('POV not found');
    }

    const hasPermission = await checkPermission(
      { id: user.id, role: user.role },
      { 
        id: povId, 
        type: ResourceType.POV, 
        ownerId: pov.ownerId, 
        teamId: pov.teamId 
      },
      action // Using EDIT permission for create/update, VIEW for read
    );

    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    // Additional team role validation
    if (action === ResourceAction.EDIT && pov.teamId) {
      const teamMember = pov.team?.members.find(m => 
        m.user.id === user.id
      );
      
      if (!teamMember) {
        throw new Error('User is not a team member');
      }

      // Check if user has required team role for task management
      if (!['OWNER', 'MANAGER'].includes(teamMember.role)) {
        throw new Error('Insufficient team role for task management');
      }
    }
  } catch (error) {
    console.error('[Task Access Validation Error]:', error);
    throw error;
  }
}

// Usage in task creation endpoint
try {
  await validateTaskAccess(user, povId, ResourceAction.EDIT);
  // Proceed with task creation...
} catch (error) {
  return NextResponse.json(
    { error: error.message },
    { status: error.message.includes('not found') ? 404 : 403 }
  );
}
```

Access levels:
- POV owners: Full access to all tasks (via POV's permissions)
- Team members: Can create and edit tasks (if they have EDIT access to POV)
- Team members: Can view tasks (if they have VIEW access to POV)
- Others: No access unless explicitly granted POV permissions

## API Design

### API Modularization

The task management API follows a modular architecture pattern with clear separation of concerns:

1. **Types Layer** (`lib/tasks/types/index.ts`):
   - Domain-specific type definitions:
     ```typescript
     export interface Task {
       id: string;
       title: string;
       description: string | null;
       assigneeId: string | null;
       teamId: string | null;
       povId: string | null;
       phaseId: string | null;
       dueDate: string | null;
       priority: TaskPriority;
       status: TaskStatus;
       createdAt: string;
       updatedAt: string;
     }
     ```
   - Enums for task status and priority:
     ```typescript
     export enum TaskStatus {
       OPEN = 'OPEN',
       IN_PROGRESS = 'IN_PROGRESS',
       COMPLETED = 'COMPLETED',
       BLOCKED = 'BLOCKED'
     }
     ```
   - Request/response interfaces:
     ```typescript
     export interface CreateTaskData {
       title: string;
       description?: string;
       assigneeId?: string;
       // ...other fields
     }

     export interface TaskResponse {
       data: Task;
     }
     ```

2. **Prisma Layer** (`lib/tasks/prisma/`):
   - `select.ts`: Defines consistent Prisma selects
   - `mappers.ts`: Handles conversion between Prisma and domain types

3. **Service Layer** (`lib/tasks/services/task.ts`):
   - Core business logic
   - Database operations
   - Type validation
   - Error handling

4. **Handler Layer** (`lib/tasks/handlers/`):
   - Request handling
   - Permission checks
   - Service orchestration
   - Response formatting

### Task Creation and Update Flow

The task management process follows a clear path through the layers:

1. **UI Layer** (`components/tasks/TaskCreate.tsx` and `app/(authenticated)/pov/[povId]/phase/[phaseId]/task/[taskId]/edit/page.tsx`):
   - Collects task data via form
   - Validates input using zod schema
   - Handles assignee selection from team members
   - Provides status and priority selection
   - Sends POST/PUT request to API
   - Handles loading states and error feedback
   - Uses React Query for data management

2. **Route Layer** (`app/api/pov/[povId]/phase/[phaseId]/task/route.ts` and `[taskId]/route.ts`):
   - Receives request
   - Validates required parameters
   - Forwards to appropriate handler
   - Provides detailed error responses with proper status codes
   - Includes error context for debugging

3. **Handler Layer** (`lib/tasks/handlers/task.ts`):
   - Validates POV exists
   - Checks POV permissions (EDIT for create/update, VIEW for read)
   - Validates task existence and ownership for updates
   - Processes and sanitizes request data
   - Calls TaskService with validated data
   - Maps response using domain types
   - Provides specific error messages for common failures

4. **Service Layer** (`lib/tasks/services/task.ts`):
   - Validates assignee exists
   - Validates task exists for updates
   - Cleans and transforms input data
   - Handles null/undefined values appropriately
   - Converts dates to proper format
   - Maps enums between Prisma and domain types
   - Performs database operation with proper selects
   - Returns strongly typed result
   - Provides detailed error logging

5. **Response Flow**:
   - Service returns Prisma result with full selects
   - Handler maps to domain types with proper date formatting
   - Route sends JSON response with error handling
   - UI updates with new/updated task data
   - React Query invalidates relevant queries
   - Loading states are cleared
   - Success/error feedback is shown to user

### Endpoints Structure

```
/api/pov/[povId]/phase/[phaseId]/task/
├── POST /                    # Create task
├── GET /                     # List phase tasks
└── [taskId]/
    ├── GET /                # Get task details
    ├── PUT /                # Update task
    └── DELETE /             # Delete task
```

Each endpoint includes:
- Input validation
- Permission checks
- Error handling with specific messages
- Proper status codes
- Debug logging

### Request/Response Examples

Create Task:
```typescript
// Type-safe request/response interfaces
interface CreateTaskRequest {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  metadata?: {
    requiredDocuments?: string[];
    dependencies?: string[];
    estimatedHours?: number;
    [key: string]: unknown;
  };
}

interface TaskResponse {
  data: {
    id: string;
    title: string;
    description: string | null;
    assigneeId: string | null;
    assignee: {
      id: string;
      name: string;
      email: string;
    } | null;
    dueDate: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
  };
}

// POST /api/pov/[povId]/phase/[phaseId]/task
// Request body with validation
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
  metadata: z.record(z.unknown()).optional()
});

// Example request
{
  title: "Implement login flow",
  description: "Add authentication using OAuth",
  assigneeId: "user_123",
  dueDate: "2025-02-15T00:00:00Z",
  priority: TaskPriority.HIGH,
  status: TaskStatus.OPEN,
  metadata: {
    requiredDocuments: ['auth-spec.md'],
    estimatedHours: 8
  }
}

// Example response with proper error handling
try {
  const response = await fetch('/api/pov/123/phase/456/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create task');
  }

  const result: TaskResponse = await response.json();
  return result;
} catch (error) {
  console.error('[Task Creation Error]:', error);
  throw error;
}
```

## Frontend Implementation

### Form Management

We use react-hook-form with zod validation for robust form handling:

```typescript
const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
});

type TaskFormData = z.infer<typeof taskSchema>;
```

### Component Architecture

1. Task List View (`components/tasks/TaskList.tsx`):
   - Displays tasks in a phase
   - Quick status updates
   - Edit/Delete actions
   - Sorting and filtering

2. Task Create/Edit Forms:
   - Controlled form inputs
   - Team member selection
   - Date picker integration
   - Validation feedback

Example of form field implementation:
```typescript
<Controller
  name="assigneeId"
  control={control}
  defaultValue=""
  render={({ field }) => (
    <Select {...field} label="Assignee">
      <MenuItem value="">None</MenuItem>
      {teamMembers.map((user) => (
        <MenuItem key={user.id} value={user.id}>
          {user.name}
        </MenuItem>
      ))}
    </Select>
  )}
/>
```

### Task Creation Methods

The task management system provides two distinct methods for creating tasks, catering to different user workflows:

1.  **Standalone Task Creation Page**: Accessible via the `/pov/[povId]/phase/[phaseId]/task/new` URL, this page (`app/(authenticated)/pov/[povId]/phase/[phaseId]/task/new/page.tsx`) offers a dedicated, distraction-free environment for creating detailed tasks. It is ideal for users who need to focus on creating complex tasks or prefer direct navigation to a task creation interface.

2.  **Task Creation Dialog**: Integrated within the task list page (`app/(authenticated)/pov/[povId]/phase/[phaseId]/tasks/page.tsx`), this dialog provides a quick and contextual way to add tasks directly within the task list view. It is best suited for users who need to add simple tasks rapidly without navigating away from the task context.

Both methods utilize the reusable `TaskCreate` component (`components/tasks/TaskCreate.tsx`) for the actual task form and creation logic, ensuring consistency and code reuse.

## State Management

### React Query Integration

```typescript
// Fetch tasks for a phase
const { data: tasks } = useQuery({
  queryKey: ['phase', phaseId, 'tasks'],
  queryFn: async () => {
    const response = await fetch(`/api/pov/${povId}/phase/${phaseId}/task`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },
});

// Update task status
const updateTask = useMutation({
  mutationFn: async (data) => {
    const response = await fetch(`/api/pov/${povId}/phase/${phaseId}/task/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['phase', phaseId, 'tasks']);
  },
});
```

## Error Handling

1. API Layer:
   - Consistent error responses
   - HTTP status codes
   - Detailed error messages

2. Frontend Layer:
   - Form validation feedback
   - API error displays
   - Loading states

Example error handling:
```typescript
try {
  const response = await fetch(`/api/pov/${povId}/phase/${phaseId}/task/${taskId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch task');
  }
  return response.json();
} catch (err) {
  setError(err instanceof Error ? err : new Error('An error occurred'));
}
```

## Performance Considerations

1. Data Fetching:
   - React Query for caching
   - Optimistic updates
   - Proper invalidation strategies

2. UI Performance:
   - Virtualization for long lists
   - Debounced search/filter
   - Lazy loading of components

## Task Notifications

### Assignment Notifications

The task management system includes automatic notifications for task assignments:

1. **Notification Triggers**:
   - When a task is initially created with an assignee
   - When an assignee is added to an existing task
   - When a task's assignee is changed

2. **Notification Content**:
   ```typescript
   // Example notification payload
   {
     type: NotificationType.INFO,
     title: 'New Task Assignment',
     message: `Assigned task ${taskTitle} by ${povOwner.name}`,
     userId: assigneeId,
     actionUrl: `/pov/${povId}/phase/${phaseId}/tasks`
   }
   ```

3. **Implementation** (`lib/tasks/services/task.ts`):
   ```typescript
   private static async sendAssigneeNotification(
     taskId: string,
     assigneeId: string,
     taskTitle: string,
     povId: string | null
   ) {
     // Get POV owner's name and task's phase
     const pov = await prisma.pOV.findUnique({
       where: { id: povId },
       include: { owner: { select: { name: true } } }
     });

     const task = await prisma.task.findUnique({
       where: { id: taskId },
       select: { phaseId: true }
     });

     // Create notification with link to task list
     await createNotification({
       type: NotificationType.INFO,
       title: 'New Task Assignment',
       message: `Assigned task ${taskTitle} by ${pov.owner.name}`,
       userId: assigneeId,
       actionUrl: `/pov/${povId}/phase/${task.phaseId}/tasks`
     });
   }
   ```

4. **Error Handling**:
   - Graceful handling of missing POV or phase
   - Non-blocking notification delivery (task operations succeed even if notification fails)
   - Proper error logging for debugging

5. **User Experience**:
   - Notifications appear in the NotificationBell component
   - Clicking notification navigates to the relevant task list
   - Unread notifications are highlighted
   - Notifications can be marked as read individually or all at once

## Future Improvements

Task Creation and Management:

Designed and implemented task creation interface
Added task assignment functionality
Implemented due date management
Created priority system with sorting
Built task list view with filtering
Enhanced task editing functionality
Improved form state management
Added proper data validation
Enhanced error handling and feedback
→ See Task Management Architecture
Task Organization:

Implemented status tracking
Added progress indicators
Created sorting and filtering
Enhanced mobile responsiveness
Added proper error handling
Improved data transformation
Enhanced null/undefined handling
Added detailed error logging
Implemented cache invalidation
Added loading state management
Task Collaboration:

Implemented commenting system
Added file attachments
Created activity feed
Integrated notification system
Enhanced security with RBAC
Improved input sanitization
Added proper date handling
Enhanced API route organization
Added debug logging

1. Task Dependencies:
   - Add support for task relationships
   - Dependency visualization
   - Blocked status automation

2. Advanced Features:
   - Task templates
   - Bulk operations
   - Advanced filtering
   - Task analytics

3. Integration Possibilities:
   - Calendar integration
   - Email notifications
   - External task import/export

## Testing Strategy

1. Unit Tests:
   - Form validation
   - Component rendering
   - Utility functions

2. Integration Tests:
   - API endpoints
   - Form submissions
   - Permission checks

3. E2E Tests:
   - Task creation flow
   - Status updates
   - Team collaboration

## Conclusion

The task management system provides a robust foundation for team collaboration within POVs. Its modular design, strong typing, and comprehensive validation ensure reliability while maintaining flexibility for future enhancements.
