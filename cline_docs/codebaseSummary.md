# Codebase Summary

## Project Structure

### Core System Components
```
components/
├── admin/                   // Admin Interface
│   ├── AuditLog/           // Audit logging
│   ├── PermissionManagement/ // Permission control
│   ├── UserManagement/     // User management
│   │   ├── UserFilter.tsx  // User filtering
│   │   └── UserTable.tsx   // User list
│   └── phases/             // Phase Management
│       ├── TaskEditor.tsx  // Task template editor
│       ├── TemplateEditModal.tsx // Template editing
│       └── WorkflowEditModal.tsx // Workflow config
├── auth/                    // Authentication UI
│   ├── LoginForm.tsx       // Login form
│   ├── PasswordResetForm.tsx // Password reset
│   └── RequestPasswordResetForm.tsx // Reset request
├── dashboard/              // Dashboard Components
│   ├── DashboardWidgets.tsx // Widget container
│   └── widgets/           // Dashboard Widgets
│       ├── ActivePoVs.tsx // Active PoVs
│       ├── Milestones.tsx // Milestones
│       ├── ResourceUsage.tsx // Resources
│       ├── RiskOverview.tsx // Risks
│       ├── TeamStatus.tsx // Team status
│       └── WidgetErrorBoundary.tsx // Error handling
├── layout/                // Layout Components
│   ├── AppLayout.tsx     // Main app layout
│   ├── AdminHeader.tsx   // Admin header
│   ├── AdminNav.tsx      // Admin navigation
│   ├── MobileNav.tsx     // Mobile navigation
│   ├── NotificationBell.tsx // Notifications
│   ├── SideNav.tsx       // Side navigation
│   └── UserMenu.tsx      // User menu
├── notifications/        // Notification System
│   ├── ActivityNotification.tsx // Activity alerts
│   ├── NotificationCenter.tsx // Notification list
│   ├── NotificationBell.tsx // Notification trigger
│   ├── NotificationItem.tsx // Single notification
│   └── NotificationProvider.tsx // State provider
├── pov/                 // POV Components
│   ├── crm/            // CRM Integration
│   ├── list/           // POV Listing
│   │   └── PoVList.tsx // POV list view
│   ├── launch/         // Launch Management
│   ├── kpi/           // KPI Management
│   ├── creation/      // POV Creation
│   │   ├── steps/    // Creation Steps
│   │   │   ├── BasicInfoForm.tsx
│   │   │   ├── MetricsGoals.tsx
│   │   │   ├── Resources.tsx
│   │   │   ├── Review.tsx
│   │   │   ├── TeamSelection.tsx
│   │   │   └── WorkflowSetup.tsx
│   │   └── PoVCreationForm.tsx
│   └── phases/        // Phase Management
├── tasks/             // Task Management
│   ├── TaskCreate.tsx // Task creation
│   ├── TaskList.tsx  // Task listing
│   └── TaskCard.tsx  // Task display
└── ui/               // Shadcn UI Components
    ├── Alert.tsx    // Alert messages
    ├── Avatar.tsx   // User avatars
    ├── Badge.tsx    // Status badges
    ├── Button.tsx   // Action buttons
    ├── Card.tsx     // Content containers
    ├── Checkbox.tsx // Checkboxes
    ├── Command.tsx  // Command palette
    ├── Container.tsx // Layout container
    ├── DataTable.tsx // Enhanced table
    ├── DatePicker.tsx // Date selection
    ├── Dialog.tsx   // Modal dialogs
    ├── DropdownMenu.tsx // Dropdown menus
    ├── Form.tsx     // Form components
    ├── Input.tsx    // Text inputs
    ├── Label.tsx    // Form labels
    ├── Progress.tsx // Progress bars
    ├── Select.tsx   // Select menus
    ├── Sheet.tsx    // Slide-out panels
    ├── Skeleton.tsx // Loading states
    ├── Spinner.tsx  // Loading indicator
    ├── TextField.tsx // Text inputs
    ├── Timeline.tsx // Timeline display
    ├── Toast.tsx    // Toast notifications
    ├── Tooltip.tsx  // Tooltips
    └── icons/       // Icon components
```

### API Routes
```
app/api/
├── admin/                   // Admin APIs
│   ├── audit/              // Activity logging
│   ├── crm/                // CRM Management
│   │   ├── mapping/       // Field mapping
│   │   ├── settings/      // CRM settings
│   │   └── sync/         // Sync operations
│   ├── permissions/        // Permission management
│   ├── phases/            // Phase templates
│   │   ├── templates/     // Template management
│   │   └── workflow/      // Workflow config
│   ├── roles/             // Role management
│   ├── settings/          // System settings
│   └── users/             // User management
├── auth/                   // Authentication
│   ├── login/             // User login
│   ├── logout/            // User logout
│   ├── me/                // Current user
│   ├── password-reset/    // Password reset
│   ├── profile/           // User profile
│   ├── refresh/           // Token refresh
│   ├── register/          // User registration
│   ├── revoke/            // Token revocation
│   ├── verify/            // Email verification
│   └── ws-token/          // WebSocket auth
├── dashboard/             // Dashboard Data
│   ├── pov-overview/     // POV overview
│   └── team-activity/    // Team activity
├── health/               // Health Checks
│   └── db/              // Database health
├── manifest/            // App manifest
├── notifications/       // Notifications
│   ├── clear/          // Clear all
│   ├── read-all/       // Mark all read
│   └── [notificationId]/ // Single notification
├── pov/                // POV Management
│   └── [povId]/        // Single POV
│       ├── crm/        // CRM integration
│       ├── kpi/        // KPI tracking
│       ├── launch/     // Launch management
│       │   ├── checklist/ // Launch checklist
│       │   └── status/   // Launch status
│       ├── phase/      // Phase management
│       │   ├── multiple/ // Bulk operations
│       │   ├── reorder/ // Phase reordering
│       │   └── [phaseId]/ // Single phase
│       │       └── task/ // Task management
│       ├── phases/     // Phase operations
│       └── team/       // Team management
├── settings/           // User settings
├── support/           // Support system
│   ├── feature/      // Feature requests
│   └── request/      // Support requests
└── tasks/            // Task operations
```

### Library Code & Services
```
lib/
├── admin/                  // Admin Module
│   ├── handlers/          // Request Handlers
│   │   ├── activity.ts   // Activity logging
│   │   ├── role.ts      // Role management
│   │   ├── settings.ts  // Settings management
│   │   └── user.ts      // User management
│   ├── hooks/           // Custom Hooks
│   │   └── useRoles.ts  // Role management hook
│   ├── prisma/          // Database Layer
│   │   ├── mappers.ts   // Type mappers
│   │   └── select.ts    // Select types
│   └── services/        // Business Logic
│       ├── activity.ts  // Activity service
│       ├── role.ts     // Role service
│       ├── settings.ts // Settings service
│       └── user.ts     // User service
├── auth/                 // Authentication System
│   ├── audit.ts         // Auth auditing
│   ├── cache.ts         // Token caching
│   ├── middleware.ts    // Auth middleware
│   ├── permissions.ts   // Permission system
│   ├── rbac.ts         // Role-based access
│   ├── resources.ts    // Protected resources
│   ├── token-manager.ts // Token handling
│   └── verify.ts       // Token verification
├── dashboard/           // Dashboard Module
│   ├── handlers/       // Request Handlers
│   ├── hooks/          // Custom Hooks
│   │   └── useDashboard.ts
│   ├── prisma/         // Database Layer
│   │   ├── mappers.ts  // Type mappers
│   │   └── select.ts   // Select types
│   ├── services/       // Business Logic
│   │   └── dashboard.ts
│   └── types/          // Type Definitions
│       ├── enums.ts    // Dashboard enums
│       ├── index.ts    // Type exports
│       └── risk.ts     // Risk types
├── hooks/              // Shared Hooks
│   ├── useAuth.ts     // Authentication hook
│   ├── useDateFormat.ts // Date formatting
│   ├── useMediaQuery.ts // Responsive design
│   ├── useNotifications.ts // Notifications
│   ├── useSettings.ts  // Settings management
│   ├── useToast.ts    // Toast notifications
│   └── useWebSocket.ts // WebSocket hook
├── pov/               // POV Module
│   ├── handlers/     // Request Handlers
│   ├── prisma/       // Database Layer
│   ├── services/     // Business Logic
│   │   ├── activity.ts // Activity tracking
│   │   ├── crm.ts    // CRM integration
│   │   ├── kpi.ts    // KPI management
│   │   ├── launch.ts // Launch process
│   │   ├── phase.ts  // Phase management
│   │   └── workflow.ts // Workflow engine
│   └── types/       // Type Definitions
├── tasks/           // Tasks Module
│   ├── handlers/    // Request Handlers
│   ├── prisma/      // Database Layer
│   ├── services/    // Business Logic
│   └── types/       // Type Definitions
├── utils/          // Utilities
│   └── dateFormat.ts // Date formatting
├── validation/     // Validation Logic
│   └── pov.ts     // POV validation
├── websocket/     // WebSocket System
│   ├── activityServer.ts // Activity streaming
│   └── token.ts   // WS authentication
├── api-handler.ts // API utilities
├── config.ts     // Configuration
├── cookies.ts    // Cookie management
├── db-init.ts    // Database setup
├── email.ts      // Email service
├── errors.ts     // Error handling
├── jwt.ts        // JWT utilities
├── logger.ts     // Logging system
├── prisma.ts     // Prisma client
├── server-init.ts // Server setup
└── theme.ts      // Theme system
```

### Integration Layer
```
lib/integrations/
├── salesforce/              // Salesforce Integration
│   ├── client.ts           // API client
│   ├── sync.ts            // Data synchronization
│   └── types.ts           // Type definitions
├── jira/                   // Jira Integration
│   ├── client.ts          // API client
│   ├── tickets.ts         // Ticket management
│   └── types.ts           // Type definitions
└── messaging/             // Platform Integration
    ├── slack.ts           // Slack integration
    ├── teams.ts           // Teams integration
    └── webhook.ts         // Webhook handling
```

### Test Infrastructure
```
test/
├── setup/
│   ├── api.ts (API test utilities)
│   ├── config.ts (Test constants)
│   ├── matchers.ts (Custom Jest matchers)
│   └── types.ts (Test type definitions)
├── mocks/
│   ├── lib/
│   └── use-notifications.ts (Notification mock)
└── prisma.ts (Type-safe Prisma mocks)
```

## Recent Changes

### 1. Authentication System Enhancement
- Standardized cookie and token management
  → See [Cookie & Token Standards](./cookie-token-standards.md)
- Implemented environment-aware security settings
- Enhanced token payload structure
- Improved error handling and logging
- Created comprehensive documentation
  → See [Authentication Documentation](./authentication.md)

### 2. Notification System
- Implemented NotificationProvider
- Added polling with If-Modified-Since
- Created notification components
- Set up auto-cleanup mechanism
→ See [Notifications](./notifications.md)

### 3. User Management System Enhancement
- Implemented comprehensive user management system with status tracking (Active, Inactive, Suspended)
- Added sortable user table with role and status indicators
- Created modal form for user creation and editing with validation
- Implemented user status management and role assignment
- Added API endpoints for user CRUD operations with proper validation
- Enhanced user model with status tracking and last login timestamp
- Integrated with RBAC system for proper authorization

### 4. RBAC Implementation and Admin Section Enhancement
- Enhanced Role-Based Access Control (RBAC) system:
  - Added route-based permission checking in admin layout
  - Implemented client-side permission validation in AuthProvider
  - Created permission setup script for initializing admin permissions
  - Updated resource types to match route paths:
    - USER_MANAGEMENT = 'user-management'
    - PERMISSIONS = 'permissions'
    - JOB_TITLES = 'job-titles'
  - Enhanced permission hierarchy:
    - SUPER_ADMIN: Full access including ADMIN permissions
    - ADMIN: Access to admin sections with restricted SUPER_ADMIN modifications
    - USER: Base level access with team-based permissions
  - Added breadcrumb navigation in header with:
    - Dynamic path-based navigation
    - Section-specific icons
    - Proper handling of dynamic segments
  - Improved permission management UI:
    - Role-based permission matrix
    - Visual feedback for disabled permissions
    - Clear error messaging
  - Enhanced documentation:
    - Updated RBAC implementation guide
    - Added permission system architecture details
    - Documented admin section access control

### 5. Task Management System
- Implemented comprehensive task management system:
  - Task creation and editing with form validation
  - Team member assignment capabilities
  - Status and priority management
  - Integration with POV and Phase structure
  - Permission-based access control
  - React Query for data management
  - Proper error handling and loading states
  - Improved form state management
  - Enhanced data validation and transformation
  - Better error handling and feedback
  - Proper date handling
  - Null/undefined value handling
  - Detailed error logging
  - Cache invalidation strategies
  - Loading state management
  - Form field validation
  - Input sanitization
  - Proper API route organization
- Created detailed architecture documentation
  → See [Task Management Architecture](./taskMgmtArchitecture.md)

### 6. API Modularization and Team Member Selection
- Implemented new modular API architecture for improved maintainability
- Refactored Tasks API as proof of concept with:
  - Dedicated type definitions for strong typing
  - Prisma layer for database interactions
  - Service modules for reusable business logic
  - Separated handlers for better testing
  - Thin route wrappers for clean endpoints
- Created comprehensive API refactoring guide
- Implemented team member selection improvements:
  - New `/api/pov/[povId]/team/available` endpoint
  - Proper permission handling
  - Type-safe team member updates
  - Separation from admin functionality
- Planned refactoring for POV, Notifications, Admin, and Settings APIs
- Benefits:
  - Improved code organization and maintainability
  - Enhanced type safety with strict TypeScript patterns
  - Better testability through component isolation
  - Reduced code duplication
  - Clearer separation of concerns
  - Proper permission boundaries

### 7. Settings API Refactoring
- Implemented new modular architecture for settings management:
  - Dedicated type definitions and interfaces
  - Prisma layer with select types and mappers
  - Service modules for business logic
  - Split handlers for better testing
  - Enhanced error handling and validation
  - Proper activity tracking
  - Type-safe implementation across all layers
  - Standardized response structure
  - Improved timezone validation
  - Better settings state management
  - Proper null/undefined handling
  - Enhanced error feedback
  - Comprehensive documentation

### 8. Activity Logging System Enhancement
- Enhanced activity logging system with:
  - Improved user data inclusion in activity records
  - Proper pagination and filtering support
  - Improved error handling and loading states
  - Type-safe implementation across all layers
  - Standardized response structure
  - Better user information display
  - Modular architecture following API patterns:
    - Dedicated type definitions
    - Prisma layer for database interactions
    - Service modules for business logic
    - Separated handlers for better testing
  - Real-time activity updates
  - Comprehensive filtering options:
    - By user
    - By activity type
    - By action
    - By date range
  - Enhanced UI components:
    - Loading states
    - Error handling
    - Pagination controls
    - Filter controls
    - Date range selection
  - Proper authentication and authorization checks
  - Improved performance with optimized queries

### User Feedback Integration and Its Impact on Development
- User feedback has been crucial in prioritizing RBAC and notification system enhancements.
- Addressed performance issues and improved user experience based on initial feedback.

### 9. POV Workflow Enhancement
- Implemented comprehensive workflow system:
  - Status transition system with validation
  - Phase template management
  - KPI tracking with history
  - CRM integration with field mapping
  - Launch process management
- Enhanced architecture documentation:
  - Created bigPovArchitecture.md for system overview
  - Added status-phase-changes.md for status management
  - Created workflow-system.md for workflow details
  - Added kpi-history.md for KPI tracking

### 10. UI Implementation Planning
- Created detailed UI implementation plan:
  - Organized route structure for new features
  - Defined component interfaces and features
  - Outlined implementation phases
  - Added testing and performance strategies
  - Documented error handling patterns
- Key new features:
  - CRM integration UI
  - Phase template management
  - KPI tracking and visualization
  - Launch process interface
- Implementation approach:
  - Phase-based rollout
  - Component-first development
  - Comprehensive testing strategy
  - Performance optimization focus

### 11. UI Component Migration to Shadcn UI
- Completed comprehensive migration from Material UI to Shadcn UI:
  - Migrated core components:
    - DataTable with enhanced features
    - Dialog with proper composition
    - Notification components with improved UX
    - Layout components with better responsiveness
    - Authentication pages with enhanced forms
    - Dashboard components with better visualization
  - Improved patterns:
    - Consistent named exports
    - Enhanced accessibility
    - Better dark mode support
    - Improved mobile responsiveness
  - Enhanced documentation:
    - Created migration progress tracking
    - Documented component patterns
    - Added troubleshooting guides
    - Updated technical documentation

### 12. Navigation Analysis Initiative (Current)
- Implementing three-phase approach to navigation improvement:
  - Phase 1: Automated Route Analysis
    - Route scanner implementation
    - Navigation component parser
    - Link pattern analyzer
    - Access control validator
  - Phase 2: Visual Navigation Mapping
    - Screenshot system
    - Flow diagram generation
    - UI pattern documentation
    - User journey mapping
  - Phase 3: Interactive Testing
    - Navigation test suite
    - Performance metrics
    - Accessibility testing
    - User journey validation

### Recent Branch Activities
1. feat/shadcn-migration (Completed):
   - Migrated all UI components to Shadcn UI
   - Enhanced component architecture
   - Improved accessibility and responsiveness
   - Added comprehensive documentation
   - Merged to main

2. feat/navigation (Current):
   - Created for navigation analysis and improvement
   - Following navigation-analysis-plan.md
   - Starting with automated analysis
