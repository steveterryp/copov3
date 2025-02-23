# Style & Aesthetic Guidelines

[← Back to Documentation Index](./README.md)

## Purpose & Usage

This document serves as a comprehensive type-safe styling system for the application, ensuring consistent design implementation and maintainable code. It is used in several key scenarios:

1. **Component Development**
   - When creating new UI components, use these type definitions to ensure proper styling
   - Helps maintain consistency across components through shared theme tokens
   - Provides type safety for style properties, preventing runtime errors

2. **Theme Customization**
   - When customizing the application theme
   - When creating new theme variants
   - When implementing dark/light mode
   - When adapting styles for different clients

3. **Accessibility Compliance**
   - Ensures WCAG compliance through type-safe color contrast checking
   - Maintains proper focus management
   - Guarantees minimum touch target sizes
   - Enforces proper heading hierarchy

4. **Mobile & Responsive Design**
   - Defines type-safe breakpoints and responsive behavior
   - Ensures proper touch interactions
   - Manages performance optimizations
   - Handles device-specific features

5. **Performance Optimization**
   - Type-safe animation configurations
   - Proper loading strategies
   - Network and caching optimizations
   - Resource management

## When to Reference This Document

1. **Starting New Features**
   - Check component guidelines for proper structure
   - Review accessibility requirements
   - Understand responsive design needs

2. **Reviewing Code**
   - Verify style implementation follows guidelines
   - Ensure proper type usage
   - Check performance considerations

3. **Troubleshooting**
   - Debug styling issues
   - Verify theme token usage
   - Check responsive behavior
   - Investigate performance problems

4. **Making Design Decisions**
   - Reference existing patterns
   - Understand available customization options
   - Consider accessibility implications
   - Plan for responsive behavior

## Quick Links
- [Component Architecture](./componentArchitecture.md)
- [Functional Requirements](./functionalRequirements.md)
- [Tech Stack](./techStack.md)

## Core Design Principles

### 1. Notification Design
- **Visual Hierarchy**:
  - Critical alerts: Red accent
  - Important updates: Orange accent
  - General info: Blue accent
- **Placement**:
  - Top-right corner for notification bell
  - Slide-in notifications from top
  - Modal for critical alerts
- **Animation**:
  - Subtle entrance animations
  - Smooth transitions
  - Non-intrusive feedback

### 2. Feedback Mechanisms
- **Thumbs Up/Down**:
  - Clear visual states
  - Instant feedback
  - Undo capability
- **Comment Interface**:
  - Clean text input
  - Rich text support
  - Character count
- **Analytics Display**:
  - Clear data visualization
  - Trend indicators
  - Filter controls

### 3. Communication Elements
- **Chat Interface**:
  - Message bubbles
  - Status indicators
  - File previews
- **Group Discussions**:
  - Thread visualization
  - Member presence
  - Activity indicators
- **File Sharing**:
  - Drag-and-drop zones
  - Upload progress
  - Preview capabilities

### 4. Intelligence Features
- **Suggestions**:
  - Subtle highlighting
  - Quick-action buttons
  - Context indicators
- **Document Processing**:
  - Progress visualization
  - Error states
  - Success confirmation
- **Automation Rules**:
  - Visual flow builder
  - Condition indicators
  - Action previews

## Type-Safe Component Guidelines

### 1. Shadcn Theme System
```typescript
// Type-safe theme tokens
interface ThemeTokens {
  colors: {
    background: string;
    foreground: string;
    card: {
      DEFAULT: string;
      foreground: string;
    };
    popover: {
      DEFAULT: string;
      foreground: string;
    };
    primary: {
      DEFAULT: string;
      foreground: string;
    };
    secondary: {
      DEFAULT: string;
      foreground: string;
    };
    muted: {
      DEFAULT: string;
      foreground: string;
    };
    accent: {
      DEFAULT: string;
      foreground: string;
    };
    destructive: {
      DEFAULT: string;
      foreground: string;
    };
    border: string;
    input: string;
    ring: string;
  };
  radius: {
    DEFAULT: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  font: {
    sans: string;
    mono: string;
  };
}

// Example implementation
const theme: ThemeTokens = {
  colors: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    card: {
      DEFAULT: "hsl(var(--card))",
      foreground: "hsl(var(--card-foreground))"
    },
    popover: {
      DEFAULT: "hsl(var(--popover))",
      foreground: "hsl(var(--popover-foreground))"
    },
    primary: {
      DEFAULT: "hsl(var(--primary))",
      foreground: "hsl(var(--primary-foreground))"
    },
    secondary: {
      DEFAULT: "hsl(var(--secondary))",
      foreground: "hsl(var(--secondary-foreground))"
    },
    muted: {
      DEFAULT: "hsl(var(--muted))",
      foreground: "hsl(var(--muted-foreground))"
    },
    accent: {
      DEFAULT: "hsl(var(--accent))",
      foreground: "hsl(var(--accent-foreground))"
    },
    destructive: {
      DEFAULT: "hsl(var(--destructive))",
      foreground: "hsl(var(--destructive-foreground))"
    },
    border: "hsl(var(--border))",
    input: "hsl(var(--input))",
    ring: "hsl(var(--ring))"
  },
  radius: {
    DEFAULT: "var(--radius)",
    sm: "calc(var(--radius) - 2px)",
    md: "calc(var(--radius) + 2px)",
    lg: "calc(var(--radius) + 4px)",
    xl: "calc(var(--radius) + 6px)"
  },
  font: {
    sans: "var(--font-sans)",
    mono: "var(--font-mono)"
  }
}

// Type-safe component variants
interface ComponentVariants {
  button: {
    default: string;
    destructive: string;
    outline: string;
    secondary: string;
    ghost: string;
    link: string;
    sizes: {
      default: string;
      sm: string;
      lg: string;
      icon: string;
    };
  };
  input: {
    default: string;
    ghost: string;
    sizes: {
      default: string;
      sm: string;
      lg: string;
    };
  };
  select: {
    default: string;
    ghost: string;
    sizes: {
      default: string;
      sm: string;
      lg: string;
    };
  };
  dialog: {
    default: string;
    sizes: {
      default: string;
      sm: string;
      lg: string;
      xl: string;
      full: string;
    };
  };
}

// Example implementation
const variants: ComponentVariants = {
  button: {
    default: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    sizes: {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10"
    }
  },
  input: {
    default: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    ghost: "border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
    sizes: {
      default: "h-10",
      sm: "h-9",
      lg: "h-11"
    }
  },
  select: {
    default: "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    ghost: "border-none bg-transparent focus:ring-0 focus:ring-offset-0",
    sizes: {
      default: "h-10",
      sm: "h-9",
      lg: "h-11"
    }
  },
  dialog: {
    default: "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
    sizes: {
      default: "max-w-lg",
      sm: "max-w-sm",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-full"
    }
  }
}
```

### 2. Type-Safe Layout Components
```typescript
// Type-safe layout components
interface LayoutComponents {
  card: {
    base: React.CSSProperties;
    hover: React.CSSProperties;
    variants: {
      outlined: React.CSSProperties;
      elevated: React.CSSProperties;
      flat: React.CSSProperties;
    };
    sizes: {
      small: React.CSSProperties;
      medium: React.CSSProperties;
      large: React.CSSProperties;
    };
  };
  navigation: {
    base: React.CSSProperties;
    item: {
      base: React.CSSProperties;
      active: React.CSSProperties;
      hover: React.CSSProperties;
      disabled: React.CSSProperties;
    };
    variants: {
      vertical: React.CSSProperties;
      horizontal: React.CSSProperties;
      compact: React.CSSProperties;
    };
  };
  modal: {
    overlay: React.CSSProperties;
    container: React.CSSProperties;
    content: {
      base: React.CSSProperties;
      sizes: {
        small: React.CSSProperties;
        medium: React.CSSProperties;
        large: React.CSSProperties;
        fullscreen: React.CSSProperties;
      };
    };
    animations: {
      enter: React.CSSProperties;
      exit: React.CSSProperties;
    };
  };
}

// Example implementation
const layoutComponents: LayoutComponents = {
  card: {
    base: {
      borderRadius: theme.borderRadius.md,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      background: theme.colors.background.paper,
      transition: `all ${theme.transitions.duration.medium}ms ${theme.transitions.easing.easeInOut}`
    },
    hover: {
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
    },
    variants: {
      outlined: {
        boxShadow: 'none',
        border: `1px solid ${theme.colors.border.main}`
      },
      elevated: {
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
      },
      flat: {
        boxShadow: 'none'
      }
    },
    sizes: {
      small: { padding: theme.spacing.sm },
      medium: { padding: theme.spacing.md },
      large: { padding: theme.spacing.lg }
    }
  },
  // ... other layout components
};
```

## Type-Safe Animation System

### 1. Animation Configuration
```typescript
// Type-safe animation system
interface AnimationSystem {
  transitions: {
    timing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
    duration: {
      instant: number;
      fast: number;
      normal: number;
      slow: number;
    };
    reducedMotion: {
      enabled: boolean;
      duration: number;
    };
  };
  keyframes: {
    fadeIn: React.CSSProperties[];
    fadeOut: React.CSSProperties[];
    slideIn: {
      top: React.CSSProperties[];
      bottom: React.CSSProperties[];
      left: React.CSSProperties[];
      right: React.CSSProperties[];
    };
    rotate: React.CSSProperties[];
    pulse: React.CSSProperties[];
  };
  feedback: {
    loading: {
      spinner: React.CSSProperties[];
      pulse: React.CSSProperties[];
      skeleton: React.CSSProperties[];
    };
    success: React.CSSProperties[];
    error: React.CSSProperties[];
  };
  stateChanges: {
    hover: React.CSSProperties;
    active: React.CSSProperties;
    selected: React.CSSProperties;
    disabled: React.CSSProperties;
    focus: React.CSSProperties;
  };
}

// Example implementation
const animations: AnimationSystem = {
  transitions: {
    timing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    duration: {
      instant: 0,
      fast: 150,
      normal: 300,
      slow: 450
    },
    reducedMotion: {
      enabled: true,
      duration: 0
    }
  },
  keyframes: {
    fadeIn: [
      { opacity: 0 },
      { opacity: 1 }
    ],
    fadeOut: [
      { opacity: 1 },
      { opacity: 0 }
    ],
    // ... other keyframes
  },
  // ... other animation configurations
};
```

## Type-Safe Accessibility System

### 1. Color Usage
```typescript
// Type-safe color contrast system
interface ColorContrastSystem {
  ratios: {
    normal: {
      AA: number;
      AAA: number;
    };
    large: {
      AA: number;
      AAA: number;
    };
  };
  combinations: {
    [key: string]: {
      background: string;
      foreground: string;
      ratio: number;
      passes: {
        AA: {
          normal: boolean;
          large: boolean;
        };
        AAA: {
          normal: boolean;
          large: boolean;
        };
      };
    };
  };
  utils: {
    calculateRatio: (bg: string, fg: string) => number;
    meetsWCAG: (ratio: number, level: 'AA' | 'AAA', size: 'normal' | 'large') => boolean;
    suggestColors: (color: string, target: 'AA' | 'AAA') => string[];
  };
}

// Example implementation
const colorContrast: ColorContrastSystem = {
  ratios: {
    normal: {
      AA: 4.5,
      AAA: 7.0
    },
    large: {
      AA: 3.0,
      AAA: 4.5
    }
  },
  combinations: {
    primary: {
      background: theme.colors.primary,
      foreground: theme.colors.background.main,
      ratio: 5.2,
      passes: {
        AA: {
          normal: true,
          large: true
        },
        AAA: {
          normal: false,
          large: true
        }
      }
    }
    // ... other color combinations
  }
};
```

### 2. Interactive Elements
```typescript
// Type-safe interactive elements system
interface InteractiveSystem {
  focus: {
    outlineWidth: number;
    outlineStyle: string;
    outlineColor: string;
    outlineOffset: number;
    ring?: {
      width: number;
      color: string;
      opacity: number;
    };
  };
  keyboard: {
    tabIndex: number;
    shortcuts: {
      [key: string]: {
        key: string;
        description: string;
        action: () => void;
      };
    };
    navigation: {
      arrowKeys: boolean;
      homeEnd: boolean;
      pageUpDown: boolean;
      trapFocus: boolean;
    };
  };
  touch: {
    minTargetSize: {
      width: number;
      height: number;
    };
    spacing: {
      horizontal: number;
      vertical: number;
    };
    feedback: {
      haptic: boolean;
      visual: boolean;
      audio: boolean;
    };
  };
}

// Example implementation
const interactive: InteractiveSystem = {
  focus: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: theme.colors.primary,
    outlineOffset: 2,
    ring: {
      width: 4,
      color: theme.colors.primary,
      opacity: 0.2
    }
  },
  keyboard: {
    tabIndex: 0,
    shortcuts: {
      save: {
        key: 'Ctrl+S',
        description: 'Save changes',
        action: () => console.log('Save')
      }
      // ... other shortcuts
    },
    navigation: {
      arrowKeys: true,
      homeEnd: true,
      pageUpDown: true,
      trapFocus: false
    }
  },
  touch: {
    minTargetSize: {
      width: 44,
      height: 44
    },
    spacing: {
      horizontal: 8,
      vertical: 8
    },
    feedback: {
      haptic: true,
      visual: true,
      audio: false
    }
  }
};
```

### 3. Content Structure
```typescript
// Type-safe content structure system
interface ContentSystem {
  hierarchy: {
    levels: {
      h1: React.CSSProperties;
      h2: React.CSSProperties;
      h3: React.CSSProperties;
      h4: React.CSSProperties;
      h5: React.CSSProperties;
      h6: React.CSSProperties;
    };
    spacing: {
      before: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', number>;
      after: Record<'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', number>;
    };
  };
  labels: {
    required: string;
    optional: string;
    error: string;
    success: string;
    loading: string;
  };
  errors: {
    validation: {
      required: string;
      email: string;
      minLength: (min: number) => string;
      maxLength: (max: number) => string;
      pattern: string;
    };
    api: {
      network: string;
      server: string;
      unauthorized: string;
      forbidden: string;
      notFound: string;
    };
  };
}

// Example implementation
const content: ContentSystem = {
  hierarchy: {
    levels: {
      h1: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        lineHeight: 1.2,
        color: theme.colors.text.primary
      }
      // ... other heading styles
    },
    spacing: {
      before: {
        h1: theme.spacing.xl,
        h2: theme.spacing.lg,
        h3: theme.spacing.md,
        h4: theme.spacing.sm,
        h5: theme.spacing.xs,
        h6: theme.spacing.xs
      },
      after: {
        h1: theme.spacing.lg,
        h2: theme.spacing.md,
        h3: theme.spacing.sm,
        h4: theme.spacing.xs,
        h5: theme.spacing.xs,
        h6: theme.spacing.xs
      }
    }
  },
  // ... other content configuration
};
```

## Type-Safe Mobile System

### 1. Touch Interactions
```typescript
// Type-safe touch interaction system
interface TouchSystem {
  gestures: {
    tap: {
      maxDuration: number;
      maxMovement: number;
      feedback: {
        visual: boolean;
        haptic: boolean;
      };
    };
    doubleTap: {
      maxDelay: number;
      maxDistance: number;
    };
    longPress: {
      minDuration: number;
      maxMovement: number;
      feedback: {
        visual: boolean;
        haptic: boolean;
      };
    };
    swipe: {
      directions: ('left' | 'right' | 'up' | 'down')[];
      minVelocity: number;
      minDistance: number;
      maxAngle: number;
    };
    pinch: {
      minScale: number;
      maxScale: number;
      resistance: number;
    };
  };
  targets: {
    minSize: {
      width: number;
      height: number;
    };
    spacing: {
      horizontal: number;
      vertical: number;
    };
    hitSlop: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  feedback: {
    haptic: {
      light: string;
      medium: string;
      heavy: string;
      success: string;
      error: string;
      warning: string;
    };
    visual: {
      ripple: React.CSSProperties;
      highlight: React.CSSProperties;
      pressed: React.CSSProperties;
    };
  };
}

// Example implementation
const touchSystem: TouchSystem = {
  gestures: {
    tap: {
      maxDuration: 300,
      maxMovement: 10,
      feedback: {
        visual: true,
        haptic: true
      }
    },
    // ... other gesture configurations
  },
  targets: {
    minSize: {
      width: 44,
      height: 44
    },
    spacing: {
      horizontal: 8,
      vertical: 8
    },
    hitSlop: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    }
  }
};
```

### 2. Responsive Design
```typescript
// Type-safe responsive system
interface ResponsiveSystem {
  breakpoints: {
    values: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    up: (key: keyof ResponsiveSystem['breakpoints']['values']) => string;
    down: (key: keyof ResponsiveSystem['breakpoints']['values']) => string;
    between: (
      start: keyof ResponsiveSystem['breakpoints']['values'],
      end: keyof ResponsiveSystem['breakpoints']['values']
    ) => string;
  };
  grid: {
    container: {
      maxWidth: Record<
        keyof ResponsiveSystem['breakpoints']['values'],
        number
      >;
      padding: Record<
        keyof ResponsiveSystem['breakpoints']['values'],
        number
      >;
    };
    columns: Record<
      keyof ResponsiveSystem['breakpoints']['values'],
      number
    >;
    spacing: Record<
      keyof ResponsiveSystem['breakpoints']['values'],
      number
    >;
  };
  typography: {
    scale: Record<
      keyof ResponsiveSystem['breakpoints']['values'],
      number
    >;
    lineHeight: Record<
      keyof ResponsiveSystem['breakpoints']['values'],
      number
    >;
  };
  layout: {
    sidebar: {
      width: Record<
        keyof ResponsiveSystem['breakpoints']['values'],
        number | string
      >;
      visible: Record<
        keyof ResponsiveSystem['breakpoints']['values'],
        boolean
      >;
    };
    header: {
      height: Record<
        keyof ResponsiveSystem['breakpoints']['values'],
        number
      >;
      fixed: Record<
        keyof ResponsiveSystem['breakpoints']['values'],
        boolean
      >;
    };
  };
}

// Example implementation
const responsive: ResponsiveSystem = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    },
    up: (key) => `@media (min-width: ${responsive.breakpoints.values[key]}px)`,
    down: (key) => `@media (max-width: ${responsive.breakpoints.values[key] - 0.05}px)`,
    between: (start, end) => 
      `@media (min-width: ${responsive.breakpoints.values[start]}px) and (max-width: ${responsive.breakpoints.values[end] - 0.05}px)`
  },
  // ... other responsive configurations
};
```

### 3. Performance Optimization
```typescript
// Type-safe performance system
interface PerformanceSystem {
  animation: {
    thresholds: {
      fps: number;
      duration: number;
      idleTimeout: number;
    };
    optimizations: {
      reduceMotion: boolean;
      useTransforms: boolean;
      useOpacity: boolean;
      useTiming: boolean;
    };
    throttling: {
      scroll: number;
      resize: number;
      animation: number;
    };
  };
  loading: {
    lazy: {
      threshold: number;
      rootMargin: string;
      enabled: Record<
        'image' | 'video' | 'iframe' | 'component',
        boolean
      >;
    };
    suspense: {
      timeout: number;
      fallback: React.ReactNode;
    };
    prefetch: {
      links: boolean;
      images: boolean;
      threshold: number;
    };
  };
  network: {
    caching: {
      strategies: {
        images: 'cache-first' | 'network-first';
        fonts: 'cache-first' | 'network-first';
        scripts: 'cache-first' | 'network-first';
        styles: 'cache-first' | 'network-first';
      };
      maxAge: Record<
        'images' | 'fonts' | 'scripts' | 'styles',
        number
      >;
    };
    compression: {
      enabled: boolean;
      threshold: number;
      types: string[];
    };
  };
}

// Example implementation
const performance: PerformanceSystem = {
  animation: {
    thresholds: {
      fps: 60,
      duration: 300,
      idleTimeout: 1000
    },
    optimizations: {
      reduceMotion: true,
      useTransforms: true,
      useOpacity: true,
      useTiming: true
    },
    throttling: {
      scroll: 16,
      resize: 100,
      animation: 16
    }
  },
  // ... other performance configurations
};
```

## Type-Safe Implementation Architecture

### 1. CSS Architecture
```typescript
// Type-safe CSS module system
interface CSSModuleSystem {
  modules: {
    naming: {
      pattern: string;
      separators: {
        block: string;
        element: string;
        modifier: string;
      };
      validation: RegExp;
    };
    scoping: {
      prefix: string;
      hash: boolean;
      hashLength: number;
    };
    composition: {
      enabled: boolean;
      separator: string;
      maxDepth: number;
    };
  };
  tokens: {
    variables: Record<string, string>;
    mixins: Record<string, string>;
    functions: Record<string, (...args: any[]) => string>;
  };
  utilities: {
    classes: Record<string, React.CSSProperties>;
    modifiers: Record<string, React.CSSProperties>;
    states: Record<string, React.CSSProperties>;
  };
}

// Example implementation
const cssSystem: CSSModuleSystem = {
  modules: {
    naming: {
      pattern: '[block]__[element]--[modifier]',
      separators: {
        block: '__',
        element: '--',
        modifier: '-'
      },
      validation: /^[a-z][a-zA-Z0-9]*(?:__[a-z][a-zA-Z0-9]*)?(?:--[a-z][a-zA-Z0-9]*)?$/
    },
    // ... other module configurations
  }
};
```

### 2. Component Structure
```typescript
// Type-safe component architecture
interface ComponentArchitecture {
  patterns: {
    props: {
      base: Record<string, unknown>;
      composition: {
        as?: React.ElementType;
        className?: string;
        style?: React.CSSProperties;
      };
      variants: Record<string, unknown>;
      states: Record<string, boolean>;
    };
    composition: {
      slots: string[];
      compounds: string[];
      context: string[];
    };
    styles: {
      base: React.CSSProperties;
      variants: Record<string, React.CSSProperties>;
      states: Record<string, React.CSSProperties>;
      compounds: Record<string, React.CSSProperties>;
    };
  };
  structure: {
    atomic: {
      atoms: string[];
      molecules: string[];
      organisms: string[];
      templates: string[];
      pages: string[];
    };
    features: {
      components: string[];
      containers: string[];
      hooks: string[];
      utils: string[];
    };
  };
}

// Example implementation
const componentSystem: ComponentArchitecture = {
  patterns: {
    props: {
      base: {
        id: 'string',
        children: 'node',
        className: 'string'
      },
      // ... other pattern configurations
    }
  }
};
```

### 3. Theme Integration
```typescript
// Type-safe theme integration
interface ThemeIntegration {
  mui: {
    components: {
      overrides: Record<string, {
        defaultProps?: Record<string, unknown>;
        styleOverrides?: Record<string, React.CSSProperties>;
        variants?: Array<{
          props: Record<string, unknown>;
          style: React.CSSProperties;
        }>;
      }>;
    };
    palette: {
      mode: 'light' | 'dark';
      primary: ThemeColor;
      secondary: ThemeColor;
      error: ThemeColor;
      warning: ThemeColor;
      info: ThemeColor;
      success: ThemeColor;
    };
    typography: {
      fontFamily: string;
      fontSize: number;
      fontWeightLight: number;
      fontWeightRegular: number;
      fontWeightMedium: number;
      fontWeightBold: number;
      h1: React.CSSProperties;
      h2: React.CSSProperties;
      h3: React.CSSProperties;
      h4: React.CSSProperties;
      h5: React.CSSProperties;
      h6: React.CSSProperties;
      subtitle1: React.CSSProperties;
      subtitle2: React.CSSProperties;
      body1: React.CSSProperties;
      body2: React.CSSProperties;
      button: React.CSSProperties;
      caption: React.CSSProperties;
      overline: React.CSSProperties;
    };
  };
  custom: {
    components: Record<string, {
      styles: React.CSSProperties;
      variants: Record<string, React.CSSProperties>;
      states: Record<string, React.CSSProperties>;
    }>;
    tokens: Record<string, string | number>;
    utilities: Record<string, React.CSSProperties>;
  };
}

// Example implementation
const themeIntegration: ThemeIntegration = {
  mui: {
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: theme.borderRadius.md
          }
        }
      }
      // ... other component overrides
    }
  }
};
```

## Related Documentation
- [Component Architecture](./componentArchitecture.md)
- [Functional Requirements](./functionalRequirements.md)
- [Tech Stack](./techStack.md)
