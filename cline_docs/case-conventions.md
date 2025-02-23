# Case Conventions Guide

## Overview

This document outlines the case conventions to be used across different parts of the codebase to maintain consistency.

## File Naming Conventions

### Components
- Use **PascalCase** for component files
- Examples:
  - `Button.tsx`
  - `CardCompat.tsx`
  - `DashboardLayout.tsx`

### Providers
- Use **PascalCase** for provider files
- Keep providers in appropriate directories:
  - Core providers in components/providers:
    - `AuthProvider.tsx`
    - `NotificationProvider.tsx`
    - `Providers.tsx` (root provider)
    - `QueryProvider.tsx`
    - `ThemeProvider.tsx`
  - Feature-specific providers in their feature directories:
    - e.g., notifications/NotificationProvider.tsx
- Provider naming:
  - End with "Provider" suffix
  - Match the provider's purpose (e.g., AuthProvider for authentication)
  - Use clear, descriptive names

### Hooks
- Use **camelCase** for hook files
- Must start with "use" prefix (React convention)
- Examples:
  - `useAuth.ts`
  - `useMediaQuery.ts`
  - `useWebSocket.ts`

### Utilities
- Use **camelCase** for utility files
- Examples:
  - `formatDate.ts`
  - `validateInput.ts`
  - `apiHandler.ts`

### Configuration Files
- Use **kebab-case** for configuration files
- Examples:
  - `tailwind.config.ts`
  - `postcss.config.js`
  - `tsconfig.json`

### Test Files
- Use same case as the file being tested, with `.test` or `.spec` suffix
- Examples:
  - `Button.test.tsx`
  - `useAuth.test.ts`
  - `formatDate.spec.ts`

## Code Conventions

### Components
- Use **PascalCase** for component names
- Examples:
  ```typescript
  const Button = () => { ... }
  const CardCompat = () => { ... }
  ```

### Hooks
- Use **camelCase** for hook names
- Must start with "use" prefix
- Examples:
  ```typescript
  const useAuth = () => { ... }
  const useMediaQuery = () => { ... }
  ```

### Functions
- Use **camelCase** for function names
- Examples:
  ```typescript
  function handleSubmit() { ... }
  const formatDate = () => { ... }
  ```

### Variables
- Use **camelCase** for variable names
- Examples:
  ```typescript
  const userData = { ... }
  let isLoading = false
  ```

### Constants
- Use **SCREAMING_SNAKE_CASE** for constant values
- Examples:
  ```typescript
  const MAX_RETRIES = 3
  const API_ENDPOINT = 'https://api.example.com'
  ```

### Types & Interfaces
- Use **PascalCase** for type and interface names
- Examples:
  ```typescript
  interface UserData { ... }
  type ButtonVariant = 'primary' | 'secondary'
  ```

### Prisma Models and Types

#### Model Names and Fields in Prisma Client
- Prisma generates model names based on the schema definition
- The casing in the client is determined by Prisma's internal rules:
  ```prisma
  // In schema.prisma
  model POV {
    id String @id
    verificationToken String? @map("verification_token")
    isVerified Boolean @default(false) @map("is_verified")
    verifiedAt DateTime? @map("verified_at")
    // ... other fields
  }
  ```
  ```typescript
  // In your code
  prisma.pOV.findMany()  // Prisma generates as pOV
  ```
- Database columns use snake_case with @map attribute:
  ```sql
  verification_token VARCHAR
  is_verified BOOLEAN
  verified_at TIMESTAMP
  ```
- Application code uses camelCase:
  ```typescript
  const user = await prisma.user.findUnique({
    select: {
      verificationToken: true,  // camelCase in code
      isVerified: true,        // maps to is_verified in DB
      verifiedAt: true         // maps to verified_at in DB
    }
  });
  ```
- We must use:
  1. snake_case for database column names (defined with @map)
  2. camelCase for field names in application code
  3. Prisma's generated casing for model names (e.g., pOV)

This is because:
  1. snake_case is the PostgreSQL convention for column names
  2. camelCase is the TypeScript/JavaScript convention
  3. Prisma's model casing is enforced by TypeScript

#### Prisma-Generated Types
- Keep Prisma-generated types in their original casing (e.g., POVStatus)
- When importing Prisma types, use the original casing:
  ```typescript
  import { POVStatus } from '@prisma/client';
  ```
- When creating our own types that reference Prisma types, use our PoV casing convention:
  ```typescript
  interface PoVDetails {
    status: POVStatus;  // Prisma type keeps its casing
    // ... other fields
  }
  ```

#### Custom Code Conventions
- While we must use Prisma's casing for client access and relation fields, our own code should follow our PoV convention:
  ```typescript
  // Function names use our convention
  async function getPoVById(id: string) {
    // Prisma client uses its convention
    return prisma.pOV.findUnique({
      where: { id }
    });
  }

  // Relation fields use Prisma's lowercase convention
  interface Phase {
    id: string;
    name: string;
    pov: {  // lowercase because it's a Prisma relation field
      id: string;
      title: string;
    };
  }

  // Comments use our convention
  /**
   * Get PoV details from the database
   */
  ```

### CSS Classes
- Use **kebab-case** for custom CSS classes
- Examples:
  ```css
  .nav-container { ... }
  .button-primary { ... }
  ```

### URL Parameters and API Routes

#### URL Parameters
- Keep URL parameter names in their original casing to match the URL structure
- Examples:
  ```typescript
  // Route: /api/pov/[povId]/phase
  interface RouteParams {
    params: {
      povId: string  // Matches URL parameter name
    }
  }
  ```
- This maintains consistency with the URL path and avoids confusion
- Even when using our PoV casing internally, URL parameters should match the route structure

#### API Route Handlers
- Use our custom casing (e.g., PoV) for function and variable names within handlers
- Examples:
  ```typescript
  // Helper functions use our casing convention
  const getPoVId = async (req: NextRequest) => {
    const segments = url.pathname.split('/')
    const povId = segments.find(s => s !== '[povId]')  // URL param stays as-is
    return povId
  }

  // Variables use our casing convention except URL parameters
  const poVId = await getPoVId(req)
  const poVDetails = await getPoVDetails(poVId)
  ```

#### Route Organization
- Use kebab-case for route segment names:
  ```
  /api/pov-overview/  ✓
  /api/POVOverview/   ✗
  /api/povOverview/   ✗
  ```
- Use square brackets for dynamic segments:
  ```
  /api/pov/[povId]/phase/[phaseId]
  ```
- Follow Next.js routing conventions while maintaining our casing rules:
  ```
  app/
    api/
      pov-overview/
        route.ts
      pov/
        [povId]/
          phase/
            route.ts
  ```

#### Special Considerations
1. URL Parameters vs Internal Variables:
   ```typescript
   // URL parameters match the route structure
   interface RouteParams {
     params: {
       povId: string    // Matches [povId] in URL
     }
   }

   // Internal variables use our casing convention
   const poVId = params.povId
   const poVDetails = await getPoVDetails(poVId)
   ```

2. Error Messages and Logging:
   ```typescript
   // Use our casing in messages and logs
   throw new Error('PoV ID not found')
   console.error('[PoV Update Error]:', error)
   ```

3. API Response Structure:
   ```typescript
   // Use our casing in response data structure
   return NextResponse.json({
     data: {
       poVId: '123',
       poVDetails: { ... }
     }
   })
   ```

## Directory Structure
- Use **kebab-case** for directory names
- Examples:
  ```
  /components/
  /lib/
  /cline_docs/
  ```

## Implementation Notes

1. **Component Files**
   - Always match file name to component name
   - Example: `Button.tsx` contains `const Button = ...`

2. **Hook Files**
   - Always match file name to hook name
   - Example: `useAuth.ts` contains `const useAuth = ...`

3. **Provider Files**
   - Core providers go in components/providers:
     - Root provider (Providers.tsx) for app-wide state
     - Authentication (AuthProvider.tsx)
     - Theme (ThemeProvider.tsx)
     - Data fetching (QueryProvider.tsx)
   - Feature-specific providers go in feature directories:
     - Example: notifications/NotificationProvider.tsx for notification system
   - Provider organization:
     - Keep provider logic separate from UI components
     - Include types and context in the same file
     - Export both provider and its hook if applicable

4. **Imports/Exports**
   - Use same case as the original definition
   - Example:
     ```typescript
     import { Button } from './Button'
     import { useAuth } from './useAuth'
     import { ThemeProvider } from './ThemeProvider'
     ```

## Migration Guide

When converting existing files to follow these conventions:

1. **Hooks**
   - Rename kebab-case files to camelCase:
     ```bash
     git mv use-auth.ts useAuth.ts
     git mv use-media-query.ts useMediaQuery.ts
     git mv use-websocket.ts useWebSocket.ts
     ```
   - Update all imports to match new file names

2. **Components**
   - Follow the existing component-naming-fixes.md guide for component files

3. **Providers**
   - Move core providers to components/providers:
     - Remove any duplicate providers (e.g., old MUI versions)
     - Ensure consistent PascalCase naming
     - Update imports to use new paths
   - Move feature-specific providers to their feature directories:
     - Example: notifications/NotificationProvider.tsx
   - Remove unnecessary providers:
     - Remove empty/pass-through providers
     - Remove providers for unused libraries
   - Update provider imports across the codebase

4. **Update References**
   - Use search tools to find and update all references to renamed files
   - Update import statements across the codebase
   - Update documentation references

## Completed Migrations

### 1. Utils/Helpers (camelCase)
- Renamed files:
  - date-format.ts → dateFormat.ts
  - activity-server.ts → activityServer.ts
- Updated all related imports in:
  - lib/hooks/useDateFormat.ts
  - components/tasks/TaskCreate.tsx
  - lib/server-init.ts
  - ws-server.ts
  - server.ts

### 2. Providers (PascalCase)
- Removed outdated providers:
  - Removed MUI providers from lib/providers
  - Removed duplicate ThemeProvider from components/theme
  - Removed unused ClientProviders.tsx
  - Removed unnecessary DatePickerProvider.tsx
- Fixed ThemeProvider types import from next-themes

### 3. Hooks (camelCase)
- Renamed files:
  - use-websocket.ts → useWebSocket.ts
  - use-media-query.ts → useMediaQuery.ts
  - use-auth.ts → useAuth.ts
- Updated all imports to use new camelCase paths

## Implementation Plan

### Areas to Check

1. **Components (PascalCase)**
   - Check all component directories:
     - components/admin/
     - components/auth/
     - components/dashboard/
     - components/layout/
     - components/notifications/
     - components/pov/
     - components/settings/
     - components/tasks/
     - components/theme/
     - components/ui/
   - Ensure all component files use PascalCase.tsx
   - Update any kebab-case or camelCase files

2. **Utils/Helpers (camelCase)**
   - Check utility directories:
     - lib/utils/
     - lib/validation/
     - lib/websocket/
   - Ensure all utility files use camelCase.ts
   - Update any kebab-case files

3. **Types/Interfaces**
   - Check type directories:
     - lib/types/
     - prisma/enums/
   - Ensure:
     - Files use camelCase.ts
     - Interface names use PascalCase
     - Enum names use PascalCase

4. **Services/APIs (camelCase)**
   - Check service directories:
     - lib/api/
     - lib/auth/
     - lib/admin/
     - lib/notifications/
     - lib/pov/
   - Ensure all service files use camelCase.ts
   - Update any kebab-case files

5. **Middleware (kebab-case)**
   - Check middleware directory
   - Ensure all middleware files use kebab-case.ts
   - Update any camelCase files

6. **Configuration & Scripts (kebab-case)**
   - Check root directory config files
   - Check scripts directory
   - Ensure all config and script files use kebab-case

### Implementation Steps

For each area:
1. List all files in the directory
2. Use regex to identify case inconsistencies
3. Create a list of files that need renaming
4. Search for imports that would need updating
5. Make changes in batches by directory

### Verification

After each batch of changes:
1. Run the application to ensure no broken imports
2. Run tests to catch any issues
3. Update documentation if needed
4. Commit changes with clear descriptions

## Enforcement

1. **ESLint Rules**
   - Configure ESLint to enforce naming conventions
   - Add rules for component, hook, and utility naming

2. **Code Review**
   - Check for adherence to naming conventions during code review
   - Use automated tools to verify naming conventions

3. **Documentation**
   - Keep this guide updated as conventions evolve
   - Reference this guide in PR templates

## Related Documentation
- [Component Naming Fixes](./component-naming-fixes.md)
- [Type System Guidelines](./type-system-guidelines.md)
