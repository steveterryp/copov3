# Shadcn Implementation Patterns

## Component Patterns

### 1. Form Handling
```typescript
// Type-safe form pattern with Zod schema
const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'manager']),
  permissions: z.array(z.string()).min(1)
});

type FormValues = z.infer<typeof formSchema>;

export function UserForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      role: 'user',
      permissions: []
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### 2. Dialog System
```typescript
// Type-safe dialog pattern
interface DialogProps extends React.ComponentProps<typeof Dialog> {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DialogWrapper({
  title,
  description,
  children,
  footer,
  ...props
}: DialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-4">{children}</div>
        
        {footer && (
          <DialogFooter>{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Usage example
function DeleteConfirmation() {
  return (
    <DialogWrapper
      title="Delete Item"
      description="Are you sure you want to delete this item? This action cannot be undone."
      footer={
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      }
    >
      <p className="text-muted-foreground">
        This will permanently delete the item and all associated data.
      </p>
    </DialogWrapper>
  );
}
```

### 3. Navigation Patterns
```typescript
// Type-safe navigation pattern
interface NavigationItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
}

interface NavigationProps {
  items: NavigationItem[];
  orientation?: 'horizontal' | 'vertical';
  collapsible?: boolean;
}

export function Navigation({ 
  items,
  orientation = 'vertical',
  collapsible = false
}: NavigationProps) {
  return (
    <nav className={cn(
      'flex',
      orientation === 'vertical' ? 'flex-col' : 'flex-row',
      'gap-2'
    )}>
      {items.map((item) => (
        <div key={item.href} className="relative">
          {collapsible && item.children ? (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  {item.icon && (
                    <item.icon className="mr-2 h-4 w-4" />
                  )}
                  {item.title}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4">
                <Navigation 
                  items={item.children}
                  orientation="vertical"
                />
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <Link
              href={item.href}
              className={buttonVariants({
                variant: 'ghost',
                className: 'w-full justify-start'
              })}
            >
              {item.icon && (
                <item.icon className="mr-2 h-4 w-4" />
              )}
              {item.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
```

### 4. Data Display
```typescript
// Type-safe data display pattern
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: {
    pageSize: number;
    pageIndex: number;
    pageCount: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (field: string) => void;
  };
}

export function DataTable<T>({
  data,
  columns,
  pagination,
  sorting
}: DataTableProps<T>) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  column.className,
                  sorting && 'cursor-pointer select-none'
                )}
                onClick={() => sorting?.onSort(column.id)}
              >
                {column.header}
                {sorting?.sortBy === column.id && (
                  <SortIcon
                    className="ml-2 h-4 w-4"
                    direction={sorting.sortOrder}
                  />
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((column) => (
                <TableCell key={column.id}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {pagination && (
        <div className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{' '}
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              data.length
            )}{' '}
            of {data.length} entries
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => 
                    pagination.onPageChange(pagination.pageIndex - 1)
                  }
                  disabled={pagination.pageIndex === 0}
                />
              </PaginationItem>
              {/* Page numbers */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => 
                    pagination.onPageChange(pagination.pageIndex + 1)
                  }
                  disabled={
                    pagination.pageIndex === pagination.pageCount - 1
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
```

## Theme Configuration

### 1. Color System
```typescript
// Type-safe color system
const colors = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },
  muted: {
    DEFAULT: "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  accent: {
    DEFAULT: "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  card: {
    DEFAULT: "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
} as const;

// CSS variables in globals.css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... other color variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... other dark mode color variables */
}
```

### 2. Typography
```typescript
// Type-safe typography system
const typography = {
  fontFamily: {
    sans: ['var(--font-sans)', ...fontFamily.sans],
    mono: ['var(--font-mono)', ...fontFamily.mono],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;
```

### 3. Spacing
```typescript
// Type-safe spacing system
const spacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;
```

### 4. Animation
```typescript
// Type-safe animation system
const animation = {
  keyframes: {
    "accordion-down": {
      from: { height: "0" },
      to: { height: "var(--radix-accordion-content-height)" },
    },
    "accordion-up": {
      from: { height: "var(--radix-accordion-content-height)" },
      to: { height: "0" },
    },
    "collapsible-down": {
      from: { height: "0" },
      to: { height: "var(--radix-collapsible-content-height)" },
    },
    "collapsible-up": {
      from: { height: "var(--radix-collapsible-content-height)" },
      to: { height: "0" },
    },
  },
  animation: {
    "accordion-down": "accordion-down 0.2s ease-out",
    "accordion-up": "accordion-up 0.2s ease-out",
    "collapsible-down": "collapsible-down 0.2s ease-out",
    "collapsible-up": "collapsible-up 0.2s ease-out",
  },
} as const;

// Animation utilities
const animationUtils = {
  fadeIn: 'animate-in fade-in',
  fadeOut: 'animate-out fade-out',
  slideIn: 'animate-in slide-in-from-bottom',
  slideOut: 'animate-out slide-out-to-bottom',
  zoomIn: 'animate-in zoom-in',
  zoomOut: 'animate-out zoom-out',
} as const;
```

## Best Practices

1. **Component Composition**
   - Use Radix UI primitives for accessibility
   - Compose components using Tailwind classes
   - Leverage class-variance-authority for variants
   - Maintain type safety throughout

2. **Theme Consistency**
   - Use CSS variables for theming
   - Follow the color system hierarchy
   - Maintain consistent spacing
   - Use predefined animations

3. **Accessibility**
   - Implement proper ARIA attributes
   - Ensure keyboard navigation
   - Maintain color contrast
   - Support screen readers

4. **Performance**
   - Use CSS variables for dynamic values
   - Leverage Tailwind's JIT compiler
   - Minimize runtime calculations
   - Optimize bundle size

## Related Documentation
- [Component Architecture](../componentArchitecture.md)
- [Style & Aesthetic Guidelines](../styleAesthetic.md)
- [Migration Plan](./mui-to-shadcn.md)
- [Testing Strategy](./testing-strategy.md)
