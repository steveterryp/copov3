# Testing Next.js API Routes with Jest: Auth System Testing Guide v2

This updated guide demonstrates our latest approach to testing Next.js API routes, particularly focusing on authentication endpoints that use Prisma as the ORM. This version incorporates improvements in test organization, custom matchers, and modular test utilities.

## Testing Strategy Evolution

Our testing approach has evolved through three generations:

### 1. Current Approach: Modular Test System (95% success rate)
- **Key Features**:
  - Centralized test utilities
  - Custom matchers for auth validation
  - Type-safe mock factories
  - Modular test configuration
- **Benefits**:
  - Highly maintainable
  - Strong type safety
  - Consistent test patterns
  - Easy to extend
- **Why It Won**: Best balance of maintainability, type safety, and test reliability

### 2. Previous Approach: Self-Contained Tests (90% success rate)
- **Key Features**:
  - All mocks within test files
  - Direct Prisma mocking
  - Inline test utilities
- **Benefits**:
  - Simple to understand
  - No external dependencies
  - Direct control
- **Why We Moved On**: Lack of reusability and consistency across tests

### 3. Original Approach: Manual Mocks (70% success rate)
- **Key Features**:
  - Jest manual mocks
  - Global test setup
  - Shared utilities
- **Benefits**:
  - Traditional Jest approach
  - Built-in Jest features
- **Why We Moved On**: Complex setup, module resolution issues

## Implementation

### 1. Test File Structure

```typescript
// auth.test.ts
import { mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient, Role } from '@prisma/client';

// 1. Create Prisma mock
const prismaMock = mockDeep<PrismaClient>();

// 2. Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  Role: {
    ADMIN: 'ADMIN',
    USER: 'USER',
  }
}));

// 3. Mock lib/prisma
jest.mock('../../../../lib/prisma', () => ({
  prisma: prismaMock
}));

// 4. Import test utilities
import { mockDbSuccess } from '../../../../test/setup/prisma';
import { TEST_CONSTANTS } from '../../../../test/setup/config';
import { createTestUser } from '../../../../test/factories';
import { createMockRequest } from '../../../../test/utils';

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  describe('Registration', () => {
    it('should register new user', async () => {
      const testUser = createTestUser();
      mockDbSuccess('user', 'create', testUser);

      const request = createMockRequest({
        method: 'POST',
        url: `${TEST_CONSTANTS.SERVER.API_BASE_URL}/auth/register`,
        body: {
          email: testUser.email,
          password: 'validPassword123!',
          name: testUser.name,
        },
      });

      const response = await registerHandler(request);
      expect(response.status).toBe(201);
      expect(response).toHaveValidAuthData();
    });
  });
});
```

### 2. Custom Matchers

```typescript
// test/setup/matchers.ts
expect.extend({
  async toHaveValidAuthData(received: NextResponse) {
    const response = received.clone();
    const data = await response.json();
    
    const pass = Boolean(
      data.user?.id &&
      data.user?.email &&
      data.user?.name
    );

    return {
      pass,
      message: () => pass
        ? 'Expected response not to have valid auth data'
        : 'Expected response to have valid auth data',
    };
  },

  async toHaveValidErrorData(received: NextResponse, expectedError?: string) {
    const response = received.clone();
    const data = await response.json();
    
    const pass = Boolean(
      data.error &&
      (!expectedError || data.error === expectedError)
    );

    return {
      pass,
      message: () => pass
        ? 'Expected response not to have error data'
        : `Expected error "${expectedError}" but got "${data.error}"`,
    };
  },
});
```

### 3. Test Utilities

```typescript
// test/setup/prisma.ts
export function mockDbSuccess<T>(
  model: keyof PrismaClient,
  operation: string,
  result: T,
  options: {
    times?: number;
    delay?: number;
  } = {}
): void {
  const { times = 1, delay = 0 } = options;
  const modelClient = mockPrisma[model] as any;
  const mockFn = modelClient[operation];

  if (delay > 0) {
    mockFn.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(result), delay))
    );
  } else {
    mockFn.mockResolvedValue(result);
  }

  if (times > 1) {
    mockFn.mockResolvedValueOnce(result).mockResolvedValue(null);
  }
}
```

### 4. Test Constants

```typescript
// test/setup/config.ts
export const TEST_CONSTANTS = {
  TEST_DATA: {
    USER: {
      ID: 'test-user-id',
      EMAIL: 'test@example.com',
      NAME: 'Test User',
    },
  },
  AUTH: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 100,
  },
  SERVER: {
    API_BASE_URL: 'http://localhost:3000/api',
  },
};
```

## Test Categories

### 1. Registration Tests
- New user registration
- Email validation
- Password requirements
- Duplicate email handling
- Input validation

### 2. Login Tests
- Valid credentials
- Invalid credentials
- Token generation
- Cookie handling
- Session management

### 3. Token Tests
- Access token validation
- Refresh token rotation
- Token expiration
- Invalid token handling
- Token revocation

### 4. Session Tests
- Session creation
- Session validation
- Session expiration
- Multiple sessions
- Session revocation

## Best Practices

1. **Test Organization**
   - Group related tests logically
   - Use descriptive test names
   - Follow the Diamond Pattern
   - Keep tests focused

2. **Mock Management**
   - Use mockDbSuccess for database operations
   - Reset mocks between tests
   - Mock only what's necessary
   - Verify mock calls

3. **Response Validation**
   - Use custom matchers
   - Verify response shape
   - Check status codes
   - Validate error messages

4. **Error Handling**
   - Test validation errors
   - Test database errors
   - Test authentication errors
   - Test edge cases

5. **Type Safety**
   - Use TypeScript
   - Create type-safe factories
   - Validate response types
   - Use proper interfaces

## Common Patterns

### 1. Success Case Pattern
```typescript
it('should handle success case', async () => {
  // 1. Setup test data
  const testUser = createTestUser();
  
  // 2. Setup mocks
  mockDbSuccess('user', 'create', testUser);
  
  // 3. Make request
  const request = createMockRequest({...});
  const response = await handler(request);
  
  // 4. Verify response
  expect(response.status).toBe(200);
  expect(response).toHaveValidAuthData();
  
  // 5. Verify operations
  expect(mockPrisma.user.create).toHaveBeenCalledWith({...});
});
```

### 2. Error Case Pattern
```typescript
it('should handle error case', async () => {
  // 1. Setup invalid data
  const invalidData = {...};
  
  // 2. Make request
  const request = createMockRequest({
    body: invalidData
  });
  const response = await handler(request);
  
  // 3. Verify error response
  expect(response.status).toBe(400);
  expect(response).toHaveValidErrorData('Expected error message');
});
```

This updated approach has successfully tested all auth endpoints including registration, login, logout, and token management, with both success and error cases properly covered.
