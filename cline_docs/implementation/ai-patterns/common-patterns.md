# Common Implementation Patterns

## Overview

This document provides a collection of reusable patterns and solutions for common implementation scenarios in the POV system. These patterns ensure consistency and efficiency in AI-assisted development.

## Data Management Patterns

### Entity Base Pattern

```typescript
// Base Entity Interface
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

// Base Service Pattern
abstract class BaseService<T extends BaseEntity> {
  constructor(
    protected prisma: PrismaClient,
    protected entityName: string
  ) {}

  async findById(id: string): Promise<T | null> {
    return this.prisma[this.entityName].findUnique({
      where: { id },
    });
  }

  async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
    return this.prisma[this.entityName].create({
      data: {
        ...data,
        metadata: {},
      },
    });
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.prisma[this.entityName].update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return this.prisma[this.entityName].delete({
      where: { id },
    });
  }
}
```

### Status Management Pattern

```typescript
// Status Type Pattern
interface StatusManaged {
  status: string;
  previousStatus?: string;
  statusChangedAt?: Date;
  statusHistory?: StatusHistoryEntry[];
}

interface StatusHistoryEntry {
  from: string;
  to: string;
  timestamp: Date;
  reason?: string;
  userId?: string;
}

// Status Service Pattern
class StatusManager<T extends StatusManaged> {
  async changeStatus(
    entity: T,
    newStatus: string,
    reason?: string,
    userId?: string
  ): Promise<T> {
    const previousStatus = entity.status;
    const timestamp = new Date();

    const history = [
      ...(entity.statusHistory || []),
      {
        from: previousStatus,
        to: newStatus,
        timestamp,
        reason,
        userId,
      },
    ];

    return {
      ...entity,
      status: newStatus,
      previousStatus,
      statusChangedAt: timestamp,
      statusHistory: history,
    };
  }

  validateTransition(from: string, to: string): boolean {
    // Implementation based on allowed transitions
    return true;
  }
}
```

## API Patterns

### Route Handler Pattern

```typescript
// Base Route Handler
abstract class BaseRouteHandler<T extends BaseEntity> {
  constructor(
    protected service: BaseService<T>,
    protected validator: BaseValidator<T>
  ) {}

  // GET handler
  async handleGet(req: Request): Promise<Response> {
    try {
      const id = this.extractId(req);
      const entity = await this.service.findById(id);
      
      if (!entity) {
        return Response.json(
          { error: 'Not Found' },
          { status: 404 }
        );
      }

      return Response.json(entity);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // POST handler
  async handlePost(req: Request): Promise<Response> {
    try {
      const data = await req.json();
      const validated = await this.validator.validate(data);
      const entity = await this.service.create(validated);
      return Response.json(entity, { status: 201 });
    } catch (error) {
      return this.handleError(error);
    }
  }

  protected abstract extractId(req: Request): string;
  protected abstract handleError(error: unknown): Response;
}
```

### Validation Pattern

```typescript
// Base Validator
abstract class BaseValidator<T> {
  constructor(protected schema: z.ZodType<T>) {}

  async validate(data: unknown): Promise<T> {
    try {
      return await this.schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  }
}

// Implementation Example
class POVValidator extends BaseValidator<POV> {
  constructor() {
    super(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
        metadata: z.record(z.unknown()).optional(),
      })
    );
  }
}
```

## UI Patterns

### Data Display Pattern

```typescript
// List Display Pattern
interface ListDisplayProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onItemClick?: (item: T) => void;
  loading?: boolean;
  error?: Error;
}

const ListDisplay = <T extends { id: string }>({
  items,
  renderItem,
  onItemClick,
  loading,
  error,
}: ListDisplayProps<T>) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  if (!items.length) return <EmptyState />;

  return (
    <div className="list-display">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className="list-item"
        >
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
};
```

### Form Pattern

```typescript
// Form Pattern
interface FormProps<T> {
  initialData?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
}

const EntityForm = <T extends Record<string, unknown>>({
  initialData,
  onSubmit,
  onCancel,
  disabled,
}: FormProps<T>) => {
  const form = useForm<T>({
    defaultValues: initialData,
  });

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      form.setError('root', {
        type: 'submit',
        message: getErrorMessage(error),
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* Form fields */}
      <div className="form-actions">
        <Button type="submit" disabled={disabled}>
          Submit
        </Button>
        {onCancel && (
          <Button type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
```

## State Management Patterns

### Query Pattern

```typescript
// Query Hook Pattern
interface QueryConfig<T> {
  queryKey: string[];
  fetchFn: () => Promise<T>;
  options?: {
    staleTime?: number;
    cacheTime?: number;
    retry?: boolean | number;
  };
}

function useQueryPattern<T>({
  queryKey,
  fetchFn,
  options,
}: QueryConfig<T>) {
  return useQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    cacheTime: options?.cacheTime ?? 30 * 60 * 1000,
    retry: options?.retry ?? 3,
  });
}

// Usage Example
const useEntity = (id: string) => {
  return useQueryPattern({
    queryKey: ['entity', id],
    fetchFn: () => api.getEntity(id),
    options: {
      staleTime: 1 * 60 * 1000,  // 1 minute
    },
  });
};
```

### Mutation Pattern

```typescript
// Mutation Hook Pattern
interface MutationConfig<T, R> {
  mutationFn: (data: T) => Promise<R>;
  onSuccess?: (response: R, variables: T) => void | Promise<void>;
  onError?: (error: Error, variables: T) => void | Promise<void>;
  invalidateQueries?: string[];
}

function useMutationPattern<T, R>({
  mutationFn,
  onSuccess,
  onError,
  invalidateQueries,
}: MutationConfig<T, R>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (response, variables) => {
      if (invalidateQueries) {
        await Promise.all(
          invalidateQueries.map((key) =>
            queryClient.invalidateQueries({ queryKey: [key] })
          )
        );
      }
      await onSuccess?.(response, variables);
    },
    onError: async (error: Error, variables) => {
      await onError?.(error, variables);
    },
  });
}

// Usage Example
const useUpdateEntity = () => {
  return useMutationPattern({
    mutationFn: (data: UpdateEntityInput) =>
      api.updateEntity(data.id, data),
    invalidateQueries: ['entity'],
  });
};
```

## Testing Patterns

### Service Test Pattern

```typescript
// Service Test Setup
describe('EntityService', () => {
  let service: EntityService;
  let prisma: MockPrismaClient;

  beforeEach(() => {
    prisma = createMockPrismaClient();
    service = new EntityService(prisma);
  });

  // Create Tests
  describe('create', () => {
    it('should create entity with valid data', async () => {
      const data = { name: 'Test' };
      const result = await service.create(data);
      expect(result).toMatchObject(data);
    });

    it('should throw on invalid data', async () => {
      const data = { invalid: true };
      await expect(service.create(data)).rejects.toThrow();
    });
  });

  // Update Tests
  describe('update', () => {
    it('should update existing entity', async () => {
      const id = 'test-id';
      const updates = { name: 'Updated' };
      const result = await service.update(id, updates);
      expect(result.name).toBe(updates.name);
    });

    it('should throw on non-existent entity', async () => {
      const id = 'non-existent';
      const updates = { name: 'Updated' };
      await expect(service.update(id, updates)).rejects.toThrow();
    });
  });
});
```

### Component Test Pattern

```typescript
// Component Test Setup
describe('EntityComponent', () => {
  const mockData = {
    id: '1',
    name: 'Test Entity',
    status: 'ACTIVE',
  };

  // Render Tests
  describe('rendering', () => {
    it('should render entity data', () => {
      const { getByText } = render(
        <EntityComponent data={mockData} />
      );
      expect(getByText('Test Entity')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const { getByRole } = render(
        <EntityComponent data={mockData} loading />
      );
      expect(getByRole('progressbar')).toBeInTheDocument();
    });
  });

  // Interaction Tests
  describe('interactions', () => {
    it('should handle updates', async () => {
      const onUpdate = jest.fn();
      const { getByRole } = render(
        <EntityComponent data={mockData} onUpdate={onUpdate} />
      );

      await userEvent.click(getByRole('button', { name: /edit/i }));
      // Add interaction steps
      expect(onUpdate).toHaveBeenCalled();
    });
  });
});
```

## Error Handling Patterns

### Error Boundary Pattern

```typescript
// Error Boundary Component
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.props.onRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Usage
const SafeComponent: React.FC = () => (
  <ErrorBoundary onRetry={() => window.location.reload()}>
    <ComponentThatMightError />
  </ErrorBoundary>
);
```

## Performance Patterns

### Memoization Pattern

```typescript
// Memoized Component
const MemoizedComponent = React.memo(
  ({ data, onAction }: Props) => {
    // Implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison logic
    return prevProps.data.id === nextProps.data.id;
  }
);

// Memoized Callback
const Component: React.FC<Props> = ({ data }) => {
  const handleAction = useCallback(
    (id: string) => {
      // Implementation
    },
    [] // Dependencies array
  );

  const memoizedValue = useMemo(
    () => expensiveCalculation(data),
    [data]
  );

  return (
    // Implementation
  );
};
```

### Virtual List Pattern

```typescript
// Virtual List Component
interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

const VirtualList = <T extends { id: string }>({
  items,
  height,
  itemHeight,
  renderItem,
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(height / itemHeight),
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      style={{ height, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
};
