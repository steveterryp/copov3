# PoV Testing Guide v2

[← Back to Documentation Index](./README.md)

## Quick Links
- [Type System Guidelines](./typeSystemGuidelines.md)
- [Technical Learnings](./technicalLearnings.md)
- [Current Task Status](./currentTask.md)

## Overview

This updated guide explains our latest testing patterns for the PoV (Proof of Value) feature, incorporating improvements in:
- Test organization
- Custom matchers with proper type definitions
- Component testing with Material-UI
- Type-safe testing utilities

→ See [Type System Guidelines - Testing Types](./typeSystemGuidelines.md#testing-types) for type system details

## Input Content Testing Patterns

### 1. Input Content Categories
→ See [Technical Learnings - Testing Infrastructure](./technicalLearnings.md#testing-infrastructure)

```typescript
describe('TextField Input Content', () => {
  describe('different input types', () => {
    it('handles alphanumeric input');
    it('handles special characters');
    it('handles spaces and tabs');
    it('handles unicode characters');
  });

  describe('input length scenarios', () => {
    it('handles maxLength restrictions');
    it('handles empty input');
  });

  describe('input patterns', () => {
    it('handles pattern validation');
    it('handles inputMode');
  });
});
```

[Previous sections remain exactly as they were...]

## Custom Jest Matchers
→ See [Type System Guidelines - Custom Matchers](./typeSystemGuidelines.md#1-custom-matchers)

```typescript
declare module 'expect' {
  interface Matchers<R> {
    toHaveChipStyle(expectedStyle: { backgroundColor?: string; color?: string }): R;
    toHaveFieldValidation(): R;
    toHaveValidTaskStructure(): R;
  }
}

expect.extend({
  toHaveChipStyle(received: HTMLElement, expectedStyle) {
    const computedStyle = window.getComputedStyle(received);
    const pass = Object.entries(expectedStyle).every(
      ([key, value]) => computedStyle[key as 'backgroundColor' | 'color'] === value
    );

    return {
      pass,
      message: () =>
        `expected element to ${pass ? 'not have' : 'have'} style ${JSON.stringify(expectedStyle)}`,
    };
  },
});
```

## Test Utilities
→ See [Technical Learnings - API Testing Utilities](./technicalLearnings.md#2-api-testing-utilities)

```typescript
// Type-safe test data factories
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Test Task',
  status: 'TODO' as const,
  priority: 'MEDIUM' as const,
  ...overrides,
});

// Type-safe render utilities
export const render = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => rtlRender(ui, { wrapper: AllTheProviders, ...options });
```

## Material-UI Testing
→ See [Tech Stack - Development Tools](./techStack.md#testing)

```typescript
// Testing style overrides
it('applies style overrides correctly', () => {
  render(<Component />);
  
  const element = screen.getByTestId('chip');
  const chipRoot = element.closest('[class*="MuiChip-root"]');
  if (!chipRoot) throw new Error('Chip root not found');
  
  expect(chipRoot).toHaveChipStyle({
    backgroundColor: 'rgb(158, 158, 158)',
    color: 'rgb(255, 255, 255)',
  });
});
```

## Testing Best Practices

### Handling Async Components and Animations
1. **Timeouts**: Always set explicit timeouts for async tests using Jest's timeout parameter
   ```typescript
   it('handles async operations', async () => {
     // Test code
   }, 10000); // 10 second timeout
   ```

2. **Simplify Assertions**: Focus on core functionality and avoid redundant checks
   ```typescript
   await waitFor(() => {
     expect(screen.queryByText('Item')).not.toBeInTheDocument();
   }, { timeout: 5000 });
   ```

3. **Material-UI Specifics**:
   - Use `act()` when testing components with state updates
   - Verify animation states through class names rather than style calculations
   - Mock complex animations when possible to speed up tests

4. **Performance**:
   - Avoid unnecessary DOM queries
   - Use `screen.queryBy*` for negative assertions
   - Keep test setup/teardown efficient

## Related Documentation
- [Type System Guidelines](./typeSystemGuidelines.md)
- [Technical Learnings](./technicalLearnings.md)
- [Tech Stack](./techStack.md)
- [Current Task](./currentTask.md)
- [Project Roadmap](./projectRoadmap.md)
