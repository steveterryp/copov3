# POV (Point of View) Architecture

## Overview

The POV system is a core component of the application that manages project perspectives, team collaboration, and phase-based workflows. POVs represent high-level project initiatives that can be broken down into phases and tasks.

## Core Components

### Date Handling

POVs use the application's standardized date handling system for managing start and end dates. For detailed information about date handling, timezone support, and formatting, see [Date Handling Architecture](./date-handling-architecture.md).

Key aspects:
- Dates are stored in UTC in the database
- Dates are transmitted as ISO strings in the API
- Frontend displays dates in the user's timezone
- Consistent date formatting through the useDateFormat hook

### Data Model

```prisma
model POV {
  id          String      @id @default(cuid())
  title       String
  description String?
  status      POVStatus   @default(DRAFT)
  priority    Priority    @default(MEDIUM)
  startDate   DateTime
  endDate     DateTime
  ownerId     String
  teamId      String?
  metadata    Json?       // Structured metadata
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  owner       User        @relation(fields: [ownerId], references: [id])
  team        Team?       @relation(fields: [teamId], references: [id])
  phases      Phase[]
}

model Phase {
  id          String      @id @default(cuid())
  name        String
  description String?
  type        PhaseType
  startDate   DateTime
  endDate     DateTime
  order       Int
  povId       String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  pov         POV         @relation(fields: [povId], references: [id])
  tasks       Task[]
}

enum POVStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum PhaseType {
  PLANNING
  RESEARCH
  DESIGN
  DEVELOPMENT
  REVIEW
  DEPLOYMENT
}
```

### Permission System

POVs implement a role-based access control system with team-based permissions:

```typescript
// Permission check example for POV operations
const hasEditPermission = await checkPermission(
  { id: user.userId, role: user.role as UserRole },
  { id: povId, type: ResourceType.POV },
  ResourceAction.EDIT
);
```

Access levels:
- POV owners: Full access to POV and all related resources
- Team members: Can view POV and perform assigned actions
- Admins: Full access to all POVs
- Others: No access

## API Design

### Endpoints Structure

```
/api/pov/
├── GET /                    # List POVs with filtering
├── POST /                   # Create POV
├── GET /[povId]            # Get POV details
├── PUT /[povId]            # Update POV
├── DELETE /[povId]         # Delete POV
├── /[povId]/team/
│   └── GET /available      # Get available users for team selection
└── /[povId]/phase/
    ├── POST /              # Create phase
    ├── PUT /[phaseId]      # Update phase
    ├── DELETE /[phaseId]   # Delete phase
    ├── PUT /reorder        # Reorder phases
    └── POST /multiple      # Delete multiple phases
```

### Request/Response Examples

Get Available Team Members:
```typescript
// GET /api/pov/[povId]/team/available
// Response
{
  data: [
    {
      id: "user_123",
      name: "John Doe",
      email: "john@example.com"
    },
    // ... other available users
  ]
}
```

Update POV with Team Members:
```typescript
// PUT /api/pov/[povId]
// Request body
{
  title: "Updated Project",
  teamMembers: ["user_123", "user_456"], // Array of user IDs
  // ... other POV fields
}

// Response
{
  data: {
    id: "pov_123",
    title: "Updated Project",
    team: {
      id: "team_123",
      members: [
        {
          user: {
            id: "user_123",
            name: "John Doe",
            // ... other user fields
          },
          role: "MEMBER"
        },
        // ... other team members
      ]
    },
    // ... other POV fields
  }
}
```

Create POV:
```typescript
// POST /api/pov
// Request body
{
  title: "New Project Initiative",
  description: "Strategic project for Q1",
  status: "DRAFT",
  priority: "HIGH",
  startDate: "2025-02-01T00:00:00Z",
  endDate: "2025-03-31T00:00:00Z",
  metadata: {
    customer: "ACME Corp",
    teamSize: "5",
    successCriteria: "Increase efficiency by 30%",
    technicalRequirements: "Cloud infrastructure\nAPI integration"
  }
}

// Response
{
  data: {
    id: "pov_123",
    title: "New Project Initiative",
    // ... other fields including team info
  }
}
```

## Service Layer Architecture

### Core Services

1. Team Service (`services/team.ts`):
   ```typescript
   export class TeamService {
     static async createTeam(data: { name: string; ownerId: string }): Promise<Team>;
     static async addMember(data: { teamId: string; userId: string; role?: TeamRole }): Promise<void>;
     static async removeMember(data: { teamId: string; userId: string }): Promise<void>;
   }
   ```

2. Metadata Service (`services/metadata.ts`):
   ```typescript
   export class MetadataService {
     static validateMetadata(metadata: POVMetadata): boolean;
     static normalizeMetadata(metadata: POVMetadata): POVMetadata;
     static parseSuccessCriteria(criteria: string): string[];
   }
   ```

3. Activity Service (`services/activity.ts`):
   ```typescript
   export class ActivityService {
     static async logStatusChange(data: StatusChangeData): Promise<void>;
     static async logPhaseAdded(data: PhaseData): Promise<void>;
     static async logTeamMemberAdded(data: TeamMemberData): Promise<void>;
   }
   ```

### Data Mapping Layer

```typescript
// prisma/mappers.ts
export function mapPOVDetailsFromPrisma(pov: PrismaPOV): POVDetails {
  return {
    ...mapPOVFromPrisma(pov),
    phases: pov.phases?.map(mapPhaseDetailsFromPrisma),
    totalTasks: calculateTotalTasks(pov),
    completedTasks: calculateCompletedTasks(pov),
    overallProgress: calculateProgress(pov),
  };
}
```

## Frontend Implementation

### POV Creation Method

The application provides a dedicated page for creating new POVs. This page is accessible via the `/pov/create` route and is implemented in the `app/(authenticated)/pov/create/page.tsx` file.  This page offers a form-based interface for users to input all necessary POV details, providing a focused and distraction-free environment for POV creation.  Currently, this dedicated page is the primary method for creating POVs within the application.

### Form Management

Using react-hook-form with zod validation:

```typescript
const povSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.nativeEnum(POVStatus),
  priority: z.nativeEnum(Priority),
  startDate: z.date(),
  endDate: z.date(),
  metadata: z.object({
    customer: z.string(),
    teamSize: z.string(),
    successCriteria: z.string(),
    technicalRequirements: z.string(),
  }),
});
```

### Component Architecture

1. POV List View:
   ```typescript
   // components/pov/POVList.tsx
   export function POVList() {
     const { data: povs } = usePOVs();
     return (
       <div>
         {povs.map(pov => (
           <POVCard
             key={pov.id}
             pov={pov}
             onStatusChange={handleStatusChange}
           />
         ))}
       </div>
     );
   }
   ```

2. Team Member Selection:
   ```typescript
   // components/pov/TeamMemberSelect.tsx
   export function TeamMemberSelect({ povId }: { povId: string }) {
     const { data: availableUsers } = useQuery({
       queryKey: ['pov', povId, 'available-users'],
       queryFn: async () => {
         const response = await fetch(`/api/pov/${povId}/team/available`);
         if (!response.ok) throw new Error('Failed to fetch available users');
         return response.json();
       },
     });

     return (
       <Autocomplete
         multiple
         value={selectedTeamMembers}
         onChange={(_, newValue) => setSelectedTeamMembers(newValue)}
         options={availableUsers || []}
         getOptionLabel={(option) => option.name}
         renderInput={(params) => (
           <TextField
             {...params}
             label="Team Members"
             placeholder="Select team members"
           />
         )}
         renderTags={(value, getTagProps) =>
           value.map((option, index) => (
             <Chip
               key={option.id}
               label={option.name}
               {...getTagProps({ index })}
             />
           ))
         }
       />
     );
   }
   ```

3. Phase Management:
   ```typescript
   // components/pov/PhaseList.tsx
   export function PhaseList({ povId }: { povId: string }) {
     const { phases, reorderPhases } = usePhases(povId);
     return (
       <DragDropContext onDragEnd={handleDragEnd}>
         <PhaseContainer>
           {phases.map(phase => (
             <PhaseCard key={phase.id} phase={phase} />
           ))}
         </PhaseContainer>
       </DragDropContext>
     );
   }
   ```

## State Management

### React Query Integration

```typescript
// hooks/usePOV.ts
export function usePOV(povId: string) {
  return useQuery({
    queryKey: ['pov', povId],
    queryFn: async () => {
      const response = await fetch(`/api/pov/${povId}`);
      if (!response.ok) throw new Error('Failed to fetch POV');
      return response.json();
    },
  });
}

// hooks/usePhases.ts
export function usePhases(povId: string) {
  const queryClient = useQueryClient();
  
  const reorderMutation = useMutation({
    mutationFn: async (phases: PhaseOrder[]) => {
      const response = await fetch(`/api/pov/${povId}/phase/reorder`, {
        method: 'PUT',
        body: JSON.stringify({ phases }),
      });
      if (!response.ok) throw new Error('Failed to reorder phases');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pov', povId, 'phases']);
    },
  });
}
```

## Error Handling

1. Service Layer:
   ```typescript
   export class ValidationService {
     static validatePhaseDates(
       startDate: Date,
       endDate: Date,
       povStartDate: Date,
       povEndDate: Date
     ): { isValid: boolean; errors: string[] } {
       const errors = [];
       if (startDate < povStartDate) {
         errors.push('Phase cannot start before POV start date');
       }
       return { isValid: errors.length === 0, errors };
     }
   }
   ```

2. API Layer:
   ```typescript
   try {
     const validation = await ValidationService.validatePOVUpdate(povId, data);
     if (!validation.isValid) {
       throw new Error(validation.errors.join(', '));
     }
   } catch (error) {
     return NextResponse.json(
       { error: error.message },
       { status: 400 }
     );
   }
   ```

## Performance Considerations

1. Data Loading:
   - Paginated POV list with filters
   - Optimistic updates for phase reordering
   - Cached team member data

2. UI Optimizations:
   - Virtualized phase lists for large POVs
   - Lazy loaded task details
   - Debounced metadata updates

## Testing Strategy

1. Unit Tests:
   ```typescript
   describe('ValidationService', () => {
     it('validates phase dates correctly', () => {
       const result = ValidationService.validatePhaseDates(
         new Date('2025-02-01'),
         new Date('2025-02-28'),
         new Date('2025-01-01'),
         new Date('2025-03-31')
       );
       expect(result.isValid).toBe(true);
     });
   });
   ```

2. Integration Tests:
   - POV CRUD operations
   - Phase management
   - Team collaboration flows

3. E2E Tests:
   - Complete POV lifecycle
   - Phase reordering
   - Team member management

## Future Improvements

1. Enhanced Collaboration:
   - Real-time updates using WebSocket
   - In-POV commenting system
   - Activity feed

2. Advanced Features:
   - POV templates
   - Phase templates
   - Custom metadata fields
   - Advanced reporting

3. Integration Options:
   - Calendar integration
   - Document management
   - External tool synchronization

## Conclusion

The POV system provides a robust foundation for project management with strong typing, comprehensive validation, and efficient data handling. Its modular architecture allows for easy extension and maintenance while ensuring data integrity and user experience.
