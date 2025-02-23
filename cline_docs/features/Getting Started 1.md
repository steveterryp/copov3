
## Development Workflow

### 1. Planning Phase

#### A. Wireframe Creation

```typescript
// Wireframe Documentation
interface Wireframe {
  name: string;
  description: string;
  layouts: {
    desktop: string;    // Path to desktop wireframe
    tablet?: string;    // Path to tablet wireframe
    mobile: string;     // Path to mobile wireframe
  };
  components: {
    name: string;
    type: 'container' | 'presentation' | 'form';
    children?: string[];
    state?: string[];
  }[];
  interactions: {
    type: 'click' | 'hover' | 'input' | 'scroll';
    element: string;
    description: string;
    outcome: string;
  }[];
  accessibility: {
    ariaLabels: string[];
    keyboardNav: string[];
    roles: string[];
    focusOrder: string[];
  };
  responsiveRules: {
    breakpoint: string;
    changes: string[];
  }[];
}

// Example Wireframe Implementation
const dashboardWireframe: Wireframe = {
  name: 'DashboardPage',
  description: 'Main dashboard showing key metrics and activities',
  layouts: {
    desktop: '/wireframes/dashboard/desktop.png',
    tablet: '/wireframes/dashboard/tablet.png',
    mobile: '/wireframes/dashboard/mobile.png',
  },
  components: [
    {
      name: 'MetricsGrid',
      type: 'container',
      children: ['MetricCard', 'ChartComponent'],
      state: ['metrics', 'loading', 'error'],
    },
    {
      name: 'ActivityFeed',
      type: 'presentation',
      state: ['activities', 'loading'],
    },
  ],
  interactions: [
    {
      type: 'click',
      element: 'MetricCard',
      description: 'Click on metric card',
      outcome: 'Navigate to detailed metric view',
    },
  ],
  accessibility: {
    ariaLabels: ['Dashboard metrics', 'Recent activity'],
    keyboardNav: ['Tab through cards', 'Enter to select'],
    roles: ['main', 'region', 'list'],
    focusOrder: ['navigation', 'metrics', 'activity'],
  },
  responsiveRules: [
    {
      breakpoint: 'md',
      changes: [
        'Stack metrics vertically',
        'Reduce chart size',
      ],
    },
  ],
};
```

#### B. Component Planning

```typescript
interface ComponentPlan {
  wireframe: Wireframe;
  requirements: {
    functional: string[];
    technical: string[];
    performance: string[];
    accessibility: string[];
  };
  dataFlow: {
    inputs: Record<string, string>;
    outputs: Record<string, string>;
    state: Record<string, string>;
  };
  dependencies: {
    external: string[];
    internal: string[];
  };
  testing: {
    units: string[];
    integration: string[];
    e2e: string[];
  };
}

// Example Component Plan
const dashboardPlan: ComponentPlan = {
  wireframe: dashboardWireframe,
  requirements: {
    functional: [
      'Display real-time metrics',
      'Show activity feed',
      'Enable metric filtering',
    ],
    technical: [
      'Redux for state management',
      'WebSocket for real-time updates',
      'Virtualized lists',
    ],
    performance: [
      'Lazy load charts',
      'Memoize calculations',
      'Implement pagination',
    ],
    accessibility: [
      'ARIA live regions',
      'Keyboard navigation',
      'Screen reader support',
    ],
  },
  dataFlow: {
    inputs: {
      metrics: 'MetricsData[]',
      activities: 'Activity[]',
    },
    outputs: {
      onMetricClick: '(metricId: string) => void',
      onFilterChange: '(filter: Filter) => void',
    },
    state: {
      selectedMetrics: 'string[]',
      timeRange: 'DateRange',
    },
  },
  dependencies: {
    external: ['@mui/material', 'recharts'],
    internal: ['@shared/components', '@utils/format'],
  },
  testing: {
    units: [
      'Metric calculations',
      'Filter logic',
    ],
    integration: [
      'Data fetching',
      'WebSocket updates',
    ],
    e2e: [
      'Dashboard navigation',
      'Metric interaction',
    ],
  },
};
```

### 2. Implementation Phase

```typescript
// Component Implementation Template
interface ComponentProps {
  // Strong typing for props
}

const Component: React.FC<ComponentProps> = memo(({ prop1, prop2 }) => {
  // Organized hooks
  const [state, setState] = useState<State>();
  const theme = useTheme();
  const dispatch = useDispatch();

  // Memoized callbacks
  const handleAction = useCallback(() => {
    // Action logic
  }, [dependencies]);

  // Side effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Performance optimization
  const memoizedValue = useMemo(() => {
    // Computation
  }, [dependencies]);

  return (
    <ErrorBoundary>
      <StyledContainer>
        {/* JSX implementation following wireframe */}
      </StyledContainer>
    </ErrorBoundary>
  );
});
```

### 3. Testing Phase

```typescript
// Test Template
describe('Component', () => {
  // Setup
  beforeEach(() => {
    // Setup logic
  });

  // Tests
  it('renders according to wireframe', () => {
    const { getByRole } = render(<Component />);
    expect(getByRole('main')).toBeInTheDocument();
  });

  it('implements planned interactions', () => {
    const onAction = jest.fn();
    const { getByRole } = render(<Component onAction={onAction} />);
    fireEvent.click(getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });

  // Accessibility tests
  it('meets accessibility requirements', () => {
    const { container } = render(<Component />);
    expect(axe(container)).toHaveNoViolations();
  });

  // Cleanup
  afterEach(() => {
    // Cleanup logic
  });
});
```

## Quality Standards

### 1. Code Quality

```typescript
// Type Safety
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type AsyncResponse<T> = Promise<T>;

// Error Handling
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
  }
}

// Performance Patterns
const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithPerformanceTracking(props: P) {
    useEffect(() => {
      const start = performance.now();
      return () => {
        const duration = performance.now() - start;
        trackMetric('render-time', duration);
      };
    }, []);

    return <WrappedComponent {...props} />;
  };
};
```

### 2. State Management

```typescript
// Redux Slice Template
const slice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    action: (state, action: PayloadAction<Payload>) => {
      // Immutable updates
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(asyncAction.pending, (state) => {
        state.loading = true;
      })
      .addCase(asyncAction.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(asyncAction.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  },
});
```

## Documentation Requirements

### 1. Code Documentation

```typescript
/**
 * Component description matching wireframe specifications
 * @param props - Component properties
 * @param props.value - Value description
 * @returns JSX element
 * @throws {ValidationError} When value is invalid
 */
```

### 2. API Documentation

```typescript
/**
 * API endpoint description
 * @param params - Request parameters
 * @returns Response data
 * @throws {APIError} When request fails
 */
```

## Error Handling

### 1. Global Error Boundary

```typescript
class GlobalErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error
    errorTracking.captureError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 2. API Error Handling

```typescript
const apiClient = {
  async request<T>(config: RequestConfig): Promise<T> {
    try {
      const response = await fetch(config.url, config);
      if (!response.ok) {
        throw new APIError(response.statusText, response.status);
      }
      return response.json();
    } catch (error) {
      errorTracking.captureError(error);
      throw error;
    }
  },
};
```


## Development Workflow

### 1. Planning Phase

- Create component wireframes
- Define TypeScript interfaces
- Plan state management
- Document API requirements
- Set up test strategy

### 2. Implementation Phase

```typescript
// Component Template
interface ComponentProps {
  // Props interface
}

const Component: React.FC<ComponentProps> = memo(({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState<State>();
  const theme = useTheme();

  // Callbacks
  const handleAction = useCallback(() => {
    // Action logic
  }, [dependencies]);

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return (
    <StyledContainer>
      {/* Component JSX */}
    </StyledContainer>
  );
});
```

### 3. Testing Phase

```typescript
describe('Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Component />);
    expect(getByText('text')).toBeInTheDocument();
  });

  it('handles interactions', () => {
    const onAction = jest.fn();
    const { getByRole } = render(<Component onAction={onAction} />);
    fireEvent.click(getByRole('button'));
    expect(onAction).toHaveBeenCalled();
  });
});
```

## Code Quality Standards

### 1. TypeScript Usage

```typescript
// Use strict types
const func = <T extends object>(arg: T): T => {
  return arg;
};

// Define interfaces
interface Data {
  id: string;
  value: number;
}

// Use type guards
const isData = (value: unknown): value is Data => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'value' in value
  );
};
```

### 2. State Management

```typescript
// Redux slice template
const slice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    action: (state, action: PayloadAction<Payload>) => {
      // State updates
    },
  },
  extraReducers: (builder) => {
    builder.addCase(asyncAction.pending, (state) => {
      state.loading = true;
    });
  },
});
```

### 3. Performance Optimization

```typescript
// Use memoization
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// Optimize lists
const MemoizedItem = memo(({ item }: { item: Item }) => (
  <ListItem>{item.content}</ListItem>
));

// Use virtualization
const VirtualList = ({ items }: { items: Item[] }) => (
  <VirtualizedList
    height={400}
    itemCount={items.length}
    itemSize={50}
    width={300}
  >
    {({ index, style }) => (
      <MemoizedItem item={items[index]} style={style} />
    )}
  </VirtualizedList>
);
```

## Performance Guidelines

### 1. Component Optimization

- Follow wireframe specifications for layout
- Use React.memo for pure components
- Implement useMemo for expensive computations
- Use useCallback for event handlers
- Implement virtualization for long lists
- Optimize images and assets

### 2. Build Optimization

- Configure code splitting
- Implement tree shaking
- Optimize bundle size
- Configure caching
- Implement lazy loading