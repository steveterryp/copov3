# Phase 1.5 UI Components

## Overview
This document details the UI components and their interactions:
- Activity notifications
- Dashboard widgets
- Real-time updates
- Material-UI integration

## Component Architecture

### 1. Activity Notifications
```typescript
// components/notifications/ActivityNotification.tsx
export function ActivityNotification() {
  const { lastMessage } = useWebSocket();
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);

  // Sound effect handling
  const notificationSound = useMemo(() => new Audio('/sounds/notification.mp3'), []);
  const [soundEnabled] = useLocalStorage('notificationSound', true);

  useEffect(() => {
    if (lastMessage?.type === 'activity') {
      setActivity(lastMessage.data);
      setOpen(true);
      if (soundEnabled) {
        notificationSound.play().catch(() => {
          // Handle audio play error
        });
      }
    }
  }, [lastMessage, soundEnabled, notificationSound]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity="info"
        icon={<ActivityIcon type={activity?.type} />}
        sx={{ minWidth: '300px' }}
      >
        {/* Alert content */}
      </Alert>
    </Snackbar>
  );
}
```

### 2. Team Activity Widget
```typescript
// components/dashboard/widgets/TeamActivity.tsx
export function TeamActivity() {
  const [activityType, setActivityType] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data fetching
  const { data, isLoading } = useQuery<TeamActivity>({
    queryKey: ['team-activity', { page, limit, type: activityType }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(activityType && { type: activityType }),
      });

      const response = await fetch(`/api/dashboard/team-activity?${params}`);
      if (!response.ok) throw new Error('Failed to fetch team activity');
      return response.json();
    },
  });

  // Real-time updates
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (lastMessage?.type === 'activity') {
      queryClient.setQueryData(
        ['team-activity', { page, limit, type: activityType }],
        (old: any) => ({
          ...old,
          activities: [lastMessage.data, ...old.activities.slice(0, -1)],
          pagination: {
            ...old.pagination,
            total: old.pagination.total + 1,
          },
        })
      );
    }
  }, [lastMessage, queryClient, page, limit, activityType]);

  return (
    <Widget
      title="Team Activity"
      action={
        <ActivityFilter
          value={activityType}
          onChange={setActivityType}
        />
      }
    >
      {/* Widget content */}
    </Widget>
  );
}
```

### 3. Activity Filter
```typescript
// components/dashboard/widgets/ActivityFilter.tsx
interface ActivityFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ActivityFilter({ value, onChange }: ActivityFilterProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel>Filter</InputLabel>
      <Select
        value={value}
        label="Filter"
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="POV">PoVs</MenuItem>
        <MenuItem value="PHASE">Phases</MenuItem>
        <MenuItem value="TASK">Tasks</MenuItem>
        <MenuItem value="DOCUMENT">Documents</MenuItem>
      </Select>
    </FormControl>
  );
}
```

## Styling and Theme

### 1. Material-UI Theme
```typescript
// lib/theme.ts
export const theme = createTheme({
  components: {
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
```

### 2. Widget Styling
```typescript
// components/dashboard/DashboardLayout.tsx
export function Widget({ 
  title, 
  action, 
  children 
}: WidgetProps) {
  return (
    <Card>
      <CardHeader
        title={title}
        action={action}
        sx={{
          '& .MuiCardHeader-title': {
            fontSize: '1.125rem',
            fontWeight: 600,
          },
        }}
      />
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
```

## Interactions

### 1. Activity Updates
```typescript
// Real-time update flow
WebSocket Message -> 
  ActivityNotification (Show notification) -> 
    TeamActivity Widget (Update data) ->
      UI Refresh
```

### 2. User Actions
```typescript
// Activity filtering
Select Filter -> 
  Update Query Parameters -> 
    Fetch New Data -> 
      Update UI

// Pagination
Click Page -> 
  Update Page Number -> 
    Fetch New Data -> 
      Update UI
```

### 3. Sound Preferences
```typescript
// Sound toggle
Toggle Switch -> 
  Update LocalStorage -> 
    Update Sound State -> 
      Affect Next Notification
```

## Performance Optimizations

### 1. Data Management
- React Query for caching
- Optimistic updates
- Pagination support
- Efficient re-renders

### 2. UI Performance
- Virtualized lists
- Lazy loading
- Debounced updates
- Memoized components

### 3. Real-time Updates
- Selective updates
- Batch processing
- Connection management
- Error recovery

## Accessibility

### 1. Keyboard Navigation
- Focus management
- Tab order
- Keyboard shortcuts
- ARIA labels

### 2. Screen Readers
- Semantic HTML
- ARIA roles
- Status updates
- Live regions

### 3. Visual Accessibility
- Color contrast
- Focus indicators
- Text scaling
- Animation control

## Best Practices

### 1. Component Design
- Single responsibility
- Prop validation
- Error boundaries
- Loading states

### 2. State Management
- Local vs global state
- Optimistic updates
- Error handling
- Data consistency

### 3. User Experience
- Loading indicators
- Error messages
- Empty states
- Success feedback

## Future Improvements

### 1. Features
- Activity grouping
- Custom filters
- Advanced sorting
- Batch actions

### 2. Performance
- Virtual scrolling
- Progressive loading
- Image optimization
- Code splitting

### 3. Accessibility
- Keyboard shortcuts
- Screen reader improvements
- High contrast mode
- Motion reduction
