# Tailwind Configuration

## Setup

### 1. Base Configuration
```typescript
// tailwind.config.ts
import { type Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'collapsible-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-out',
        'collapsible-up': 'collapsible-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
```

### 2. Custom Plugins

#### Animation Plugin
```typescript
// plugins/animation.ts
import plugin from 'tailwindcss/plugin';

export const animationPlugin = plugin(
  ({ addUtilities }) => {
    addUtilities({
      '.animate-in': {
        animationDuration: '150ms',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        animationFillMode: 'forwards',
      },
      '.animate-out': {
        animationDuration: '150ms',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        animationFillMode: 'forwards',
      },
      '.fade-in': {
        opacity: '0',
        animation: 'fade-in 150ms ease-out',
        animationFillMode: 'forwards',
      },
      '.fade-out': {
        animation: 'fade-out 150ms ease-in',
        animationFillMode: 'forwards',
      },
      '.slide-in-from-top': {
        transform: 'translateY(-100%)',
        animation: 'slide-in-from-top 150ms ease-out',
        animationFillMode: 'forwards',
      },
      '.slide-out-to-top': {
        animation: 'slide-out-to-top 150ms ease-in',
        animationFillMode: 'forwards',
      },
    });
  }
);
```

#### Typography Plugin
```typescript
// plugins/typography.ts
import plugin from 'tailwindcss/plugin';

export const typographyPlugin = plugin(
  ({ addComponents, theme }) => {
    addComponents({
      '.prose': {
        '--tw-prose-body': theme('colors.foreground'),
        '--tw-prose-headings': theme('colors.foreground'),
        '--tw-prose-lead': theme('colors.muted.foreground'),
        '--tw-prose-links': theme('colors.primary.DEFAULT'),
        '--tw-prose-bold': theme('colors.foreground'),
        '--tw-prose-counters': theme('colors.muted.foreground'),
        '--tw-prose-bullets': theme('colors.muted.foreground'),
        '--tw-prose-hr': theme('colors.border'),
        '--tw-prose-quotes': theme('colors.foreground'),
        '--tw-prose-quote-borders': theme('colors.border'),
        '--tw-prose-captions': theme('colors.muted.foreground'),
        '--tw-prose-code': theme('colors.foreground'),
        '--tw-prose-pre-code': theme('colors.primary.foreground'),
        '--tw-prose-pre-bg': theme('colors.primary.DEFAULT'),
        '--tw-prose-th-borders': theme('colors.border'),
        '--tw-prose-td-borders': theme('colors.border'),
      },
    });
  }
);
```

### 3. Utility Patterns

#### Container Pattern
```typescript
// patterns/container.ts
import { cva } from 'class-variance-authority';

export const containerVariants = cva(
  'mx-auto px-4 sm:px-6 lg:px-8',
  {
    variants: {
      size: {
        sm: 'max-w-4xl',
        md: 'max-w-5xl',
        lg: 'max-w-6xl',
        xl: 'max-w-7xl',
      },
      padding: {
        none: 'p-0',
        sm: 'py-4',
        md: 'py-8',
        lg: 'py-12',
      },
    },
    defaultVariants: {
      size: 'lg',
      padding: 'md',
    },
  }
);
```

#### Grid Pattern
```typescript
// patterns/grid.ts
import { cva } from 'class-variance-authority';

export const gridVariants = cva(
  'grid',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      },
      gap: {
        none: 'gap-0',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
      },
      responsive: {
        true: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      },
    },
    defaultVariants: {
      cols: 3,
      gap: 'md',
    },
  }
);
```

## Integration

### 1. Component Patterns
```typescript
// Example: Card component with Tailwind patterns
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const cardVariants = cva(
  'rounded-lg bg-card text-card-foreground',
  {
    variants: {
      variant: {
        default: 'border border-border shadow-sm',
        bordered: 'border-2 border-border',
        elevated: 'shadow-lg',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export function Card({
  className,
  variant,
  padding,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}
```

### 2. Theme Integration
```typescript
// Example: Theme integration with CSS variables
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
```

### 3. Custom Utilities
```typescript
// Example: Custom utility classes
const customUtilities = {
  '.clickable': {
    '@apply cursor-pointer hover:opacity-80 active:opacity-70 transition-opacity': {},
  },
  '.focus-ring': {
    '@apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2': {},
  },
  '.truncate-2': {
    '@apply line-clamp-2': {},
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  },
  '.glass': {
    '@apply bg-background/80 backdrop-blur-sm border border-border/50': {},
  },
};

// Usage in components
function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass rounded-lg p-6">
      {children}
    </div>
  );
}
```

## Best Practices

1. **Organization**
   - Group related utilities with @apply
   - Use consistent naming conventions
   - Create reusable patterns
   - Document custom utilities

2. **Performance**
   - Use JIT mode for faster builds
   - Purge unused styles
   - Minimize custom CSS
   - Leverage built-in utilities

3. **Maintainability**
   - Create component variants
   - Use CSS variables for theming
   - Document custom patterns
   - Follow naming conventions

4. **Accessibility**
   - Use semantic HTML
   - Include focus states
   - Maintain color contrast
   - Support reduced motion

## Related Documentation
- [Component Architecture](../componentArchitecture.md)
- [Style & Aesthetic Guidelines](../styleAesthetic.md)
- [Migration Plan](../migration/mui-to-shadcn.md)
- [Shadcn Patterns](../migration/shadcn-patterns.md)
