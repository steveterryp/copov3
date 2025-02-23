# Testing Next.js API Routes with Jest: Ultimate Guide

This guide demonstrates how to effectively test Next.js API routes with Jest, particularly focusing on complex scenarios involving Prisma, enums, and type extensions. This approach has been battle-tested across authentication, phase management, and PoV overview features.

## Test Types

### Unit Tests vs Integration Tests

1. **Unit Tests**
```typescript
// Mock only what you need
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  Role: { ADMIN: 'ADMIN' }
}));

// Focus on single operation
it('should reorder tasks', async () => {
  mockDb('task', 'findMany', tasks);
  // Test single operation
});
```

2. **Integration Tests**
```typescript
// Mock complete system behavior
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

// Test complete flow
it('should register user', async () => {
  // Mock exact response shape
  mockDbSuccess('user', 'create', {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
  });

  // Verify exact fields
  expect(mockPrisma.user.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      email: 'test@example.com',
      name: 'Test User',
    }),
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
});
```

## The Diamond Pattern

The key to successful testing lies in the precise ordering of imports, mocks, and type declarations. We call this the "Diamond Pattern" due to its crystal-clear structure:

```typescript
// 1. Import mock utilities
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient, Role, TeamRole, ... } from '@prisma/client';

// 2. Create mock without type parameter
const prismaMock = mockDeep();

// 3. Mock modules with enums
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),  // Simplified mock
  Role: { ADMIN: 'ADMIN', ... },
  TeamRole: { LEAD: 'LEAD', ... }
}));

// 4. Mock lib/prisma
jest.mock('path/to/lib/prisma', () => ({
  prisma: prismaMock
}));

// 5. Import everything else
import { createTestUser, ... } from 'test/factories';
```

## Key Concepts

1. **Mock Order**: Jest hoists mock declarations, so order is critical
2. **Type Extensions**: Extend Prisma types for additional properties
3. **Type Assertions**: Use string literals with type assertions for enums
4. **Database Operations**: Use mockDb helper instead of direct Prisma calls
5. **Test Scope**: Choose between unit and integration tests based on needs
6. **Implementation Matching**: Always verify actual code behavior before writing tests

## Implementation

### 1. Setting Up the Test Environment

```typescript
// Helper function for database operations
function mockDb(model: string, operation: string, returnValue: any) {
  const modelMock = (prismaMock as any)[model];
  if (modelMock && typeof modelMock[operation] === 'function') {
    modelMock[operation].mockResolvedValue(returnValue);
  }
}

// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    status: 200,
    json: () => Promise.resolve({ data: {} }),
  })
) as jest.Mock;
```

### 2. Handling Extended Types

```typescript
// Extend Prisma types for additional properties
type PoVWithProgress = PoV & {
  progress: number;
  phases?: Array<{ id: string; status: PhaseStatus }>;
};

// Use type assertions with custom types
const povs = [{
  ...testPoV,
  progress: 33,
}] as PoVWithProgress[];
```

### 3. Working with Enums

```typescript
// Define enums in mock
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  Role: {
    ADMIN: 'ADMIN',
    USER: 'USER',
    MANAGER: 'MANAGER'
  },
  TeamRole: {
    LEAD: 'LEAD',
    MEMBER: 'MEMBER'
  }
}));

// Use string literals with type assertions
const user = createTestUser({
  role: 'MANAGER' as Role,
  // ...
});

const teamMember = {
  role: 'LEAD' as TeamRole,
  // ...
};
```

### 4. Integration Test Structure

```typescript
describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle registration', async () => {
    // 1. Check actual implementation first
    // In route.ts:
    // const user = await prisma.user.create({
    //   data: { email, name },
    //   select: { id: true, email: true, name: true }
    // });

    // 2. Mock exact response shape
    mockDbSuccess('user', 'create', {
      id: 'test-id',
      email: 'test@example.com',
      name: 'Test User',
    });

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    });

    // 3. Verify exact implementation
    expect(response.status).toBe(201);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
        name: 'Test User',
      }),
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  });
});
```

### 5. Unit Test Structure

```typescript
describe('API Feature', () => {
  let testUser: User;
  let accessToken: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockReset(prismaMock);
    (global.fetch as jest.Mock).mockClear();

    // Create test user
    testUser = createTestUser({
      role: 'MANAGER' as Role,
      email: 'test@example.com',
      name: 'Test User',
    });

    // Mock user creation
    mockDb('user', 'create', testUser);

    // Generate tokens
    const { accessToken: token } = await generateTokens({
      id: testUser.id,
      email: testUser.email,
      role: testUser.role,
    });

    accessToken = token;
  });

  describe('Feature Operation', () => {
    it('should perform operation successfully', async () => {
      // Mock single operation
      mockDb('model', 'operation', returnValue);

      // Test specific functionality
      const response = await fetch('/api/endpoint');
      expect(response.status).toBe(200);
    });
  });
});
```

## Best Practices

1. **Test Scope**:
   - Use unit tests for isolated functionality
   - Use integration tests for complete flows
   - Mock appropriate dependencies for each type

2. **Mock Order**:
   - Import mock utilities first
   - Create mock before any jest.mock declarations
   - Define all enums in the mock
   - Import everything else last

3. **Type Safety**:
   - Use custom types to extend Prisma models
   - Use type assertions for enum values
   - Keep type definitions close to usage

4. **Database Operations**:
   - Use mockDb helper for unit tests
   - Use complete mock objects for integration tests
   - Reset mocks between tests

5. **API Testing**:
   - Mock fetch responses for each test
   - Include error cases
   - Test authentication and authorization
   - Verify response shapes

6. **Implementation Matching**:
   - Always check actual code implementation first
   - Mock exact response shapes
   - Verify exact fields and operations
   - Don't test operations that don't exist

## Common Pitfalls to Avoid

1. **Mock Timing**: Don't import anything before creating mocks
2. **Direct Prisma Usage**: Always use mockDb instead of direct Prisma calls
3. **Type Assertions**: Use string literals with type assertions for enums
4. **Missing Properties**: Extend types when adding new properties
5. **Incomplete Mocks**: Mock all necessary database operations
6. **Wrong Test Type**: Don't mix unit and integration test approaches
7. **Incorrect Expectations**: Don't test operations that don't exist in the actual code
8. **Over-mocking**: Only mock what's actually used in the implementation

## Running Tests

```bash
# Run all API tests
npm test -- "app/api/.*\.test\.(ts|tsx)?"

# Run integration tests
npm test -- "test/integration/.*\.test\.(ts|tsx)?"

# Run specific test file
npm test path/to/test/file.test.ts

# Run with verbose output
npm test -- "app/api/.*\.test\.(ts|tsx)?" --verbose
```

This approach has successfully tested complex features including:
- Authentication (login, registration, logout)
- Phase Management (creation, updates, reordering)
- PoV Overview (progress tracking, team management)
- Task Management (creation, updates, reordering)

By following these patterns, choosing the appropriate test type, and always matching your test expectations to actual implementations, you can achieve reliable and maintainable tests for your Next.js API routes.
