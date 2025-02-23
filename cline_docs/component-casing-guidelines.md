# Component Casing Guidelines

## The Problem

We encountered casing inconsistencies in our UI component imports and file names, which led to TypeScript errors due to case sensitivity conflicts. The specific issues were:

1. File names were using lowercase (e.g., `button.tsx`, `card.tsx`) while imports were using PascalCase (e.g., `import { Button } from "@/components/ui/Button"`).
2. Different files were importing the same component with different casings, causing TypeScript to treat them as different files:
   ```typescript
   // In one file
   import { Card } from "@/components/ui/Card"
   
   // In another file
   import { Card } from "@/components/ui/card"
   ```

## Origin of the Problem

The issue originated from:

1. Mixed conventions between different team members or copied code snippets
2. Case-insensitive filesystems (Windows) masking the problem during development
3. Inconsistent naming patterns between component declarations (PascalCase) and file names (lowercase)

## How We Fixed It

1. Standardized all UI component file names to use PascalCase:
   - `Button.tsx` instead of `button.tsx`
   - `Card.tsx` instead of `card.tsx`
   - `Alert.tsx` instead of `alert.tsx`
   etc.

2. Updated all imports to consistently use PascalCase:
   ```typescript
   import { Button } from "@/components/ui/Button"
   import { Card } from "@/components/ui/Card"
   import { Alert } from "@/components/ui/Alert"
   ```

3. Ensured component names match their file names:
   ```typescript
   // In Button.tsx
   const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(() => {
     // ...
   })
   ```

## Best Practices

### 1. File Naming

- **Use PascalCase for React Component Files**
  - ✅ `Button.tsx`, `Card.tsx`, `AlertDialog.tsx`
  - ❌ `button.tsx`, `card.tsx`, `alert-dialog.tsx`

- **Match File Name to Component Name**
  - The file name should exactly match the primary component it exports
  - Example: `Button.tsx` should export a component named `Button`

### 2. Component Naming

- **Use PascalCase for Component Names**
  ```typescript
  // ✅ Good
  const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(() => {})
  
  // ❌ Bad
  const button = React.forwardRef<HTMLButtonElement, ButtonProps>(() => {})
  ```

### 3. Import Statements

- **Use Consistent Casing in Imports**
  ```typescript
  // ✅ Good
  import { Button } from "@/components/ui/Button"
  
  // ❌ Bad
  import { Button } from "@/components/ui/button"
  ```

### 4. Directory Structure

- **Use Lowercase for Directory Names**
  ```
  components/
    ui/
      Button.tsx
      Card.tsx
      Alert.tsx
  ```

### 5. Type Definitions

- **Use PascalCase for Component Props Types**
  ```typescript
  // ✅ Good
  interface ButtonProps {
    variant?: 'default' | 'primary'
  }
  
  // ❌ Bad
  interface buttonProps {
    variant?: 'default' | 'primary'
  }
  ```

### 6. Testing Files

- **Match Test File Names to Component Files**
  ```
  Button.tsx
  Button.test.tsx
  ```

## Why These Practices Matter

1. **Cross-Platform Compatibility**: While Windows is case-insensitive, many deployment environments (Linux, macOS) are case-sensitive. Following consistent casing prevents deployment issues.

2. **TypeScript Type Resolution**: TypeScript's module resolution is case-sensitive. Consistent casing prevents type errors and improves IDE support.

3. **Code Readability**: PascalCase is the standard convention for React components, making it easier to distinguish components from regular functions and variables.

4. **Maintainability**: Consistent naming patterns make the codebase easier to maintain and reduce cognitive load when switching between files.

## Tools and Enforcement

Consider implementing:

1. ESLint rules to enforce component naming conventions
2. Git hooks to verify file naming conventions
3. TypeScript strict mode to catch casing issues early
4. Editor configuration (e.g., `.editorconfig`) to maintain consistent naming across the team

### 7. Export Patterns

All UI components use named exports for consistency and maintainability:

```typescript
// Component families
export { Card, CardHeader, CardFooter, CardTitle, CardDescription }
export { Alert, AlertTitle, AlertDescription }

// Standalone components
export { Button }
export { Progress }
export { Container }
```

This pattern ensures consistent imports across the codebase:
```typescript
// All components use named imports
import { Card, CardHeader } from "@/components/ui/Card"
import { Alert } from "@/components/ui/Alert"
import { Button } from "@/components/ui/Button"
import { Progress } from "@/components/ui/Progress"
import { Container } from "@/components/ui/Container"
```

Benefits of consistent named exports:
1. Uniform import syntax across the codebase
2. Easier refactoring when components need to add subcomponents
3. Better TypeScript support with explicit exports
4. Clearer dependency tracking
5. Simplified tree-shaking

## Conclusion

Following these guidelines ensures a consistent, maintainable codebase that works reliably across different platforms and development environments. It also aligns with React community standards and best practices.
