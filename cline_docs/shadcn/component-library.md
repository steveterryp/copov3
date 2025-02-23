# Shadcn Component Library

## Core Components

### 1. Button System
```typescript
// Type-safe button variants
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
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Type-safe button component
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {props.children}
      </Comp>
    );
  }
);
Button.displayName = "Button";
```

### 2. Form Components
```typescript
// Type-safe form field
interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
}

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
  );
};

// Type-safe input component
interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Type-safe select component
interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";
```

### 3. Dialog System
```typescript
// Type-safe dialog component
interface DialogProps extends DialogPrimitive.DialogProps {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  content?: React.ReactNode;
  footer?: React.ReactNode;
}

const Dialog = ({
  trigger,
  title,
  description,
  content,
  footer,
  ...props
}: DialogProps) => (
  <DialogPrimitive.Root {...props}>
    {trigger && (
      <DialogPrimitive.Trigger asChild>
        {trigger}
      </DialogPrimitive.Trigger>
    )}
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
        {title && (
          <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
            {title}
          </DialogPrimitive.Title>
        )}
        {description && (
          <DialogPrimitive.Description className="text-sm text-muted-foreground">
            {description}
          </DialogPrimitive.Description>
        )}
        {content}
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);
```

### 4. Navigation
```typescript
// Type-safe navigation menu
interface NavigationMenuProps {
  items: {
    title: string;
    href: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}

const NavigationMenu = ({ items }: NavigationMenuProps) => {
  return (
    <NavigationMenuPrimitive.Root className="relative z-10 flex max-w-max flex-1 items-center justify-center">
      <NavigationMenuPrimitive.List className="group flex flex-1 list-none items-center justify-center space-x-1">
        {items.map((item) => (
          <NavigationMenuPrimitive.Item key={item.href}>
            <NavigationMenuPrimitive.Trigger
              className={cn(
                "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
              )}
            >
              {item.icon && (
                <item.icon className="mr-2 h-4 w-4" />
              )}
              {item.title}
            </NavigationMenuPrimitive.Trigger>
            <NavigationMenuPrimitive.Content
              className={cn(
                "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 absolute left-0 top-0 w-full md:w-auto"
              )}
            >
              <div className="w-[var(--radix-navigation-menu-viewport-width)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
                <div className="p-4">
                  <div className="text-sm font-medium leading-none">
                    {item.title}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm leading-snug text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </NavigationMenuPrimitive.Content>
          </NavigationMenuPrimitive.Item>
        ))}
      </NavigationMenuPrimitive.List>
    </NavigationMenuPrimitive.Root>
  );
};
```

## Custom Components

### 1. Extended Components
```typescript
// Type-safe card component with hover effect
interface HoverCardProps extends CardProps {
  hoverContent: React.ReactNode;
  hoverPlacement?: 'top' | 'bottom' | 'left' | 'right';
}

const HoverCard = ({
  children,
  hoverContent,
  hoverPlacement = 'top',
  ...props
}: HoverCardProps) => {
  return (
    <HoverCardPrimitive.Root>
      <HoverCardPrimitive.Trigger asChild>
        <Card {...props}>{children}</Card>
      </HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Content
        align="center"
        sideOffset={4}
        side={hoverPlacement}
        className={cn(
          "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          hoverPlacement === 'top' && "data-[side=top]:slide-in-from-bottom-2",
          hoverPlacement === 'bottom' && "data-[side=bottom]:slide-in-from-top-2",
          hoverPlacement === 'left' && "data-[side=left]:slide-in-from-right-2",
          hoverPlacement === 'right' && "data-[side=right]:slide-in-from-left-2"
        )}
      >
        {hoverContent}
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Root>
  );
};
```

### 2. Composition Patterns
```typescript
// Type-safe form section
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const FormSection = ({
  title,
  description,
  children,
  actions
}: FormSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
      {actions && (
        <div className="flex justify-end space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};

// Usage example
function UserProfileForm() {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormSection
          title="Personal Information"
          description="Update your personal details"
          actions={
            <>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </>
          }
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Other form fields */}
        </FormSection>
      </form>
    </Form>
  );
}
```

### 3. State Management
```typescript
// Type-safe form state
interface FormState<T> {
  data: T;
  errors: Record<keyof T, string[]>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

const useFormState = <T extends Record<string, any>>(
  initialData: T
) => {
  const [state, setState] = React.useState<FormState<T>>({
    data: initialData,
    errors: {} as Record<keyof T, string[]>,
    touched: {} as Record<keyof T, boolean>,
    isSubmitting: false,
    isValid: true
  });

  const setFieldValue = (
    field: keyof T,
    value: T[keyof T]
  ) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value
      },
      touched: {
        ...prev.touched,
        [field]: true
      }
    }));
  };

  const setFieldError = (
    field: keyof T,
    errors: string[]
  ) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: errors
      },
      isValid: false
    }));
  };

  const reset = () => {
    setState({
      data: initialData,
      errors: {} as Record<keyof T, string[]>,
      touched: {} as Record<keyof T, boolean>,
      isSubmitting: false,
      isValid: true
    });
  };

  return {
    state,
    setFieldValue,
    setFieldError,
    reset
  };
};
```

## Best Practices

1. **Component Design**
   - Use Radix UI primitives
   - Maintain type safety
   - Follow accessibility guidelines
   - Support keyboard navigation

2. **Composition**
   - Create reusable patterns
   - Use compound components
   - Leverage context when needed
   - Keep components focused

3. **State Management**
   - Use controlled components
   - Implement proper validation
   - Handle loading states
   - Manage side effects

4. **Performance**
   - Memoize when necessary
   - Lazy load components
   - Optimize re-renders
   - Use proper keys

## Related Documentation
- [Component Architecture](../componentArchitecture.md)
- [Style & Aesthetic Guidelines](../styleAesthetic.md)
- [Migration Plan](../migration/mui-to-shadcn.md)
- [Tailwind Configuration](../tailwind/configuration.md)
