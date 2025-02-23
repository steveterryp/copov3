# Testing Next.js API Routes with Jest: Auth System Testing Guide

This guide demonstrates how to effectively test Next.js API routes, particularly focusing on authentication endpoints that use Prisma as the ORM. The approach shown here achieved successful testing of login, registration, and logout functionality.

## Journey to Success

When implementing the auth tests, we considered three potential paths:

1. **Self-Contained Test Mocking** (90% success probability)
   - Approach: Keep all mocking logic within the test file, including Prisma and JWT mocks
   - Pros: Complete control over test environment, no external dependencies
   - Cons: Some code duplication between test files
   - Why it won: Highest probability of success, easiest to maintain and debug

2. **Manual Mocks with __mocks__ Directory** (70% success probability)
   - Approach: Use Jest's manual mocks system with a __mocks__ directory
   - Pros: More reusable mocks, follows Jest conventions
   - Cons: Complex setup, potential module resolution issues
   - Why we didn't choose it: More complex to set up and maintain

3. **Babel Configuration for Module Resolution** (50% success probability)
   - Approach: Configure Babel to handle module resolution and mocking
   - Pros: Most "correct" solution according to testing best practices
   - Cons: Complex configuration, might introduce new issues
   - Why we didn't choose it: Too complex with lower probability of success

We chose Path 1 because it provided the highest probability of success while maintaining code clarity and ease of maintenance. This decision proved correct as it led to all auth tests passing successfully.

## Key Concepts

1. **Jest Hoisting**: Jest hoists mock declarations to the top of the code block. Therefore, all mock declarations must come before any imports.
2. **Self-Contained Tests**: Keep all mocking logic within the test file to avoid module resolution issues.
3. **Prisma Mocking**: Use jest-mock-extended to create a deep mock of the Prisma client.

## Implementation

### 1. Required Dependencies

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.5",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "jest-mock-extended": "^3.0.4",
    "ts-jest": "^29.1.0"
  }
}
```

### 2. Test File Structure

Here's the winning structure for auth testing (e.g., `auth.test.ts`):

```typescript
import { mockDeep, mockReset } from 'jest-mock-extended';

// Create Prisma mock
const prismaMock = mockDeep();

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => prismaMock),
  Role: {
    ADMIN: 'ADMIN',
    USER: 'USER',
    MANAGER: 'MANAGER'
  }
}));

// Mock lib/prisma
jest.mock('../../../../lib/prisma', () => ({
  prisma: prismaMock
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'test-token'),
  verify: jest.fn(),
}));

// Now import everything else
import { POST as loginHandler } from '../login/route';
import { POST as registerHandler } from '../register/route';
import { POST as logoutHandler } from '../logout/route';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { apiTest, createTestRefreshToken, TEST_CONSTANTS } from '@/test/setup';
import { createTestUser } from '@/test/factories';

// Helper function to mock database operations
function mockDb(model: string, operation: string, returnValue: any) {
  const modelMock = prismaMock[model as keyof typeof prismaMock] as any;
  if (modelMock && typeof modelMock[operation] === 'function') {
    modelMock[operation].mockResolvedValue(returnValue);
  }
}
```

### 3. Test Examples

Here are examples of how to structure different types of auth tests:

```typescript
describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const testUser = createTestUser();
      mockDb('user', 'findUnique', testUser);
      mockDb('refreshToken', 'create', createTestRefreshToken(testUser.id));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (sign as jest.Mock).mockReturnValue('test-token');

      const req = apiTest.createRequest({
        method: 'POST',
        path: '/auth/login',
        body: {
          email: TEST_CONSTANTS.TEST_DATA.USER.EMAIL,
          password: TEST_CONSTANTS.TEST_DATA.USER.PASSWORD,
        },
      });

      const response = await loginHandler(req);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.user.email).toBe(testUser.email);
    });
  });

  // Similar structure for register and logout tests
});
```

### 4. Jest Configuration

Create a `jest.config.ts` file with these key settings:

```typescript
import type { Config } from 'jest';
import { defaults } from 'jest-config';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        isolatedModules: true,
      }
    ]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-mock-extended)/)',
  ],
};

export default config;
```

### 5. Test Utilities

Create helper functions for common test operations:

```typescript
// apiTest utility for creating test requests
export const apiTest = {
  createRequest: (options: {
    method: string;
    path: string;
    body?: any;
    cookies?: Record<string, string>;
  }): Request => {
    const url = `http://localhost:3000/api${options.path}`;
    const init: RequestInit = {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    };

    return new Request(url, init);
  }
};

// Test data creator
export function createTestUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    ...overrides,
  };
}
```

## Best Practices

1. **Mock Order**: Always declare mocks before imports to handle Jest hoisting correctly.
2. **Reset State**: Use `beforeEach` to reset mocks and clear any stored state.
3. **Isolation**: Keep mocking logic self-contained within test files.
4. **Type Safety**: Use TypeScript to ensure type safety in mocks and tests.
5. **Error Cases**: Test both success and error scenarios thoroughly.

## Common Pitfalls to Avoid

1. **Module Resolution**: Don't rely on external mock files; keep mocks in the test file.
2. **Mock Hoisting**: Don't use mocked variables before their declaration.
3. **Async Operations**: Always await async operations and handle promises properly.
4. **State Leakage**: Reset mocks and state in beforeEach to prevent test contamination.

## Running Tests

Run specific test files:
```bash
npm test path/to/test/file.test.ts
```

Run all tests:
```bash
npm test
```

This approach successfully tested all auth endpoints including login, registration, and logout functionality, with both success and error cases properly covered.
