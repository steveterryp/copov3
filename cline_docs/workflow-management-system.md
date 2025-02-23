# Workflow Management System

## Overview

The Workflow Management System provides a comprehensive solution for managing phase types and their associated workflows. It enables administrators to configure, edit, and manage different phases of the POV process through a user-friendly interface.

### Phase Hierarchy

The system follows a three-level hierarchy:

1. **Phase**
   - Top-level container representing a major POV stage (e.g., Planning, Execution)
   - Has its own timeline (start/end dates)
   - Contains multiple stages
   - Managed in `/lib/pov/phase/` - handles individual phase operations

2. **Stage**
   - Subdivision of a phase
   - Groups related tasks together
   - Has dependencies on other stages
   - Managed within phase workflows

3. **Task**
   - Atomic unit of work
   - Belongs to a stage
   - Has dependencies on other tasks
   - Includes validation and completion rules

### Directory Structure

The system uses two main directories for phase management:

1. `/lib/pov/phases/`
   - Handles multiple phases (plural)
   - Manages phase collections and relationships
   - Contains workflow configuration
   - Responsible for:
     - Phase ordering
     - Phase type management
     - Workflow templates
     - Phase transitions

2. `/lib/pov/phase/`
   - Handles individual phase (singular)
   - Manages single phase operations
   - Contains phase-specific logic
   - Responsible for:
     - Phase status
     - Stage management
     - Task tracking
     - Timeline management

This separation allows for clear separation of concerns:
- Phases (plural) handles the relationships and workflows between phases
- Phase (singular) handles the internal operations of a single phase

### Key Features
- Grid-based workflow visualization
- Dynamic stage and task management
- Dependency tracking
- Real-time validation
- Immediate user feedback
- Admin-only access control

## Frontend Implementation

### 1. Workflow Page (`app/(authenticated)/admin/team/phases/workflow/page.tsx`)

#### Features
- Responsive grid layout for phase types
- Real-time data management with React Query
- Loading skeletons for better UX
- Toast notifications for user feedback
- Error handling with Alert components

#### Key Components
```typescript
interface WorkflowListProps {
  workflows: {
    type: PhaseType;
    stages: WorkflowStage[];
  }[];
  onEdit: (workflow: { type: PhaseType; stages: WorkflowStage[] }) => void;
}
```

### 2. Workflow Edit Modal (`components/admin/phases/WorkflowEditModal.tsx`)

#### Features
- Form management with react-hook-form
- Zod schema validation
- Dynamic field arrays for stages
- TypeScript type safety

#### Implementation
```typescript
interface WorkflowFormData {
  type: PhaseType
  stages: WorkflowStage[]
}
```

### 3. Task Editor (`components/admin/phases/TaskEditor.tsx`)

#### Features
- Complex form field management
- Task dependency configuration
- Required/optional task toggles
- Nested form arrays

#### Key Interfaces
```typescript
interface TaskEditorProps {
  control: Control<WorkflowFormData>
  stageIndex: number
  onRemove: () => void
}
```

## Backend Implementation

### 1. API Routes

#### GET `/api/admin/team/phases/workflow`
- Retrieves all workflow configurations
- Admin permission check
- Error handling

#### PUT `/api/admin/team/phases/workflow`
- Updates workflow configuration
- Validates request body
- Admin permission check
- Error handling

### 2. Schema Validation (`route.config.ts`)

#### Task Schema
```typescript
const taskSchema = z.object({
  key: z.string().min(1, "Key is required"),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  required: z.boolean().default(false),
  dependencies: z.array(z.string()).optional(),
})
```

#### Stage Schema
```typescript
const stageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tasks: z.array(taskSchema),
  dependencies: z.array(z.string()).optional(),
})
```

#### Workflow Schema
```typescript
const workflowSchema = z.object({
  type: z.nativeEnum(PhaseType),
  stages: z.array(stageSchema),
})
```

## Usage Guide

### Managing Workflows

1. **Viewing Workflows**
   - Navigate to the workflow management page
   - View all phase types in a grid layout
   - See number of stages and tasks for each phase type

2. **Editing Workflows**
   - Click "Edit" on any phase type card
   - Modal opens with current configuration
   - Add/remove stages and tasks
   - Configure dependencies
   - Save changes with immediate feedback

3. **Adding Stages**
   - Click "Add Stage" in edit modal
   - Configure stage name and description
   - Add tasks to the stage
   - Set dependencies if needed

4. **Managing Tasks**
   - Add tasks within stages
   - Configure task key, label, and description
   - Set required/optional status
   - Define task dependencies

## Technical Details

### Type Safety
- Full TypeScript implementation
- Zod schema validation
- Proper type definitions for all components

### Form Management
- react-hook-form for form state
- Dynamic field arrays
- Nested form structures
- Real-time validation

### Error Handling
- Custom ApiError class
- User-friendly error messages
- Toast notifications
- Loading states

### Performance
- Optimistic updates
- Proper loading states
- Efficient form rendering
- Minimal re-renders

## Security

### Permission System
- Admin-only access
- Role-based authorization
- Proper error handling for unauthorized access

### Validation
- Server-side schema validation
- Client-side form validation
- Type checking
- Input sanitization

## Testing Guide

### Prerequisites
- Admin user account (admin@example.com / admin123)
- Access to the admin dashboard

### Accessing the Workflow Management System
1. Log in as an admin user
2. Navigate to Admin Dashboard (Team Management)
3. Click on "Workflow Management" card
4. You should see the grid layout of all phase types

### Testing Workflow Configuration

1. **Viewing Phase Types**
   - Verify all phase types are displayed in the grid
   - Each card should show:
     - Phase type name
     - Number of stages
     - Edit button

2. **Creating a New Workflow**
   - Click "Edit" on a phase type without stages
   - Click "Add Stage" button
   - Fill in required fields:
     - Stage Name (e.g., "Requirements Gathering")
     - Stage Description (optional)
   - Add tasks to the stage:
     - Click "Add Task"
     - Fill in task details:
       - Key (e.g., "req-doc")
       - Label (e.g., "Create Requirements Document")
       - Description (optional)
       - Required/Optional toggle
   - Save changes
   - Verify toast notification appears
   - Verify grid updates with new stage count

3. **Editing Existing Workflow**
   - Click "Edit" on a phase type with stages
   - Modify existing stage:
     - Update stage name/description
     - Add/remove tasks
     - Update task details
   - Save changes
   - Verify changes persist
   - Verify toast notification

4. **Testing Validation**
   - Try saving without required fields:
     - Empty stage name
     - Empty task key/label
   - Verify validation errors appear
   - Verify form prevents submission

5. **Testing Permissions**
   - Log out of admin account
   - Log in as regular user
   - Verify workflow management is not accessible
   - Verify API returns 403 for non-admin access

### Troubleshooting Common Issues

1. **Loading Issues**
   - Clear browser cache
   - Verify network connectivity
   - Check browser console for errors

2. **Permission Errors**
   - Verify user has admin role
   - Check token expiration
   - Clear cookies and re-login

3. **Save Failures**
   - Check network tab for request details
   - Verify payload format
   - Check server logs for errors

### Verification Checklist

- [ ] All phase types displayed correctly
- [ ] Can create new workflow stages
- [ ] Can add tasks to stages
- [ ] Required field validation works
- [ ] Changes persist after refresh
- [ ] Non-admin users cannot access
- [ ] Toast notifications work
- [ ] Loading states display correctly
- [ ] Error states handle gracefully

## Future Enhancements

1. **Workflow Templates**
   - Save common workflows as templates
   - Quick workflow application
   - Template management

2. **Advanced Dependencies**
   - Visual dependency graph
   - Circular dependency detection
   - Dependency validation

3. **Audit Trail**
   - Track workflow changes
   - Change history
   - User attribution

4. **Performance Optimization**
   - Caching strategies
   - Lazy loading
   - Bundle optimization
