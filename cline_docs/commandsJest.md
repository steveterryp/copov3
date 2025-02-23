# Jest Test Commands Guide

This document outlines the various Jest test commands available in the project and explains what each command tests.

## Available Test Commands

### 1. API Tests
```bash
npm test -- "app/api/.*\.test\.(ts|tsx)?" --verbose
```
Tests API route handlers and endpoints in the Next.js application. These tests verify the correct handling of HTTP requests, authentication, and API responses. Includes:
- Auth endpoints (login, register, logout)
- Phase API endpoints
- Other API routes

Key testing approaches:
- Self-contained test mocking for auth tests
- Custom URL class handling for phase tests
- Proper request/response mocking for Next.js API routes

### 2. Component Tests
```bash
npm test -- "components/.*\.test\.(ts|tsx)?" --verbose
```
Tests React components for proper rendering, user interactions, and state management. Includes tests for:
- UI components (Button, TextField)
- Task components (TaskCard, TaskList)
- Notifications (ActivityNotification)
- Dashboard widgets (TeamActivity)

### 3. Integration Tests
```bash
npm test -- "test/integration/.*\.test\.(ts|tsx)?" --verbose
```
Tests multiple parts of the application working together. These tests verify that different components and services integrate correctly, such as:
- Authentication flows
- Data operations
- Complex user interactions

### 4. Middleware Tests
```bash
npm test -- "middleware/__tests__/.*\.test\.(ts|tsx)?" --verbose
```
Tests middleware functions that process requests between the client and server. Includes:
- Authentication middleware
- Activity tracking
- Error handling

### 5. Store Tests
```bash
npm test -- "lib/store/__tests__/.*\.test\.(ts|tsx)?" --verbose
```
Tests state management logic using Zustand stores. Verifies:
- State updates
- Actions
- State persistence

### 6. WebSocket Tests
```bash
npm test -- "lib/websocket/__tests__/.*\.test\.(ts|tsx)?" --verbose
```
Tests WebSocket functionality for real-time features:
- Connection handling
- Message passing
- Activity tracking

### 7. Minimal Tests
```bash
npm test -- "test/__tests__/minimal.test.ts" --verbose
```
Basic smoke tests that verify the fundamental functionality of the application.

### 8. Phase Tests
```bash
npm test -- "test/phase.test.ts" --verbose
```
Tests specific to phase-related functionality:
- Phase transitions
- Validations
- State management
- Complex data type handling
- Date serialization

## Running Multiple Test Categories

You can combine test patterns to run multiple categories at once:

```bash
npm test -- "(app/api|test/integration)/.*\.test\.(ts|tsx)?" --verbose
```
This example runs both API and integration tests in a single command.

## Running Specific Test Files

To run a specific test file:
```bash
npm test path/to/test/file.test.ts
```

## Command Options Explained

- `--verbose`: Provides detailed output of test results
- `.*\.test\.(ts|tsx)?`: Matches any test file with .test.ts or .test.tsx extension
- Pattern matching using directories (e.g., "components/") targets all tests in that directory and its subdirectories

## Best Practices

1. **Test Structure**:
   - Use the Diamond Pattern: mocks → imports → setup → tests
   - Keep unit tests focused on single operations
   - Use integration tests for complete flows
   - Reset state in beforeEach blocks

2. **Mock Management**:
   - Declare mocks before imports (Jest hoisting)
   - Use mockDb helper for database operations
   - Mock only what's actually used
   - Reset mocks between tests

3. **Implementation Matching**:
   - Check actual code implementation first
   - Mock exact response shapes
   - Verify exact fields and operations
   - Don't test operations that don't exist

4. **Type Safety**:
   - Use TypeScript for type safety
   - Extend types for additional properties
   - Use type assertions for enums
   - Keep type definitions close to usage

5. **Error Handling**:
   - Test both success and error scenarios
   - Include validation error cases
   - Test authentication failures
   - Verify error response shapes

## Notes

1. All commands maintain the full test environment setup defined in jest.config.ts
2. Tests use Jest with React Testing Library for component testing
3. The jsdom environment is configured for DOM manipulation in tests
4. Mocks are automatically reset between tests
5. Each command focuses on specific aspects of the application while maintaining isolation between tests
6. Complex data types (like dates and URLs) require special handling in tests
7. Proper mocking of Next.js API route objects is essential for API tests

For detailed information about specific test implementations:
- See authJest.md for authentication testing details
- See phaseJest.md for phase API testing details
- See apiJest.md for comprehensive API testing patterns
