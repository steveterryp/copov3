# Testing Next.js API Routes with Jest: Ultimate Guide v2

This updated guide reflects our latest testing patterns and improvements, particularly focusing on the enhanced test setup, custom matchers, and modular test utilities.

## The Diamond Pattern

The Diamond Pattern is our core testing pattern that ensures proper mock hoisting and type safety. The pattern gets its name from its crystal-clear structure:

```typescript
// 1. Import mock utilities first
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient, Role, PhaseStatus } from '@prisma/client';

// 2. Create mock without type parameter
const prismaMock = mockDeep();

// 3. Mock modules with enums
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  Role: { 
    ADMIN: 'ADMIN',
    USER: 'USER',
    MANAGER: 'MANAGER'
  },
  PhaseStatus: {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
  }
}));

// 4. Mock lib/prisma
jest.mock('../../../../lib/prisma', () => ({
  prisma: prismaMock
}));

// 5. Mock api-handler to return raw handler
jest.mock('../../../../lib/api-handler', () => ({
  createApiHandler: (handlers: any) => {
    return handlers.GET || handlers.POST || handlers.PUT || handlers.DELETE;
  }
}));

// 6. Import everything else
import { mockPrisma, mockDbSuccess } from '../../../../test/setup/prisma';
import { TEST_CONSTANTS } from '../../../../test/setup/config';
import { createTestUser } from '../../../../test/factories';
import { createMockRequest } from '../../../../test/utils';
```

### Why Diamond Pattern?

1. **Mock Hoisting**: Jest hoists mock declarations to the top of the code block
2. **Type Safety**: Ensures proper typing for mocks and test data
3. **Enum Handling**: Properly handles Prisma enums in tests
4. **Module Resolution**: Avoids circular dependencies
5. **Test Isolation**: Keeps mocks contained within test files

## Key Concepts

1. **Test Isolation**
   - Each test file is self-contained
   - Mocks are defined within test files
   - No shared state between tests
   - Clear test boundaries

2. **Type Extensions**
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

3. **Mock Management**
```typescript
// Use mockDb helper for consistent mocking
function mockDb(model: string, operation: string, returnValue: any) {
  const modelMock = (prismaMock as any)[model];
  if (modelMock && typeof modelMock[operation] === 'function') {
    modelMock[operation].mockResolvedValue(returnValue);
  }
}

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  mockReset(prismaMock);
});
```

4. **Test Data Factories**
```typescript
// Create consistent test data
export function createTestUser(overrides = {}) {
  return {
    id: TEST_CONSTANTS.TEST_DATA.USER.ID,
    email: TEST_CONSTANTS.TEST_DATA.USER.EMAIL,
    name: TEST_CONSTANTS.TEST_DATA.USER.NAME,
    role: Role.USER,
    ...overrides,
  };
}
```

5. **Custom Matchers**
```typescript
expect.extend({
  async toHaveValidAuthData(received: NextResponse) {
    const response = received.clone();
    const data = await response.json();
    
    return {
      pass: Boolean(data.user?.id && data.user?.email),
      message: () => 'Expected response to have valid auth data',
    };
  },
});
```

[Rest of the content remains the same...]

## Key Improvements

[Previous sections continue as before...]
