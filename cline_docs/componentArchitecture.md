# Component Architecture

## Purpose & Usage

This document serves as the definitive guide for building type-safe, maintainable, and performant React components in our application. It is essential in several key scenarios:

1. **Component Development**
   - When creating new components to ensure they follow our type-safe patterns
   - When implementing complex features that require multiple components
   - When building reusable UI components for the component library
   - When integrating third-party components with our type system

2. **Code Review**
   - When reviewing component implementations for type safety
   - When checking component architecture for best practices
   - When verifying accessibility implementation
   - When assessing performance optimizations

3. **Refactoring**
   - When updating components to use type-safe patterns
   - When splitting complex components into smaller ones
   - When optimizing component performance
   - When improving component accessibility

4. **Troubleshooting**
   - When debugging type-related issues
   - When investigating performance problems
   - When fixing accessibility violations
   - When resolving state management issues

## When to Reference This Document

1. **Starting New Features**
   - Check component structure guidelines
   - Review state management patterns
   - Understand accessibility requirements
   - Plan performance optimizations

2. **During Development**
   - Verify type-safe implementations
   - Follow styling patterns
   - Implement proper testing
   - Ensure performance standards

3. **Code Review Process**
   - Validate component architecture
   - Check type safety
   - Verify accessibility
   - Assess performance

4. **Maintenance**
   - Update legacy components
   - Improve type safety
   - Enhance accessibility
   - Optimize performance

## Core Components

### Layout Components
```typescript
// components/layout/
├── DashboardLayout.tsx       // Main layout with navigation and app bar
│   ├── Responsive drawer
│   ├── App bar with actions
│   └── Content container
├── AuthLayout.tsx           // Layout for auth pages
├── PageContainer.tsx        // Standard page wrapper
└── SideNav.tsx             // Navigation sidebar
    ├── Expandable menu items
    ├── Nested navigation
    └── Mobile responsive
```

### Shared UI Components
```typescript
// components/ui/
├── Button/
│   ├── Button.tsx          // Base button component
│   ├── IconButton.tsx      // Icon-only button
│   └── ButtonGroup.tsx     // Button group container
├── Form/
│   ├── TextField.tsx       // Text input field
│   ├── Select.tsx          // Dropdown select
│   ├── MultiSelect.tsx     // Multi-selection dropdown
│   ├── DatePicker.tsx      // Date selection
│   └── FormSection.tsx     // Form section wrapper
├── Feedback/
│   ├── Alert.tsx           // Alert/notification component
│   ├── Progress.tsx        // Progress indicators
│   ├── Skeleton.tsx        // Loading placeholder
│   └── Toast.tsx           // Toast notifications
├── Data/
│   ├── Table.tsx           // Data table component
│   ├── Card.tsx            // Card container
│   └── List.tsx            // List container
└── Navigation/
    ├── Tabs.tsx            // Tab navigation
    ├── Breadcrumbs.tsx     // Breadcrumb navigation
    └── Menu.tsx            // Dropdown menu
```

### Dashboard Widgets
```typescript
// components/dashboard/widgets/
├── ActivePoVs.tsx          // Active PoVs counter
├── SuccessRate.tsx         // Success rate chart
├── Milestones.tsx          // Milestone timeline
├── ResourceUsage.tsx       // Resource usage chart
├── RiskOverview.tsx        // Risk indicators
└── TeamStatus.tsx          // Team activity feed
```

### PoV Management Components
```typescript
// components/pov/
├── Creation/
│   ├── BasicInfoForm.tsx   // Step 1: Basic information
│   ├── TeamSelection.tsx   // Step 2: Team selection
│   ├── WorkflowSetup.tsx   // Step 3: Workflow definition
│   ├── MetricsGoals.tsx    // Step 4: Metrics and goals
│   ├── Resources.tsx       // Step 5: Resources
│   └── Review.tsx          // Step 6: Review and launch
├── Details/
│   ├── PoVHeader.tsx       // PoV header with actions
│   ├── StatusSection.tsx   // Status and progress
│   ├── TeamSection.tsx     // Team members
│   ├── TasksSection.tsx    // Related tasks
│   └── DocumentsSection.tsx // Associated documents
└── List/
    ├── PoVList.tsx         // PoV list view
    ├── PoVCard.tsx         // PoV card component
    └── PoVFilters.tsx      // List filters
```

### Task Management Components
```typescript
// components/tasks/
├── TaskList.tsx            // Task list view
├── TaskCard.tsx            // Individual task card
├── TaskForm.tsx            // Task creation/edit form
└── TaskFilters.tsx         // Task filtering options
```

### Integration Components
```typescript
// components/integrations/
├── Salesforce/
│   ├── ConnectionStatus.tsx // Connection status
│   ├── SyncStatus.tsx      // Sync status and controls
│   └── Config.tsx          // Configuration form
├── Slack/
│   ├── ConnectionStatus.tsx
│   ├── NotificationConfig.tsx
│   └── ChannelSelect.tsx
└── Email/
    ├── ConnectionStatus.tsx
    ├── TemplateEditor.tsx
    └── Config.tsx
```

## Component Guidelines

### 1. Type-Safe Shadcn Component Structure
```typescript
// Type-safe component template
import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// Type-safe variants using class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

// Type-safe props with validation
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Type-safe component implementation
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// Type-safe form component example
interface FormFieldContextValue<TFieldValues extends FieldValues> {
  name: FieldPath<TFieldValues>
}

const FormFieldContext = React.createContext<FormFieldContextValue<any>>({} as FormFieldContextValue<any>)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

// Type-safe dialog component example
interface DialogProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> {
  container?: HTMLElement
}

const Dialog = ({ children, container, ...props }: DialogProps) => {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPortal container={container}>
        {children}
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}
Dialog.displayName = DialogPrimitive.Root.displayName

// Type-safe select component example
interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  container?: HTMLElement
}

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName
```

### 2. Type-Safe State Management
```typescript
// Type-safe React Query hooks
interface QueryConfig<T> {
  key: string[];
  fn: () => Promise<T>;
  options?: {
    staleTime?: number;
    cacheTime?: number;
    retry?: number | boolean;
    refetchInterval?: number | false;
    refetchOnWindowFocus?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  };
}

function useTypedQuery<T>({ key, fn, options }: QueryConfig<T>) {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn: fn,
    ...options
  });
}

// Type-safe Zustand store
interface Store<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  setData: (data: T) => void;
  setError: (error: Error) => void;
  reset: () => void;
}

const createTypedStore = <T,>() =>
  create<Store<T>>((set) => ({
    data: null,
    loading: false,
    error: null,
    setData: (data) => set({ data, loading: false, error: null }),
    setError: (error) => set({ error, loading: false }),
    reset: () => set({ data: null, loading: false, error: null })
  }));

// Type-safe local state hook
interface LocalState<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  reset: () => void;
}

function useLocalState<T>(initialValue: T): LocalState<T> {
  const [value, setValue] = useState<T>(initialValue);
  const reset = useCallback(() => setValue(initialValue), [initialValue]);
  return { value, setValue, reset };
}

// Type-safe responsive state
interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function useResponsiveState(): ResponsiveState {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));
  // ... implementation
  return {
    isMobile: !matches,
    isTablet: matches && !useMediaQuery(theme.breakpoints.up('md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('lg')),
    breakpoint: // ... determine current breakpoint
  };
}
```

### 3. Type-Safe Navigation Patterns
```typescript
// Type-safe route configuration
interface RouteConfig {
  path: string;
  component: React.ComponentType<any>;
  layout?: React.ComponentType<any>;
  auth?: {
    required: boolean;
    roles?: UserRole[];
  };
  meta?: {
    title: string;
    description?: string;
  };
  children?: RouteConfig[];
}

// Type-safe navigation hook
interface Navigation {
  current: RouteConfig;
  parent?: RouteConfig;
  params: Record<string, string>;
  push: (path: string, params?: Record<string, string>) => Promise<void>;
  replace: (path: string, params?: Record<string, string>) => Promise<void>;
  back: () => void;
}

function useTypedNavigation(): Navigation {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // ... implementation
  
  return {
    current: findRouteByPath(pathname),
    parent: findParentRoute(pathname),
    params: Object.fromEntries(searchParams.entries()),
    push: router.push,
    replace: router.replace,
    back: router.back
  };
}

// Type-safe menu configuration
interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ComponentType;
  children?: MenuItem[];
  roles?: UserRole[];
  action?: () => void;
}

interface MenuState {
  expanded: string[];
  selected: string | null;
  toggleExpanded: (id: string) => void;
  setSelected: (id: string) => void;
}

function useMenuState(): MenuState {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  
  const toggleExpanded = useCallback((id: string) => {
    setExpanded(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);
  
  return {
    expanded,
    selected,
    toggleExpanded,
    setSelected
  };
}

// Type-safe focus management
interface FocusManager {
  ref: React.RefObject<HTMLElement>;
  focused: boolean;
  focusable: boolean;
  focus: () => void;
  blur: () => void;
  registerKeyboardHandler: (
    key: string,
    handler: (event: KeyboardEvent) => void
  ) => void;
}

function useFocusManager(): FocusManager {
  const ref = useRef<HTMLElement>(null);
  const [focused, setFocused] = useState(false);
  
  // ... implementation
  
  return {
    ref,
    focused,
    focusable: true,
    focus: () => ref.current?.focus(),
    blur: () => ref.current?.blur(),
    registerKeyboardHandler: (key, handler) => {
      // ... implementation
    }
  };
}
```

### 4. Type-Safe Styling System
```typescript
// Type-safe theme extension
interface CustomTheme extends Theme {
  custom: {
    colors: {
      brand: {
        primary: string;
        secondary: string;
        accent: string;
      };
      state: {
        success: string;
        warning: string;
        error: string;
        info: string;
      };
      semantic: {
        [key: string]: string;
      };
    };
    typography: {
      fontFamilies: {
        primary: string;
        secondary: string;
        monospace: string;
      };
      lineHeights: {
        tight: number;
        normal: number;
        relaxed: number;
      };
      letterSpacings: {
        tight: string;
        normal: string;
        wide: string;
      };
    };
    spacing: {
      base: number;
      scale: (level: number) => number;
      getSpace: (space: keyof Theme['spacing'] | number) => string;
    };
    elevation: {
      low: string;
      medium: string;
      high: string;
      modal: string;
    };
    animation: {
      durations: {
        instant: number;
        fast: number;
        normal: number;
        slow: number;
      };
      curves: {
        linear: string;
        ease: string;
        bounce: string;
        elastic: string;
      };
    };
  };
}

// Type-safe styled components
interface StyledSystemProps {
  // Layout
  display?: React.CSSProperties['display'];
  position?: React.CSSProperties['position'];
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  
  // Spacing
  m?: number | string;
  mt?: number | string;
  mr?: number | string;
  mb?: number | string;
  ml?: number | string;
  mx?: number | string;
  my?: number | string;
  p?: number | string;
  pt?: number | string;
  pr?: number | string;
  pb?: number | string;
  pl?: number | string;
  px?: number | string;
  py?: number | string;
  
  // Typography
  fontSize?: keyof Theme['typography']['fontSize'];
  fontWeight?: keyof Theme['typography']['fontWeight'];
  lineHeight?: keyof Theme['typography']['lineHeight'];
  textAlign?: React.CSSProperties['textAlign'];
  
  // Colors
  color?: keyof Theme['palette'];
  bg?: keyof Theme['palette'];
  opacity?: number;
  
  // Borders
  border?: string;
  borderColor?: keyof Theme['palette'];
  borderRadius?: keyof Theme['shape']['borderRadius'];
  
  // Flexbox
  flex?: React.CSSProperties['flex'];
  flexDirection?: React.CSSProperties['flexDirection'];
  justifyContent?: React.CSSProperties['justifyContent'];
  alignItems?: React.CSSProperties['alignItems'];
  flexWrap?: React.CSSProperties['flexWrap'];
  gap?: number | string;
}

// Type-safe style generation
function createStyles<T extends string>(
  styles: Record<T, React.CSSProperties | ((theme: CustomTheme) => React.CSSProperties)>
) {
  return styles;
}

// Type-safe responsive styles
type ResponsiveValue<T> = T | Partial<Record<keyof Theme['breakpoints']['values'], T>>;

interface ResponsiveStyles {
  createResponsiveStyles: <T>(
    property: keyof React.CSSProperties,
    value: ResponsiveValue<T>,
    transform?: (value: T) => string | number
  ) => Record<string, string | number>;
}

// Type-safe CSS-in-JS
interface StyleFunction<Props extends Record<string, unknown>> {
  (props: { theme: CustomTheme } & Props): React.CSSProperties;
}

function styled<Props extends Record<string, unknown>>(
  component: React.ComponentType<Props>
): (
  styles: StyleFunction<Props> | React.CSSProperties
) => React.ComponentType<Props & StyledSystemProps>;
```

### 5. Type-Safe Accessibility System
```typescript
// Type-safe ARIA attributes
interface AriaAttributes {
  role?: React.AriaRole;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-details'?: string;
  'aria-hidden'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-keyshortcuts'?: string;
  'aria-modal'?: boolean;
  'aria-multiline'?: boolean;
  'aria-multiselectable'?: boolean;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-placeholder'?: string;
  'aria-pressed'?: boolean | 'mixed';
  'aria-readonly'?: boolean;
  'aria-required'?: boolean;
  'aria-selected'?: boolean;
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
  'aria-valuemax'?: number;
  'aria-valuemin'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
}

// Type-safe keyboard navigation
interface KeyboardNavigation {
  registerKeyHandler: (
    key: string,
    handler: (event: KeyboardEvent) => void,
    options?: {
      preventDefault?: boolean;
      stopPropagation?: boolean;
    }
  ) => void;
  
  unregisterKeyHandler: (key: string) => void;
  
  createKeyboardNavigator: (config: {
    items: Array<{ id: string; disabled?: boolean }>;
    orientation?: 'horizontal' | 'vertical';
    loop?: boolean;
    typeAhead?: boolean;
  }) => {
    handleKeyDown: (event: KeyboardEvent) => void;
    getCurrentItem: () => string;
    setCurrentItem: (id: string) => void;
  };
}

// Type-safe heading system
interface HeadingSystem {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  registerHeading: (level: HeadingSystem['level']) => void;
  unregisterHeading: (level: HeadingSystem['level']) => void;
  validateHierarchy: () => {
    valid: boolean;
    errors: Array<{
      level: HeadingSystem['level'];
      message: string;
    }>;
  };
}

// Type-safe focus management
interface FocusSystem {
  trapFocus: (
    element: HTMLElement,
    options?: {
      initialFocus?: string | HTMLElement;
      returnFocus?: boolean;
      escapeDeactivates?: boolean;
      allowOutsideClick?: boolean;
    }
  ) => void;
  
  releaseFocus: () => void;
  
  createFocusGroup: (config: {
    items: Array<{ id: string; focusable: boolean }>;
    direction?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
  }) => {
    handleKeyDown: (event: KeyboardEvent) => void;
    focusItem: (id: string) => void;
    getCurrentFocus: () => string;
  };
}

// Type-safe screen reader support
interface ScreenReaderSystem {
  announce: (
    message: string,
    options?: {
      priority?: 'polite' | 'assertive';
      delay?: number;
      clearQueue?: boolean;
    }
  ) => void;
  
  describedBy: (
    elementId: string,
    description: string
  ) => string;
  
  labelledBy: (
    elementId: string,
    label: string
  ) => string;
  
  createLiveRegion: (options?: {
    priority?: 'polite' | 'assertive';
    clearOnUpdate?: boolean;
  }) => {
    id: string;
    update: (content: string) => void;
    clear: () => void;
  };
}
```

### 6. Type-Safe Testing System
```typescript
// Type-safe test utilities
interface TestUtils<T extends Record<string, unknown>> {
  // Type-safe component rendering
  render: (
    component: React.ReactElement,
    options?: {
      initialProps?: Partial<T>;
      wrapper?: React.ComponentType;
      theme?: CustomTheme;
      router?: {
        route: string;
        params?: Record<string, string>;
      };
    }
  ) => {
    container: HTMLElement;
    rerender: (newProps: Partial<T>) => void;
    unmount: () => void;
    debug: () => void;
  };

  // Type-safe event simulation
  fireEvent: {
    click: (element: HTMLElement, options?: MouseEventInit) => void;
    change: (
      element: HTMLElement,
      value: string | boolean | number
    ) => void;
    submit: (form: HTMLFormElement) => void;
    keyDown: (
      element: HTMLElement,
      key: string,
      options?: KeyboardEventInit
    ) => void;
    focus: (element: HTMLElement) => void;
    blur: (element: HTMLElement) => void;
  };

  // Type-safe queries
  queries: {
    getByRole: <K extends React.AriaRole>(
      role: K,
      options?: { name?: string }
    ) => HTMLElement;
    getByText: (text: string | RegExp) => HTMLElement;
    getByTestId: (id: string) => HTMLElement;
    queryByRole: <K extends React.AriaRole>(
      role: K,
      options?: { name?: string }
    ) => HTMLElement | null;
    findByText: (
      text: string | RegExp
    ) => Promise<HTMLElement>;
  };

  // Type-safe assertions
  expect: {
    toBeInTheDocument: () => void;
    toBeVisible: () => void;
    toBeDisabled: () => void;
    toHaveAttribute: (name: string, value?: string) => void;
    toHaveStyle: (style: React.CSSProperties) => void;
    toHaveClass: (className: string) => void;
  };

  // Type-safe mocks
  mock: {
    fn: <Args extends any[], Return>(
      implementation?: (...args: Args) => Return
    ) => jest.Mock<Return, Args>;
    spyOn: <T extends object, K extends keyof T>(
      object: T,
      method: K
    ) => jest.SpyInstance;
    resetAll: () => void;
  };
}

// Type-safe test configuration
interface TestConfig {
  setupTests: (config: {
    theme?: CustomTheme;
    router?: {
      routes: RouteConfig[];
      initialRoute: string;
    };
    providers?: React.ComponentType[];
  }) => void;
  
  cleanup: () => void;
  
  createWrapper: (
    providers: React.ComponentType[]
  ) => React.ComponentType;
}

// Type-safe component testing
interface ComponentTest<Props> {
  // Test suite configuration
  describe: (
    name: string,
    fn: (utils: TestUtils<Props>) => void
  ) => void;
  
  // Individual test cases
  it: (
    name: string,
    fn: (utils: TestUtils<Props>) => Promise<void> | void
  ) => void;
  
  // Setup and teardown
  beforeEach: (fn: () => void) => void;
  afterEach: (fn: () => void) => void;
  
  // Snapshot testing
  snapshot: (
    props: Props,
    options?: {
      theme?: CustomTheme;
      viewport?: 'mobile' | 'tablet' | 'desktop';
    }
  ) => void;
}
```

### 7. Type-Safe Performance System
```typescript
// Type-safe performance monitoring
interface PerformanceSystem {
  // Component performance tracking
  tracking: {
    measureRender: (
      component: string,
      phase: 'mount' | 'update' | 'unmount'
    ) => void;
    
    measureEffect: (
      component: string,
      effect: string
    ) => void;
    
    measureCallback: (
      component: string,
      callback: string
    ) => void;
    
    getMetrics: () => {
      renders: Record<string, {
        count: number;
        totalTime: number;
        average: number;
      }>;
      effects: Record<string, {
        count: number;
        totalTime: number;
        average: number;
      }>;
      callbacks: Record<string, {
        count: number;
        totalTime: number;
        average: number;
      }>;
    };
  };

  // Code splitting configuration
  codeSplitting: {
    prefetch: (
      components: string[],
      options?: {
        priority?: 'low' | 'high';
        timeout?: number;
      }
    ) => void;
    
    preload: (
      components: string[],
      options?: {
        priority?: 'low' | 'high';
        timeout?: number;
      }
    ) => void;
    
    registerChunk: (
      name: string,
      chunk: () => Promise<any>
    ) => void;
  };

  // Re-render optimization
  optimization: {
    memoize: <Props extends Record<string, unknown>>(
      component: React.ComponentType<Props>,
      options?: {
        propsAreEqual?: (
          prevProps: Props,
          nextProps: Props
        ) => boolean;
        debug?: boolean;
      }
    ) => React.MemoExoticComponent<React.ComponentType<Props>>;
    
    useCallback: <T extends (...args: any[]) => any>(
      callback: T,
      deps: React.DependencyList,
      options?: {
        debug?: boolean;
      }
    ) => T;
    
    useMemo: <T>(
      factory: () => T,
      deps: React.DependencyList,
      options?: {
        debug?: boolean;
      }
    ) => T;
  };

  // Loading state management
  loading: {
    Suspense: React.ComponentType<{
      fallback: React.ReactNode;
      children: React.ReactNode;
    }>;
    
    lazy: <T extends React.ComponentType<any>>(
      factory: () => Promise<{ default: T }>,
      options?: {
        suspense?: boolean;
        timeout?: number;
      }
    ) => T;
    
    useTransition: () => [boolean, (callback: () => void) => void];
  };

  // Bundle size monitoring
  bundleSize: {
    monitor: (
      options?: {
        warning?: number;
        error?: number;
        exclude?: string[];
      }
    ) => void;
    
    analyze: () => {
      total: number;
      chunks: Record<string, number>;
      modules: Record<string, number>;
      assets: Record<string, number>;
    };
    
    optimize: (
      options?: {
        minify?: boolean;
        compress?: boolean;
        splitChunks?: boolean;
      }
    ) => void;
  };
}

// Example usage
const performance = {
  tracking: {
    measureRender: (component, phase) => {
      performance.mark(`${component}-${phase}-start`);
      return () => {
        performance.mark(`${component}-${phase}-end`);
        performance.measure(
          `${component}-${phase}`,
          `${component}-${phase}-start`,
          `${component}-${phase}-end`
        );
      };
    }
  },
  
  optimization: {
    memoize: (component, options) => {
      return React.memo(
        component,
        options?.propsAreEqual
      );
    }
  }
};
```

## Implementation Priority

1. **Foundation (Week 1)**
   - Layout components
   - Basic UI components
   - Theme setup
   - Navigation structure

2. **Dashboard (Week 2)**
   - Widget components
   - Data visualization
   - Dashboard layout
   - Initial integration

3. **PoV Management (Weeks 3-4)**
   - Creation workflow
   - List view
   - Detail view
   - Team management

4. **Task System (Week 5)**
   - Task management components
   - Integration with PoVs
   - Filtering and sorting
   - Notifications

5. **Integrations (Week 6)**
   - Salesforce connection
   - Slack integration
   - Email system
   - Sync management

6. **Polish (Week 7)**
   - Performance optimization
   - Accessibility improvements
   - Documentation
   - Testing
