# TypeScript Type System Guidelines

## Recent Improvements (2025-02-15 Update 2)

### 1. JWT Payload Type Safety

#### Token Payload Types
```typescript
// Standardized JWT payload interface
interface TokenPayload {
  userId: string;      // Stored as 'sub' claim in JWT
  email: string;
  role: UserRole;
  exp?: number;        // Expiration time
  iat?: number;        // Issued at time
}

// Type-safe token verification
async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const verified = await jwtVerify(token, accessSecret);
  const { sub: userId, email, role } = verified.payload;
  
  if (!userId || !email || !role) {
    throw new Error('Invalid token payload');
  }

  return {
    userId: userId as string,
    email: email as string,
    role: role as UserRole
  };
}
```

### 2. POV Response Types

#### Response Wrappers
```typescript
// Generic response wrapper
interface ResponseWrapper<T> {
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// POV-specific response types
interface POVResponse {
  data: POVDetails;
}

interface POVListResponse {
  data: POVSummary[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 3. Prisma Type Integration

#### Transaction and Event Handling
- When using Prisma transactions, properly type the transaction parameter:
  ```typescript
  // In handlers
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const [data, count] = await Promise.all([
      tx.someModel.findMany({ /* ... */ }),
      tx.someModel.count({ /* ... */ })
    ]);
    return { data, count };
  });
  ```

- For extending PrismaClient with event handling, use proper event type definitions:
  ```typescript
  interface ExtendedPrismaClient extends PrismaClient {
    $on(event: 'query', listener: (event: { 
      timestamp: Date;
      query: string;
      params: string;
      duration: number;
      target: string 
    }) => void): void;
    $on(event: 'info' | 'warn' | 'error', listener: (event: { 
      timestamp: Date;
      message: string;
      target: string 
    }) => void): void;
  }
  ```

#### Interface Definitions
- Created dedicated interfaces for Prisma types:
  ```typescript
  interface PrismaPhase {
    id: string;
    name: string;
    description: string;
    type: PhaseType;
    startDate: Date;
    endDate: Date;
    order: number;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      assignee: AssigneeInfo | null;
    }>;
  }
  ```

#### Helper Types
- Added utility types for common patterns:
  ```typescript
  interface TeamMember {
    user: {
      id: string;
    };
  }

  interface PhaseWithTasks {
    tasks: Array<{
      id: string;
      status: string;
      assignee: AssigneeInfo | null;
    }>;
    startDate?: Date;
    endDate?: Date;
    type?: PhaseType;
  }
  ```

### 4. Mapper Function Type Safety

#### Parameter Typing
- Added explicit type annotations for callback parameters:
  ```typescript
  function calculateTeamAllocation(povs: ResourceUsageResult[]): ResourceUsageData['team'] {
    const totalMembers = new Set(povs.flatMap(pov => 
      pov.team?.members.map((m: TeamMember) => m.user.id) ?? []
    )).size;
    // ...
  }
  ```

#### Array Operations
- Improved type safety in array operations:
  ```typescript
  // Filter operations
  .filter((task: TaskWithStatus) => task.status === 'COMPLETED')

  // Map operations
  .map((m: TeamMember) => m.user.id)

  // Reduce operations
  .reduce((sum: number, phase: PhaseWithTasks) => 
    sum + phase.tasks.length, 0)
  ```

### 5. Type Guards and Assertions

#### POV Type Guards
```typescript
// Type guard for POV status
function isPOVStatus(status: string): status is POVStatus {
  return Object.values(POVStatus).includes(status as POVStatus);
}

// Type guard for POV metadata
function isPOVMetadata(data: unknown): data is POVMetadata {
  if (!data || typeof data !== 'object') return false;
  const metadata = data as POVMetadata;
  return (
    typeof metadata.customer === 'string' &&
    typeof metadata.teamSize === 'string' &&
    typeof metadata.successCriteria === 'string' &&
    typeof metadata.technicalRequirements === 'string'
  );
}

// Type guard for POV request data
function isValidPOVRequest(data: unknown): data is CreatePOVRequest {
  if (!data || typeof data !== 'object') return false;
  const request = data as CreatePOVRequest;
  return (
    typeof request.title === 'string' &&
    typeof request.description === 'string' &&
    isPOVStatus(request.status) &&
    request.startDate instanceof Date &&
    request.endDate instanceof Date &&
    isPOVMetadata(request.metadata)
  );
}
```

### 6. Error Type Safety

#### API Error Types
```typescript
// Discriminated union for API errors
type APIError =
  | { type: 'VALIDATION'; message: string; fields: Record<string, string> }
  | { type: 'UNAUTHORIZED'; message: string }
  | { type: 'NOT_FOUND'; message: string; resourceId: string }
  | { type: 'SERVER_ERROR'; message: string; code: string };

// Type-safe error handling
function handleApiError(error: unknown): Response {
  if (error instanceof Error) {
    const apiError: APIError = {
      type: 'SERVER_ERROR',
      message: error.message,
      code: 'UNKNOWN_ERROR'
    };
    return NextResponse.json(
      { error: apiError },
      { status: 500 }
    );
  }
  // Handle other error types...
}
```

#### CategoryMap Type Safety
- Added proper type guards for category mapping:
  ```typescript
  const categories = povs.reduce((acc: CategoryMap, pov) => {
    pov.phases.forEach((phase: PhaseWithTasks) => {
      if (phase.type) {
        const phaseType = phase.type;
        acc[phaseType].total++;
      }
    });
    return acc;
  }, {} as CategoryMap);
  ```

#### Null Checks
- Improved null handling with type assertions:
  ```typescript
  const assignees = phase.tasks
    .filter(task => task && task.assignee)
    .map(task => task.assignee!)
    .filter((assignee, index, self) => 
      index === self.findIndex(a => a.id === assignee.id)
    );
  ```

## Best Practices

### 1. Type Definitions
- Keep interfaces close to their usage
- Use explicit types over 'any'
- Leverage TypeScript's type inference when appropriate
- Document complex type relationships

### 2. Type Safety
- Use type guards for runtime checks
- Add explicit type annotations for callbacks
- Avoid type assertions unless necessary
- Handle null/undefined cases explicitly

### 3. Code Organization
- Group related types together
- Keep type definitions close to their implementations
- Use barrel exports for type organization
- Maintain consistent naming conventions

### 4. Performance Considerations
- Use interfaces for better type checking performance
- Avoid excessive type complexity
- Keep type hierarchies shallow when possible
- Use type aliases for complex types

## Implementation Guidelines

### 1. Adding New Types
1. Define interface/type in appropriate location
2. Add necessary type guards
3. Update related function signatures
4. Document type relationships

### 2. Updating Existing Types
1. Check for breaking changes
2. Update all related functions
3. Add migration notes if needed
4. Test type compatibility

### 3. Type Safety Checks
1. Run TypeScript compiler
2. Check for any/unknown usage
3. Verify null/undefined handling
4. Test edge cases

## Maintenance

### Regular Tasks
- [ ] Audit type usage
- [ ] Check for type inconsistencies
- [ ] Update type documentation
- [ ] Review type safety improvements

### Review Guidelines
1. Check type completeness
2. Verify type safety
3. Review type documentation
4. Test type compatibility

## Related Documentation
- [Schema Architecture](./schemaArchitecture.md)
- [API Documentation](./api_refactoring_guide.md)
- [Testing Guidelines](./testingPhases.md)
