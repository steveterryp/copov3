# Dashboard UI Layout

## Overview
The dashboard provides a comprehensive view of PoV activities through six key widgets arranged in a responsive grid layout.

## Widget Layout Screenshot
![Dashboard Layout](../public/docs/dashboard-layout.png)

## Widget Descriptions

### 1. Active PoVs
- Located at top-left
- Large number display showing total active PoVs
- Breakdown by stage (Setup, Execution, Evaluation)
- Progress bars indicating distribution

### 2. Success Rate
- Located at top-center
- Prominent percentage display
- Pie chart showing distribution
- Color-coded segments for:
  - Successful (Green)
  - In Progress (Blue)
  - Failed (Red)

### 3. Upcoming Milestones
- Located at top-right
- Next 7 days view
- Status indicators:
  - Upcoming (Blue)
  - Overdue (Red)
- PoV association and dates

### 4. Resource Usage
- Located at bottom-left
- Horizontal bar charts
- Resource categories:
  - Sales Engineers (75% allocated)
  - Technical (60% allocated)
  - Support (45% allocated)
- Clear allocation vs. availability visualization

### 5. Risk Overview
- Located at bottom-center
- Semi-circular gauge chart
- Risk level distribution:
  - Low Risk (6)
  - Medium Risk (4)
  - High Risk (2)
- Summary of attention requirements

### 6. Team Activity
- Located at bottom-right
- Recent updates feed
- User avatars and timestamps
- Activity categorization
- Detailed action descriptions

## Design Principles

1. **Visual Hierarchy**
   - Important metrics prominently displayed
   - Consistent color coding
   - Clear typography scale

2. **Information Density**
   - Balanced data presentation
   - Avoid information overload
   - Strategic use of white space

3. **Interactivity**
   - Hover states for additional details
   - Click-through for deeper analysis
   - Real-time updates

4. **Accessibility**
   - High contrast ratios
   - Clear text labels
   - Screen reader support

## Implementation Notes

### 1. Shadcn Widget Architecture
```typescript
// Type-safe widget variants
const widgetVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      size: {
        sm: "col-span-1",
        md: "col-span-2",
        lg: "col-span-3",
      },
      priority: {
        low: "border-muted",
        medium: "border-primary",
        high: "border-destructive",
      },
    },
    defaultVariants: {
      size: "sm",
      priority: "low",
    },
  }
);

// Type-safe widget props
interface DashboardWidgetProps<T> extends VariantProps<typeof widgetVariants> {
  data: T;
  isLoading: boolean;
  error?: {
    code: string;
    message: string;
  };
  onRetry: () => void;
  onRefresh: () => void;
  metadata?: {
    lastUpdated?: string;
    refreshInterval?: number;
  };
}

// Base widget component with Shadcn
function DashboardWidget<T>({
  data,
  isLoading,
  error,
  onRetry,
  onRefresh,
  metadata,
  size,
  priority,
  className,
  ...props
}: DashboardWidgetProps<T>) {
  return (
    <Card className={cn(widgetVariants({ size, priority }), className)} {...props}>
      <CardHeader>
        <CardTitle>Widget Title</CardTitle>
        <CardDescription>Widget description</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-full h-[200px]" />
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error.message}
              <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <WidgetContent data={data} />
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Text className="text-sm text-muted-foreground">
          Last updated: {metadata?.lastUpdated}
        </Text>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 2. Data Fetching
```typescript
// Type-safe data fetching with React Query
function useWidgetData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    refreshInterval?: number;
    retry?: number;
    onError?: (error: Error) => void;
  }
) {
  return useQuery<T, Error>({
    queryKey: [key],
    queryFn: fetchFn,
    refetchInterval: options?.refreshInterval,
    retry: options?.retry ?? 3,
    onError: options?.onError
  });
}

// Example usage
const { data, isLoading, error } = useWidgetData(
  'activePoVs',
  async () => {
    const response = await fetch('/api/dashboard/active-povs');
    if (!response.ok) {
      throw new Error('Failed to fetch active PoVs');
    }
    return response.json();
  },
  {
    refreshInterval: 30000, // 30 seconds
    onError: (error) => {
      console.error('[Widget Error]:', error);
    }
  }
);
```

### 3. Real-time Updates
```typescript
// Type-safe WebSocket updates
interface WebSocketMessage<T> {
  type: 'UPDATE' | 'ERROR' | 'REFRESH';
  payload: T;
  timestamp: string;
}

function useWebSocketUpdates<T>(
  channel: string,
  onUpdate: (data: T) => void
) {
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/${channel}`);
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage<T>;
        if (message.type === 'UPDATE') {
          onUpdate(message.payload);
        }
      } catch (error) {
        console.error('[WebSocket Error]:', error);
      }
    };

    return () => ws.close();
  }, [channel, onUpdate]);
}
```

### 4. Responsive Design
```typescript
// Type-safe responsive breakpoints
const breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1440
} as const;

type Breakpoint = keyof typeof breakpoints;

// Type-safe responsive styles
interface ResponsiveStyles {
  columns: Record<Breakpoint, number>;
  gap: Record<Breakpoint, number>;
  padding: Record<Breakpoint, number>;
}

const responsiveStyles: ResponsiveStyles = {
  columns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    wide: 3
  },
  gap: {
    mobile: 16,
    tablet: 24,
    desktop: 32,
    wide: 40
  },
  padding: {
    mobile: 16,
    tablet: 24,
    desktop: 32,
    wide: 40
  }
};
```

### 5. Shadcn Loading States
```typescript
// Type-safe loading state
interface LoadingState {
  type: 'INITIAL' | 'REFRESH' | 'BACKGROUND';
  duration: number;
  timestamp: string;
}

// Skeleton loader with Shadcn
function WidgetSkeleton({ type = 'INITIAL' }: { type?: LoadingState['type'] }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-4 w-[150px]" />
      </CardFooter>
    </Card>
  );
}
```

### 6. Shadcn Error Handling
```typescript
// Type-safe error handling
interface WidgetError {
  code: 'FETCH_ERROR' | 'PARSE_ERROR' | 'TIMEOUT' | 'NETWORK_ERROR';
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

function ErrorDisplay({
  error,
  onRetry
}: {
  error: WidgetError;
  onRetry: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {error.code.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')}
      </AlertTitle>
      <AlertDescription>
        {error.message}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="mt-2"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

## Responsive Behavior

The layout adapts to different screen sizes:

- **Desktop**: 3x2 grid layout
- **Tablet**: 2x3 grid layout
- **Mobile**: Single column stack

## Theme Integration

The dashboard follows the application's theme system:

- Primary color for key metrics
- Success/Warning/Error states
- Consistent with global design language
- Dark/Light mode support

## Future UI Enhancements

1. **Customization**
   - Draggable widget positions
   - Collapsible widgets
   - User-specific layouts

2. **Interactions**
   - Drill-down capabilities
   - Interactive charts
   - Custom time ranges

3. **Notifications**
   - Widget-specific alerts
   - Status change indicators
   - Real-time updates

4. **Add custom widget options**

5. **Support multiple layout presets**
