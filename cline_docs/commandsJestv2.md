# Jest Test Commands Guide v2

This updated guide outlines the various Jest test commands available in the project, with specific file locations, associated files, and detailed descriptions for each test category.

## Core Test Commands

### 1. API Tests
```bash
# Run all API tests
npm test -- "app/api/.*\.test\.(ts|tsx)?" --verbose
```

Tests API route handlers and endpoints in the Next.js application. These tests verify:
- HTTP request/response handling
- Authentication and authorization
- Data validation and processing
- Error handling and status codes
- Response shape and content

#### Auth API Tests
Location: `app/api/auth/__tests__/`
- `auth.test.ts` → Tests `app/api/auth/[action]/route.ts` files:
  - `login/route.ts`
  - `register/route.ts`
  - `logout/route.ts`
  - `refresh/route.ts`
Tests authentication endpoints including user registration, login flows, token refresh, and session management.

#### Dashboard API Tests
Location: `app/api/dashboard/__tests__/`
- `pov-overview.test.ts` → Tests `app/api/dashboard/pov-overview/route.ts`
- `team-activity.test.ts` → Tests `app/api/dashboard/team-activity/route.ts`
Tests dashboard data endpoints including PoV metrics calculation, team activity aggregation, and real-time updates.

#### PoV API Tests
Location: `app/api/pov/__tests__/`
- `pov.test.ts` → Tests `app/api/pov/route.ts`
- `phase.test.ts` → Tests `app/api/pov/[povId]/phase/route.ts`
- `task.test.ts` → Tests `app/api/pov/[povId]/phase/[phaseId]/task/route.ts`
Tests PoV management including phase transitions, task operations, and complex data relationships.

### 2. Component Tests
```bash
# Run all component tests
npm test -- "components/.*\.test\.(ts|tsx)?" --verbose
```

Tests React components for proper rendering, user interactions, and state management. These tests verify:
- Component rendering and styling
- User interaction handling
- State updates and side effects
- Accessibility compliance
- Error boundary behavior

#### UI Components
Location: `components/ui/__tests__/`
- `Button.test.tsx` → Tests `components/ui/Button.tsx`
- `TextField.test.tsx` → Tests `components/ui/TextField.tsx`
Tests core UI components focusing on accessibility, styling variants, and user interactions.

#### Dashboard Components
Location: `components/dashboard/widgets/__tests__/`
- `PoVOverview.test.tsx` → Tests `components/dashboard/widgets/PoVOverview.tsx`
- `TeamActivity.test.tsx` → Tests `components/dashboard/widgets/TeamActivity.tsx`
Tests dashboard widgets including data visualization, real-time updates, and complex state management.

#### Task Components
Location: `components/tasks/__tests__/`
- `TaskCard.test.tsx` → Tests `components/tasks/TaskCard.tsx`
- `TaskList.test.tsx` → Tests `components/tasks/TaskList.tsx`
Tests task management components including drag-and-drop functionality, status updates, and list operations.

#### Notification Components
Location: `components/notifications/__tests__/`
- `ActivityNotification.test.tsx` → Tests `components/notifications/ActivityNotification.tsx`
Tests notification system including real-time updates, animation states, and user interaction.

### 3. Integration Tests
```bash
# Run all integration tests
npm test -- "test/integration/.*\.test\.(ts|tsx)?" --verbose
```

Tests multiple parts of the application working together. These tests verify that different components and services integrate correctly, such as:
- Complete authentication flows from UI to database
- Data operations across multiple services
- Complex user interactions and state updates
- WebSocket communication and real-time features
- Error handling across system boundaries

Location: `test/integration/`
- `auth.test.ts` → Tests complete auth flow across:
  - `app/api/auth/`
  - `lib/auth/`
  - `lib/store/auth.ts`
Tests end-to-end authentication including registration, login, token management, and session handling.

- `phase.test.ts` → Tests phase management across:
  - `app/api/pov/[povId]/phase/`
  - `lib/api/pov-handler.ts`
  - `lib/validation/pov.ts`
Tests complete phase lifecycle including creation, transitions, validation, and associated task management.

### 4. Helper Tests
```bash
# Run all helper tests
npm test -- "app/api/.*/__tests__/helpers.test.ts" --verbose
```

Tests utility functions and helper modules that support the main application features. These tests verify:
- Data transformation functions
- Validation utilities
- Type conversions
- Common operations

Location: `test/setup/`
- `matchers.test.ts` → Tests `test/setup/matchers.ts`
- `prisma.test.ts` → Tests `test/setup/prisma.ts`
- `config.test.ts` → Tests `test/setup/config.ts`
Tests test utilities themselves to ensure reliable test infrastructure.

### 5. WebSocket Tests
```bash
# Run WebSocket tests
npm test -- "lib/websocket/__tests__/.*\.test\.(ts|tsx)?" --verbose
```

Tests real-time communication features. These tests verify:
- Connection management
- Message handling
- Subscription systems
- Error recovery
- Real-time updates

Location: `lib/websocket/__tests__/`
- `activity-server.test.ts` → Tests `lib/websocket/activity-server.ts`
- `client.test.ts` → Tests `lib/hooks/use-websocket.ts`
Tests WebSocket server and client implementation including connection handling, message passing, and error scenarios.

[Rest of the content remains the same...]
