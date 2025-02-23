# Shadcn Migration Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for migrating from Material-UI (MUI) to Shadcn UI components. The strategy ensures that all migrated components maintain functionality, accessibility, and performance while minimizing regression risks.

## Testing Layers

### 1. Unit Testing
```typescript
// Component unit test example
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with correct variant styles', () => {
    render(
      <Button variant="destructive">
        Delete
      </Button>
    )
    
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass(
      'bg-destructive',
      'text-destructive-foreground'
    )
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(
      <Button onClick={handleClick}>
        Click Me
      </Button>
    )
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('supports loading state', () => {
    render(
      <Button loading>
        Submit
      </Button>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('opacity-50', 'pointer-events-none')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
```

### 2. Integration Testing
```typescript
// Form integration test example
import { render, screen, fireEvent } from '@testing-library/react'
import { UserForm } from '@/components/forms/user-form'

describe('UserForm', () => {
  it('submits form data correctly', async () => {
    const onSubmit = jest.fn()
    render(<UserForm onSubmit={onSubmit} />)
    
    // Fill form fields
    await fireEvent.change(
      screen.getByLabelText(/name/i),
      { target: { value: 'John Doe' } }
    )
    
    await fireEvent.change(
      screen.getByLabelText(/email/i),
      { target: { value: 'john@example.com' } }
    )
    
    // Submit form
    await fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    // Verify submission
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com'
    })
  })

  it('displays validation errors', async () => {
    render(<UserForm onSubmit={jest.fn()} />)
    
    // Submit without filling required fields
    await fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    
    // Verify error messages
    expect(screen.getByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
  })
})
```

### 3. Visual Regression Testing
```typescript
// Storybook story with visual testing
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof Button>

// Stories for visual testing
export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Primary Button',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading',
  },
}

// Visual regression test
describe('Button', () => {
  it('matches visual snapshot', async () => {
    await expect(page).toMatchImageSnapshot()
  })
})
```

### 4. Accessibility Testing
```typescript
// Accessibility test example
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Dialog } from '@/components/ui/dialog'

expect.extend(toHaveNoViolations)

describe('Dialog', () => {
  it('meets accessibility guidelines', async () => {
    const { container } = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Accessible Dialog</DialogTitle>
          <DialogDescription>
            This dialog should meet WCAG guidelines.
          </DialogDescription>
          <Button>Close</Button>
        </DialogContent>
      </Dialog>
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('manages focus correctly', () => {
    render(
      <Dialog open>
        <DialogContent>
          <Button autoFocus>Focus Me</Button>
        </DialogContent>
      </Dialog>
    )
    
    expect(document.activeElement).toHaveTextContent('Focus Me')
  })

  it('traps focus within dialog', () => {
    render(
      <Dialog open>
        <DialogContent>
          <Button>First</Button>
          <Button>Last</Button>
        </DialogContent>
      </Dialog>
    )
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveFocus()
    
    // Tab through dialog
    userEvent.tab()
    expect(screen.getByText('First')).toHaveFocus()
    
    userEvent.tab()
    expect(screen.getByText('Last')).toHaveFocus()
    
    userEvent.tab()
    expect(screen.getByText('First')).toHaveFocus()
  })
})
```

### 5. Performance Testing
```typescript
// Performance test example
import { render } from '@testing-library/react'
import { DataGrid } from '@/components/ui/data-grid'

describe('DataGrid Performance', () => {
  it('renders large datasets efficiently', async () => {
    const startTime = performance.now()
    
    render(
      <DataGrid
        data={generateLargeDataset(1000)}
        columns={columns}
      />
    )
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    expect(renderTime).toBeLessThan(100) // 100ms threshold
  })

  it('handles sorting without jank', async () => {
    const { getByRole } = render(
      <DataGrid
        data={generateLargeDataset(1000)}
        columns={columns}
      />
    )
    
    const startTime = performance.now()
    fireEvent.click(getByRole('columnheader', { name: /name/i }))
    const endTime = performance.now()
    
    expect(endTime - startTime).toBeLessThan(16) // 16ms frame budget
  })
})
```

## Testing Infrastructure

### 1. Test Environment Setup
```typescript
// test/setup.ts
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import matchers from '@testing-library/jest-dom/matchers'

// Extend matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})
window.IntersectionObserver = mockIntersectionObserver
```

### 2. Custom Test Utilities
```typescript
// test/utils.tsx
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function customRender(ui: React.ReactElement, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider>
        {children}
      </ThemeProvider>
    ),
    ...options,
  })
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Setup user-event
export const user = userEvent.setup()
```

### 3. Test Helpers
```typescript
// test/helpers.ts
export function createMockForm<T extends Record<string, any>>(
  initialValues: T
) {
  const values = { ...initialValues }
  const errors: Partial<Record<keyof T, string>> = {}
  const touched: Partial<Record<keyof T, boolean>> = {}

  return {
    values,
    errors,
    touched,
    handleChange: (field: keyof T) => (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      values[field] = event.target.value as any
    },
    handleBlur: (field: keyof T) => () => {
      touched[field] = true
    },
    setFieldValue: (field: keyof T, value: T[keyof T]) => {
      values[field] = value
    },
    setFieldError: (field: keyof T, error: string) => {
      errors[field] = error
    },
  }
}
```

## Testing Workflow

### 1. Component Migration Testing
1. Write tests for existing MUI component
2. Create parallel tests for Shadcn component
3. Verify feature parity and behavior
4. Run accessibility tests
5. Run performance tests
6. Update visual snapshots

### 2. Integration Testing
1. Test component interactions
2. Verify form submissions
3. Check data flow
4. Test error handling
5. Verify loading states

### 3. Regression Testing
1. Run full test suite
2. Compare bundle sizes
3. Check performance metrics
4. Verify accessibility compliance
5. Update documentation

## Test Coverage Requirements

### 1. Unit Tests
- 100% coverage of component props
- All component states tested
- Error handling verified
- Event handlers checked

### 2. Integration Tests
- Form submissions
- Data fetching
- State management
- Route transitions
- Error boundaries

### 3. Accessibility Tests
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management

### 4. Performance Tests
- Render times
- Bundle sizes
- Memory usage
- Animation performance
- Load times

## Related Documentation
- [Migration Plan](./mui-to-shadcn.md)
- [Performance Benchmarks](./performance-benchmarks.md)
- [Component Architecture](../componentArchitecture.md)
- [Type System Guidelines](../type-system-guidelines.md)
