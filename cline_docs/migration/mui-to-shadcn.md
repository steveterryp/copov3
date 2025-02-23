# MUI to Shadcn Migration Plan

## Overview

This document outlines the comprehensive plan for migrating from Material-UI (MUI) to Shadcn UI components. The migration will be performed incrementally to minimize disruption while improving type safety, performance, and maintainability.

## Motivation

1. **Type Safety**
   - Stronger TypeScript integration
   - Better prop type inference
   - Improved component composition types

2. **Performance**
   - Reduced bundle size
   - Better runtime performance
   - More efficient styling (Tailwind vs CSS-in-JS)

3. **Maintainability**
   - Direct access to component source
   - Simpler customization
   - Better alignment with modern React patterns

## Documentation Guide

### Core Migration Documents
1. **[Shadcn Patterns](./shadcn-patterns.md)**
   - When to use: During component implementation to ensure consistent patterns
   - Key sections:
     - Form handling patterns
     - Dialog system patterns
     - Navigation patterns
     - Data display patterns

2. **[Impact Analysis](./impact-analysis.md)**
   - When to use: Before starting each phase to assess risks
   - Key sections:
     - Component dependencies
     - Theme dependencies
     - Integration points
     - Risk assessment

3. **[Tailwind Configuration](../tailwind/configuration.md)**
   - When to use: During setup phase and theme customization
   - Key sections:
     - Base configuration
     - Custom plugins
     - Utility patterns
     - Integration patterns

4. **[Component Library](../shadcn/component-library.md)**
   - When to use: During component migration for reference
   - Key sections:
     - Core components
     - Extended components
     - Composition patterns
     - State management

### Related Project Documents
1. **[Component Architecture](../componentArchitecture.md)**
   - When to use: When planning component structure and interfaces
   - Updates needed:
     - Component composition patterns
     - State management patterns
     - Event handling patterns

2. **[Style & Aesthetic Guidelines](../styleAesthetic.md)**
   - When to use: When implementing theme and styling
   - Updates needed:
     - Color system
     - Typography system
     - Spacing system
     - Animation system

3. **[Type System Guidelines](../type-system-guidelines.md)**
   - When to use: When implementing type-safe components
   - Updates needed:
     - Component prop types
     - Theme type system
     - Utility types

4. **[UI Implementation Plan](../ui-implementation-plan.md)**
   - When to use: When planning feature implementation
   - Updates needed:
     - Component migration timeline
     - Feature dependencies
     - Testing requirements

## Migration Strategy

### Phase 1: Setup & Infrastructure (Week 1)

1. **Initial Setup**
   ```bash
   # Install dependencies
   pnpm add @shadcn/ui tailwindcss
   pnpm add -D @types/tailwindcss postcss autoprefixer

   # Initialize Tailwind
   npx tailwindcss init -p
   ```

2. **Configuration**
   ```typescript
   // tailwind.config.ts
   import { type Config } from 'tailwindcss'

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
           // ... other color definitions
         },
         borderRadius: {
           lg: 'var(--radius)',
           md: 'calc(var(--radius) - 2px)',
           sm: 'calc(var(--radius) - 4px)',
         },
       },
     },
   } satisfies Config
   ```

3. **Theme Migration**
   ```typescript
   // lib/theme.ts
   export const theme = {
     colors: {
       // Map MUI colors to Tailwind
       primary: {
         main: 'hsl(var(--primary))',
         light: 'hsl(var(--primary-light))',
         dark: 'hsl(var(--primary-dark))',
       },
       // ... other color mappings
     },
     spacing: {
       // Map MUI spacing to Tailwind
       1: '0.25rem',  // 4px
       2: '0.5rem',   // 8px
       3: '0.75rem',  // 12px
       4: '1rem',     // 16px
     },
   }
   ```

### Phase 2: Core Components (Weeks 2-3)

1. **Basic Components**
   - Button
   - TextField
   - Select
   - Checkbox
   - Radio
   - Switch

2. **Layout Components**
   - Box → div with Tailwind
   - Container
   - Grid → Tailwind grid
   - Stack → Flex container

3. **Feedback Components**
   - Alert
   - Snackbar → Toast
   - Progress
   - Skeleton

### Phase 3: Complex Components (Weeks 4-5)

1. **Dialog System**
   ```typescript
   // From MUI
   <Dialog 
     open={open} 
     onClose={onClose}
     maxWidth="md"
     fullWidth
   >
     <DialogTitle>Edit Template</DialogTitle>
     <DialogContent>...</DialogContent>
   </Dialog>

   // To Shadcn
   <Dialog open={open} onOpenChange={setOpen}>
     <DialogContent className="sm:max-w-[425px]">
       <DialogHeader>
         <DialogTitle>Edit Template</DialogTitle>
       </DialogHeader>
       ...
     </DialogContent>
   </Dialog>
   ```

2. **Form System**
   ```typescript
   // From MUI
   <TextField
     {...methods.register("name")}
     label="Template Name"
     error={!!methods.formState.errors.name}
     helperText={methods.formState.errors.name?.message}
     fullWidth
   />

   // To Shadcn
   <FormField
     control={form.control}
     name="name"
     render={({ field }) => (
       <FormItem>
         <FormLabel>Template Name</FormLabel>
         <FormControl>
           <Input {...field} />
         </FormControl>
         <FormMessage />
       </FormItem>
     )}
   />
   ```

3. **Navigation Components**
   - Tabs
   - Breadcrumbs
   - Menu
   - Drawer

### Phase 4: Data Display (Weeks 6-7)

1. **Table System**
   - DataGrid replacement
   - Sorting
   - Filtering
   - Pagination

2. **Charts & Visualizations**
   - Integration with chart libraries
   - Custom visualizations
   - Dashboard widgets

### Phase 5: Testing & Validation (Week 8)

1. **Test Updates**
   ```typescript
   // test/utils.tsx
   import { render } from '@testing-library/react'

   const customRender = (ui: React.ReactElement) => {
     return render(ui, {
       wrapper: ({ children }) => (
         <ThemeProvider>
           {children}
         </ThemeProvider>
       )
     })
   }

   export * from '@testing-library/react'
   export { customRender as render }
   ```

2. **Performance Testing**
   - Bundle size analysis
   - Load time measurements
   - Runtime performance metrics

## Component Migration Map

### Completed Components
| MUI Component    | Shadcn Component    | Status | Notes                    |
|-----------------|---------------------|--------|--------------------------|
| Button          | Button             | ✅     | Default export          |
| TextField       | Input              | ✅     | Default export          |
| Select          | Select             | ✅     | Default export          |
| Dialog          | Dialog             | ✅     | Named exports           |
| Snackbar        | Toast              | ✅     | Different pattern       |
| Card            | Card               | ✅     | Named export            |
| Alert           | Alert              | ✅     | Named exports           |
| Form            | Form               | ✅     | Mixed exports           |
| DataTable       | DataTable          | ✅     | Custom implementation   |
| Chart           | Chart              | ✅     | Custom with Recharts    |
| Breadcrumb      | Breadcrumb         | ✅     | Named exports           |
| Progress        | Progress           | ✅     | Named exports           |
| Tabs            | Tabs               | ✅     | Named exports           |
| Sheet           | Sheet              | ✅     | Mobile navigation       |
| Command         | Command            | ✅     | Search functionality    |

### Remaining Components
| MUI Component    | Shadcn Component    | Status | Location                 |
|-----------------|---------------------|--------|--------------------------|
| Auth Forms      | Form Components     | 🔄     | app/(auth)/*            |
| Admin Forms     | Form Components     | 🔄     | app/(authenticated)/admin|
| PoV Forms       | Form Components     | 🔄     | app/(authenticated)/pov  |
| User Management | DataTable + Forms   | 🔄     | components/admin        |
| Phase Management| Form + Dialog       | 🔄     | components/admin/phases |
| Support Forms   | Form Components     | 🔄     | app/(authenticated)/support|
| Timeline        | Timeline           | 🔄     | components/ui           |

### Import Pattern Standards
- Named Exports:
  - Card: `import { Card } from '@/components/ui/Card'`
  - Alert: `import { Alert, AlertDescription } from '@/components/ui/Alert'`
  - Dialog: `import { Dialog, DialogContent, DialogHeader } from '@/components/ui/Dialog'`

- Default Exports:
  - Button: `import Button from '@/components/ui/Button'`
  - Input: `import Input from '@/components/ui/Input'`
  - Form: `import Form from '@/components/ui/Form'`
  - Select: `import Select from '@/components/ui/Select'`

## Rollback Strategy

1. **Triggers**
   - Critical bugs in production
   - Significant performance degradation
   - Integration issues with existing systems

2. **Process**
   ```bash
   # Revert to MUI branch
   git checkout main
   git revert --no-commit feat/shadcn-migration
   git commit -m "revert: shadcn migration due to [reason]"
   ```

3. **Component Fallbacks**
   ```typescript
   // Maintain compatibility layer
   export const Button = process.env.USE_SHADCN 
     ? ShadcnButton 
     : MuiButton;
   ```

## Monitoring & Metrics

1. **Performance Metrics**
   - Bundle size (target: 20% reduction)
   - First paint (target: <1s)
   - Time to interactive (target: <2s)

2. **Error Monitoring**
   - Component error rates
   - Runtime exceptions
   - Type errors

## Documentation Usage Timeline

### Phase 1: Setup & Infrastructure (Week 1)
1. Review [Impact Analysis](./impact-analysis.md) for initial assessment
2. Follow [Tailwind Configuration](../tailwind/configuration.md) for setup
3. Update [Style & Aesthetic Guidelines](../styleAesthetic.md) with new theme system
4. Update [Type System Guidelines](../type-system-guidelines.md) with new patterns

### Phase 2: Core Components (Weeks 2-3)
1. Reference [Shadcn Patterns](./shadcn-patterns.md) for implementation
2. Use [Component Library](../shadcn/component-library.md) for component APIs
3. Update [Component Architecture](../componentArchitecture.md) with new patterns
4. Follow [Testing Strategy](./testing-strategy.md) for component testing

### Phase 3: Complex Components (Weeks 4-5)
1. Reference [Impact Analysis](./impact-analysis.md) for risk assessment
2. Use [Shadcn Patterns](./shadcn-patterns.md) for complex implementations
3. Follow [Performance Benchmarks](./performance-benchmarks.md) for optimization
4. Update [UI Implementation Plan](../ui-implementation-plan.md) with progress

### Phase 4: Data Display (Weeks 6-7)
1. Reference [Component Library](../shadcn/component-library.md) for data components
2. Use [Performance Benchmarks](./performance-benchmarks.md) for optimization
3. Follow [Testing Strategy](./testing-strategy.md) for integration testing
4. Update documentation with learnings and patterns

### Phase 5: Testing & Validation (Week 8)
1. Use [Testing Strategy](./testing-strategy.md) for comprehensive testing
2. Follow [Performance Benchmarks](./performance-benchmarks.md) for validation
3. Reference [Impact Analysis](./impact-analysis.md) for risk mitigation
4. Update all documentation with final patterns and learnings

## Related Documentation

### Migration Specific
- [Shadcn Patterns](./shadcn-patterns.md)
- [Impact Analysis](./impact-analysis.md)
- [Testing Strategy](./testing-strategy.md)
- [Performance Benchmarks](./performance-benchmarks.md)

### Project Documentation
- [Component Architecture](../componentArchitecture.md)
- [Style & Aesthetic Guidelines](../styleAesthetic.md)
- [Type System Guidelines](../type-system-guidelines.md)
- [UI Implementation Plan](../ui-implementation-plan.md)

### Configuration & Reference
- [Tailwind Configuration](../tailwind/configuration.md)
- [Component Library](../shadcn/component-library.md)

## Next Steps

1. Complete Auth Pages (6 files)
   - app/(auth)/* pages
   - components/auth/* forms

2. Complete Admin Pages (8 files)
   - CRM management pages
   - Role management
   - Status management

3. Complete PoV Pages (7 files)
   - Edit pages
   - Launch pages
   - Phase management

4. Complete User Management (5 files)
   - User forms
   - User tables
   - Profile management

5. Complete Phase Management (3 files)
   - Task editor
   - Template modals
   - Workflow modals

6. Complete Support & Dashboard (7 files)
   - Support pages
   - Dashboard widgets
   - Settings components

7. Complete UI Components (5 files)
   - Progress component
   - TextField component
   - Timeline component
   - Theme utilities
