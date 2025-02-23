# PoV Testing Guide

This guide explains the successful testing patterns used for the PoV Overview feature, including both the API route handler and React component tests.

## Table of Contents
1. [Route Handler Testing](#route-handler-testing)
2. [Component Testing](#component-testing)
3. [Helper Testing](#helper-testing)
4. [Evolution of Testing Patterns](#evolution-of-testing-patterns)

## Route Handler Testing

### The Diamond Pattern
Following the auth test pattern, we structure our tests in a specific order:

```typescript
// 1. Import mock utilities first
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, PovStatus, Priority } from '@prisma/client';

// 2. Create mock with type parameter
const prismaMock = mockDeep<PrismaClient>();

// 3. Mock modules with enums
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => prismaMock),
  PovStatus: { ... },
  Priority: { ... }
}));

// 4. Mock lib/prisma
jest.mock('lib/prisma', () => ({
  prisma: prismaMock
}));

// 5. Mock api-handler
jest.mock('lib/api-handler', () => ({
  createApiHandler: (handlers: any) => handlers.GET
}));

// 6. Import route handler - AFTER all mocks
import { GET } from '../route';
```

### Key Learnings
1. Order matters - mocks must be defined before imports
2. Return raw handler from api-handler mock
3. Use mockDbSuccess helper for consistent mocking
4. Test complete response shape
5. Test error handling

### Example Test Structure
```typescript
describe('/api/dashboard/pov-overview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  it('should return PoV overview data', async () => {
    // 1. Mock database responses
    mockDbSuccess('poV', 'findMany', mockPoVs);
    
    // 2. Make request
    const request = new NextRequest('http://localhost/api/dashboard/pov-overview');
    const response = await GET(request);
    
    // 3. Verify response shape
    expect(response).toEqual({
      data: {
        metrics: { ... },
        povs: [ ... ]
      }
    });
    
    // 4. Verify database queries
    expect(prismaMock.poV.findMany).toHaveBeenCalledWith({ ... });
  });
});
```

## Component Testing

### The Provider Pattern
Components need proper context providers:

```typescript
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  });

  const theme = createTheme();

  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

### Testing MUI Components
1. Use class-based testing instead of styles
2. Use testId for icons
3. Use closest() for finding parent elements
4. Test accessibility attributes

```typescript
// ✅ Good - Test MUI classes
expect(component).toHaveClass('MuiTypography-h6');

// ✅ Good - Test icons by testId
const icon = screen.getByTestId('RefreshIcon');

// ✅ Good - Find buttons through icons
const button = icon.closest('button');

// ✅ Good - Test accessibility
expect(button).toHaveAttribute('aria-label', 'Refresh');
```

### WebSocket Testing
Test the complete lifecycle:
1. Initial connection
2. Message handling
3. Disconnection
4. Cleanup

```typescript
it('handles WebSocket lifecycle', () => {
  const { rerender, unmount } = renderWithProviders(<PoVOverview />);
  
  // Test connection states
  mockUseWebSocket.mockReturnValue({ isConnected: true });
  rerender(<PoVOverview />);
  
  // Test message handling
  mockUseWebSocket.mockReturnValue({
    lastMessage: { type: 'pov-update' }
  });
  rerender(<PoVOverview />);
  
  // Verify cleanup
  unmount();
});
```

## Helper Testing

### Why Test Helpers?
1. Contract Testing - Ensure test data stability
2. Type Safety - Verify interface conformance
3. Configuration Sync - Keep in sync with constants
4. Documentation - Show proper usage
5. Reliability - Solid foundation for auth tests

### Example Helper Test
```typescript
describe('Auth Test Helpers', () => {
  describe('testUser', () => {
    it('should match AuthTestUser interface', () => {
      expect(testUser).toEqual(expect.objectContaining({
        id: expect.any(String),
        email: expect.any(String),
        // ...other fields
      }));
    });
  });
});
```

## Evolution of Testing Patterns

### Basic → Ultra → Mythical
Our testing evolved through several stages:

1. Basic Testing
   - Simple mocks
   - Direct style testing
   - Basic assertions

2. Ultra Testing
   - Proper provider setup
   - Class-based testing
   - Accessibility testing
   - WebSocket lifecycle

3. Mythical Testing
   - Complete type safety
   - Contract testing
   - Living documentation
   - Error boundaries
   - Edge cases

### Best Practices
1. Follow the Diamond Pattern for mocks
2. Use providers properly
3. Test accessibility
4. Test error states
5. Test lifecycles
6. Document patterns
7. Keep helpers in sync
8. Use proper class testing
9. Clean up resources
10. Test edge cases

### Common Gotchas
1. jsdom style limitations
2. Emotion cache issues
3. Mock ordering
4. WebSocket cleanup
5. MUI class testing
6. Helper synchronization
7. Type safety in mocks
8. Provider nesting
9. Test isolation
10. Async timing

## Conclusion
By following these patterns and learning from both successes and failures, we've created a robust testing strategy that ensures both functionality and maintainability. The combination of route handler tests, component tests, and helper tests provides comprehensive coverage while remaining readable and maintainable.
