# Type System Guidelines and Best Practices

[← Back to Documentation Index](./README.md)

## Quick Links
- [Technical Learnings](./technicalLearnings.md)
- [Tech Stack Details](./techStack.md)
- [Current Task Status](./currentTask.md)

## Core Principles
→ See [Technical Learnings - Type System Architecture](./technicalLearnings.md#type-system-architecture)

### 1. Null vs Undefined
```typescript
// Good - undefined for optional properties
interface User {
  id: string;
  email: string;
  name?: string;  // undefined when not provided
}

// Good - null for intentionally empty values
interface DatabaseRecord {
  id: string;
  deletedAt: Date | null;  // explicitly set to null when deleted
}
```
→ See [Current Task - Key Learnings](./currentTask.md#type-system-best-practices)

### 2. API Response Types
```typescript
// Generic response type with proper error handling
interface ApiResponseWithHeaders<T> {
  data?: T;  // Optional to support error responses
  status: number;
  headers: Record<string, string | string[]>;
  error?: string;
  code?: string;
  errors?: Record<string, string[]>;
  message?: string;
  validationErrors?: Record<string, string[]>;
}

// Usage example
type UserResponse = ApiResponseWithHeaders<User>;
```
→ See [Technical Learnings - API Response Types](./technicalLearnings.md#1-api-response-types)

### 3. Type Extension
```typescript
// Extending third-party types
interface TokenPayload extends JWTPayload {
  [key: string]: unknown;  // maintain index signature
  userId: string;
  role?: Role;
  // Add custom properties after index signature
}
```
→ See [Technical Learnings - Authentication Types](./technicalLearnings.md#2-authentication-types)

## Testing Types
→ See [Technical Learnings - Testing Infrastructure](./technicalLearnings.md#testing-infrastructure)

### 1. Custom Matchers
```typescript
// Proper Jest type declarations
declare namespace jest {
  // For asymmetric matchers (expect.xxx)
  interface AsymmetricMatchers {
    toHaveValidAuthData(): void;
    toHaveValidErrorData(expectedError?: string): void;
  }

  // For regular matchers (expect().xxx)
  interface Matchers<R, T = unknown> {
    toHaveValidAuthData(): Promise<R>;
    toHaveValidErrorData(expectedError?: string): Promise<R>;
  }
}

// Implementation
expect.extend({
  async toHaveValidAuthData(received) {
    // Type-safe implementation
    return {
      pass: true,
      message: () => 'Success',
    };
  },
});
```
→ See [Current Task - Testing Infrastructure](./currentTask.md#testing-infrastructure)

### 2. Prisma Mock Types
```typescript
// Type-safe Prisma mocking
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

const prismaMock = mockDeep<PrismaClient>();
type PrismaMock = DeepMockProxy<PrismaClient>;

// Usage in tests
interface TestContext {
  prisma: PrismaMock;
}
```
→ See [Tech Stack - Development Tools](./techStack.md#development-tools)

### 3. WebSocket Types
```typescript
// WebSocket token types
interface WebSocketToken {
  userId: string;
  role?: Role;
  type: 'websocket';
}

// Type-safe token generation
async function generateWebSocketToken(user: TokenPayload): Promise<string> {
  return sign<WebSocketToken>({
    userId: user.userId,
    role: user.role,
    type: 'websocket',
  });
}
```

## Next.js Types

### 1. Dynamic Routes
```typescript
// Proper dynamic route configuration
export const dynamic = 'force-dynamic';

export const GET = createApiHandler({
  GET: async (req: NextRequest) => {
    // Type-safe handler implementation
    return {
      data: result,
      status: 200,
      headers: {},
    };
  },
});
```

### 2. API Handlers
```typescript
// Type-safe API handler creation
function createApiHandler<T = any>(methods: {
  GET?: (req: NextRequest) => Promise<ApiResponseWithHeaders<T>>;
  POST?: (req: NextRequest) => Promise<ApiResponseWithHeaders<T>>;
}) {
  // Implementation
}
```

## Common Patterns
→ See [Technical Learnings - Key Learnings](./technicalLearnings.md#key-learnings)

### 1. Role-Based Types
```typescript
// Enum-based role types
enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

// Role-based permissions
type Permission = {
  [K in Role]: string[];
};
```
→ See [Technical Learnings - RBAC](./technicalLearnings.md#2-role-based-access-control-rbac)

### 2. Error Types
```typescript
// Error hierarchy
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public validationErrors: Record<string, string[]>
  ) {
    super(message, 400);
  }
}
```
→ See [Technical Learnings - Error Handling](./technicalLearnings.md#error-handling)

## Type Safety Checklist
→ See [Project Roadmap - Type System](./projectRoadmap.md#1-type-system-enhancement-)

1. **New Features**
   - [ ] All function parameters typed
   - [ ] Return types specified for complex functions
   - [ ] Error cases properly typed
   - [ ] Generic constraints added where needed

2. **API Endpoints**
   - [ ] Request body typed
   - [ ] Response type defined with optional data field
   - [ ] Error responses typed
   - [ ] Headers properly typed
   - [ ] Dynamic route configuration when needed

3. **Components**
   - [ ] Props interface defined
   - [ ] Event handlers properly typed
   - [ ] Children types specified
   - [ ] Style props typed

4. **Testing**
   - [ ] Mock types defined with DeepMockProxy
   - [ ] Test utilities properly typed
   - [ ] Custom matchers typed with both asymmetric and regular interfaces
   - [ ] Test data typed

## Related Documentation
- [Technical Learnings](./technicalLearnings.md)
- [Tech Stack](./techStack.md)
- [Current Task](./currentTask.md)
- [Project Roadmap](./projectRoadmap.md)
- [Codebase Summary](./codebaseSummary.md)