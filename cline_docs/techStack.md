# Technology Stack and Architecture Decisions

[← Back to Documentation Index](./README.md)

## Quick Links
- [Technical Learnings](./technicalLearnings.md)
- [Type System Guidelines](./typeSystemGuidelines.md)
- [Current Task Status](./currentTask.md)

## Core Technologies

### Real-Time Infrastructure
- **Polling with Caching**: Efficient polling implementation
  → See [Notifications](./notifications.md)
- **Features Used**:
  - If-Modified-Since caching
  - Token-based authentication
  - Automatic retry mechanism
  - Activity tracking
- **Key Decisions**:
  - Custom notification hook for React integration
  - Type-safe notification protocol
  - Efficient caching strategy
  - State synchronization
- **Implementation Details**:
  - Server-side notification endpoint
  - Client-side useNotifications hook
  - Activity tracking middleware
  - Connection management

### Support System
- **Primary**: Request Management System
  → See [Functional Requirements - Support System](./functionalRequirements.md#support-system)
- **Features**:
  - Support request submission and tracking
  - Feature request management
  - Status updates and notifications
  - Admin management interface
- **Key Decisions**:
  - Type-safe request handling
  - Integration with notification system
  - Status tracking workflow
  - User history tracking
- **Implementation Details**:
  - Request submission forms
  - Admin management interface
  - Status update notifications
  - Request history in user profiles

### Document Processing
- **Primary**: Natural Language Processing
  → See [Functional Requirements - Document Processing](./functionalRequirements.md#document-processing)
- **Libraries**:
  - OpenAI API for text analysis
  - Tesseract.js for OCR
  - pdf.js for PDF parsing
- **Key Features**:
  - Multi-format support
  - Data extraction
  - Template matching

### POV Workflow System
- **Primary**: Status-based workflow engine
  → See [Big POV Architecture](./bigPovArchitecture.md)
- **Features**:
  - Status transition validation
  - Phase template management
  - KPI tracking with history
  - CRM integration with field mapping
  - Launch process management
- **Key Decisions**:
  - Singleton pattern for services
  - Atomic transactions for consistency
  - Type-safe metadata handling
  - Comprehensive error handling
- **Implementation Details**:
  - Status transition system
  - Phase approval workflows
  - KPI calculation engine
  - Launch checklist management
  → See [Status & Phase Changes](./status-phase-changes.md)

### Integration Layer
- **Primary**: REST APIs & WebHooks
  → See [Functional Requirements - External Integrations](./functionalRequirements.md#external-integrations)
- **Integrations**:
  - Salesforce API with field mapping
  - Jira REST API
  - Slack/Teams WebHooks
- **Key Features**:
  - Type-safe API clients
  - Rate limiting
  - Error handling
  - CRM sync history tracking
  - Field transformation

### KPI System
- **Primary**: Comprehensive KPI tracking
  → See [KPI History](./kpi-history.md)
- **Features**:
  - History tracking with context
  - Calculation engine
  - Visualization support
  - Target management
- **Key Decisions**:
  - JSON storage for flexibility
  - Atomic transactions
  - Type-safe history access
  - Performance optimization
- **Implementation Details**:
  - KPI templates
  - History tracking
  - Calculation context
  - Trend analysis

### TypeScript and Type System
- **Version**: TypeScript 5.x
- **Configuration**: Strict mode enabled
- **Key Decisions**:
  - Custom type definitions for API responses
    → See [Technical Learnings - API Response Types](./technicalLearnings.md#1-api-response-types)
  - Comprehensive error type system
    → See [Type System Guidelines - Error Types](./typeSystemGuidelines.md#2-error-types)
  - Jest custom matcher type extensions
    → See [Type System Guidelines - Testing Types](./typeSystemGuidelines.md#1-custom-matchers)
  - [Type System Guidelines](./typeSystemGuidelines.md)

### Next.js
- **Version**: 14.0.4
- **Features Used**:
  - App Router
  - API Routes
    → See [Technical Learnings - API Response Types](./technicalLearnings.md#1-api-response-types)
  - Middleware support
  - Server Components
- **Key Decisions**:
  - Type-safe API routes
  - Server-side authentication
  - Route handlers with proper typing

### Authentication & Access Control
- **Implementation**: JWT with refresh tokens
  → See [Authentication Documentation](./authentication.md)
- **Three-Tier Role System**:
  - System Roles (Base Access)
    → See [Custom Roles Architecture](./customRolesArchitecture.md)
  - User Permissions (Fine-Grained Control)
    → See [RBAC Implementation](./rbacImplementation.md)
  - Job Titles (Organizational Structure)
    → See [Custom Roles Architecture](./customRolesArchitecture.md)
- **Key Features**:
  - Token rotation
  - Permission management UI
  - Type-safe authentication flow
  - Standardized cookie management
    → See [Cookie & Token Standards](./cookie-token-standards.md)
  - Route-based permission checking
  - Client-side permission validation
  - Admin section access control:
    - Resource types matching route paths
    - Dynamic breadcrumb navigation
    - Permission initialization scripts
  - Enhanced permission hierarchy:
    - SUPER_ADMIN: Full system access
    - ADMIN: Restricted admin section access
    - USER: Base level permissions
- **Security Measures**:
  - HTTP-only cookies
  - Environment-aware security settings
  - CSRF protection
  - XSS prevention
  - Proper token expiration
- **Documentation**:
  - Comprehensive architecture documentation
  - Cookie and token standards
  - Security best practices

### UI Component System
- **Primary**: Shadcn UI with Tailwind CSS
  → See [Migration Progress](./migration/migrationProgress1.md)
- **Features**:
  - Type-safe component variants using class-variance-authority
  - Radix UI primitives for accessibility
  - Tailwind CSS for styling
  - Custom component composition
  - Enhanced dark mode support
  - Improved mobile responsiveness
- **Key Decisions**:
  - Complete migration from MUI to Shadcn UI
  - Direct access to component source code
  - Improved type safety with CVA
  - Tailwind for efficient styling
  - Consistent named exports
  - Standardized component patterns
- **Implementation Details**:
  - Component variants with proper typing
  - Tailwind configuration
  - Theme customization
  - Accessibility patterns
  - Migration documentation
  - Troubleshooting guides

### Navigation Analysis Tools
- **Primary**: Custom analysis suite
  → See [Navigation Analysis Plan](./navigation-analysis-plan.md)
- **Features**:
  - Automated route analysis
  - Visual navigation mapping
  - Interactive testing
  - Performance metrics
- **Key Tools**:
  - Route Scanner:
    ```typescript
    interface RouteAnalysis {
      routes: Array<{
        path: string;
        component: string;
        layout?: string;
        auth?: boolean;
      }>;
      navigationLinks: Array<{
        path: string;
        label: string;
        component: string;
        location: string;
      }>;
      issues: Array<{
        type: 'ORPHANED_PAGE' | 'BROKEN_LINK' | 'DUPLICATE_FUNCTIONALITY';
        description: string;
        location: string;
      }>;
    }
    ```
  - Visual Mapper:
    - Playwright/Puppeteer for screenshots
    - Flow diagram generation
    - UI pattern documentation
  - Test Suite:
    - Navigation flow testing
    - Performance measurement
    - Accessibility validation
- **Implementation Details**:
  - Non-destructive analysis
  - Comprehensive reporting
  - Visual documentation
  - Performance benchmarking

### State Management
- **Primary**: React Query & Zustand
  → See [Technical Learnings - React Query Integration](./technicalLearnings.md#react-query-integration)
- **Features**:
  - Type-safe queries and mutations
  - Automatic cache management
  - Server state synchronization
  - Real-time state updates
- **State Categories**:
  - Authentication state
  - Notification state
  - UI preferences
  - Form state
  - Theme preferences

### Styling System
- **Primary**: Tailwind CSS with CSS Variables
  → See [Style & Aesthetic Guidelines](./styleAesthetic.md)
- **Features**:
  - CSS variables for theming
  - Type-safe utility classes
  - Dark mode support
  - Responsive design
- **Key Decisions**:
  - Move from CSS-in-JS to utility classes
  - Use CSS variables for theme tokens
  - Implement dark mode with CSS variables
  - Maintain type safety with class-variance-authority
- **Implementation Details**:
  - Theme configuration
  - Color system
  - Typography scale
  - Spacing system
  - Animation utilities

## Development Tools

### Notification System
- **Real-time**: Efficient polling with caching
  → See [Notifications](./notifications.md)
- **Features**:
  - Activity notifications
  - Connection status updates
  - Auto-cleanup mechanism
  - Read/unread tracking
- **Components**:
  - NotificationProvider
  - NotificationBell
  - NotificationCenter
  - NotificationItem
- **Integration**:
  - React Context for state
  - If-Modified-Since caching
  - Automatic retry mechanism
  - Type-safe notifications

### Analytics & Monitoring
- **Performance**: New Relic
- **Error Tracking**: Sentry
- **Usage Analytics**: Mixpanel
- **API Monitoring**: DataDog
  → See [Functional Requirements - Dashboard & Reporting](./functionalRequirements.md#dashboard--reporting)

### Testing
- **Framework**: Jest
  → See [Type System Guidelines - Testing Types](./typeSystemGuidelines.md#testing-types)
- **Extensions**:
  - Custom matchers
  - Type-safe utilities
  - API mocking
- **Coverage**: Aiming for 80%+ coverage
  → See [Project Roadmap - Testing Infrastructure](./projectRoadmap.md#3-testing-infrastructure-)

### Code Quality
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Type Checking**: Strict mode enabled
  → See [Type System Guidelines - Best Practices](./typeSystemGuidelines.md#best-practices)

## Architecture Decisions
→ See [Technical Learnings](./technicalLearnings.md) for detailed explanations

### 1. Type System
```typescript
// Decision: Comprehensive type-safe API response system
interface ApiResponse<T> {
  data: T;
  error?: ApiError;
  metadata?: {
    timestamp: string;
    requestId: string;
    [key: string]: unknown;
  };
}

// Type-safe error handling
interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

type ApiErrorCode = 
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

// Type-safe headers
interface ApiHeaders extends Headers {
  get(name: 'content-type'): string;
  get(name: 'authorization'): string | null;
  get(name: 'if-modified-since'): string | null;
  get(name: string): string | null;
}

// Type-safe request context
interface ApiContext<T extends Record<string, unknown>> {
  params: T;
  headers: ApiHeaders;
  user?: User;
  metadata?: Record<string, unknown>;
}

// Example usage with type safety
export async function GET(
  req: NextRequest,
  context: ApiContext<{ povId: string }>
): Promise<NextResponse<ApiResponse<POV>>> {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, { status: 401 });
    }

    const pov = await prisma.pOV.findUnique({
      where: { id: context.params.povId }
    });

    if (!pov) {
      return NextResponse.json({
        error: {
          code: 'NOT_FOUND',
          message: 'POV not found'
        }
      }, { status: 404 });
    }

    return NextResponse.json({
      data: pov,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    });
  } catch (error) {
    console.error('[API Error]:', error);
    return NextResponse.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: { error: String(error) }
      }
    }, { status: 500 });
  }
}

// Rationale:
// - Complete type safety across API layer
// - Standardized error handling with type checking
// - Proper header typing with autocompletion
// - Consistent metadata handling
// - Request context type safety
// - Comprehensive error codes
// - Proper logging and debugging support
```
→ See [Type System Guidelines - API Response Types](./typeSystemGuidelines.md#2-api-response-types)

### 2. API Modularization
```typescript
// Decision: Enhanced modular API architecture with type safety
lib/[feature]/
├── types/                  // Feature-specific types
│   ├── index.ts           // Type exports
│   ├── requests.ts        // Request types
│   ├── responses.ts       // Response types
│   └── models.ts          // Domain models
├── prisma/                // Database layer
│   ├── select.ts          // Type-safe selects
│   ├── mappers.ts         // Type-safe mappers
│   └── validators.ts      // Data validation
├── handlers/              // API handlers
│   ├── get.ts            // GET endpoints
│   ├── post.ts           // POST endpoints
│   └── validation.ts     // Request validation
├── services/             // Business logic
│   ├── core.ts          // Core service
│   ├── validation.ts    // Service validation
│   └── utils.ts         // Utilities
└── errors/              // Error handling
    ├── types.ts         // Error types
    ├── handlers.ts      // Error handlers
    └── messages.ts      // Error messages

// Example: Type-safe team management
interface TeamUpdateRequest {
  title?: string;
  description?: string;
  members: Array<{
    userId: string;
    role: TeamRole;
    permissions?: Permission[];
  }>;
  metadata?: Record<string, unknown>;
}

// Example: Type-safe handler with validation
export async function POST(
  req: NextRequest,
  context: ApiContext<{ teamId: string }>
): Promise<NextResponse<ApiResponse<Team>>> {
  try {
    // Validate request with type safety
    const data = await validateTeamUpdate(
      await req.json()
    );

    // Permission check with proper typing
    const validation = await validateTeamAccess(
      context.user,
      context.params.teamId,
      TeamAction.UPDATE
    );

    if (!validation.valid) {
      return NextResponse.json({
        error: {
          code: 'FORBIDDEN',
          message: validation.message,
          details: validation.details
        }
      }, { status: 403 });
    }

    // Update team with transaction safety
    const team = await prisma.$transaction(async (tx) => {
      // Update team
      const updated = await tx.team.update({
        where: { id: context.params.teamId },
        data: {
          title: data.title,
          description: data.description,
          metadata: data.metadata,
          members: {
            deleteMany: {},
            create: data.members.map(member => ({
              userId: member.userId,
              role: member.role,
              permissions: member.permissions
            }))
          }
        },
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      });

      // Log activity
      await tx.activity.create({
        data: {
          type: 'TEAM_UPDATE',
          teamId: updated.id,
          userId: context.user.id,
          details: {
            changes: data,
            previousState: team
          }
        }
      });

      return updated;
    });

    // Return type-safe response
    return NextResponse.json({
      data: team,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Rationale:
// - Enhanced type safety across all layers
// - Clear separation of concerns
// - Proper error handling and validation
// - Transaction safety for data integrity
// - Activity logging for audit trails
// - Consistent patterns across features
// - Proper permission boundaries
// - Dedicated type definitions
// - Comprehensive error handling
```
→ See [API Refactoring Guide](./api_refactoring_guide.md)

### 3. Authentication
```typescript
// Decision: Enhanced TokenPayload with standardized structure
interface TokenPayload extends JWTPayload {
  userId: string;      // User's unique identifier
  email: string;       // User's email
  role: UserRole;      // User's role
  exp?: number;        // Expiration timestamp
  iat?: number;        // Issued at timestamp
}

// Cookie Configuration
interface CookieConfig {
  accessToken: string;           // Standard name for access token cookie
  refreshToken: string;          // Standard name for refresh token cookie
  secure: boolean;              // Environment-based secure flag
  sameSite: 'lax' | 'strict';  // SameSite policy
  domain?: string;             // Optional domain restriction
  path: string;                // Cookie path
}

// Rationale:
// - Standardized token payload structure
// - Centralized cookie configuration
// - Environment-aware security settings
// - Proper type safety and validation
```
→ See [Cookie & Token Standards](./cookie-token-standards.md)

## Future Considerations
→ See [Project Roadmap](./projectRoadmap.md) for timeline

### 1. Mobile Development
- Evaluate React Native
- Consider Progressive Web App
- Plan offline capabilities
→ See [Functional Requirements - Mobile Access](./functionalRequirements.md#mobile-access)

### 2. AI Integration
- Evaluate ML models for suggestions
- Consider NLP improvements
- Plan learning system
→ See [Functional Requirements - Suggestion Engine](./functionalRequirements.md#suggestion-engine)

### 3. Type Generation
- Consider implementing automated type generation
- Evaluate GraphQL/OpenAPI integration
- Plan for API schema versioning
→ See [Project Roadmap - Next Steps](./projectRoadmap.md#short-term-next-2-weeks)

### 2. Performance
- Bundle size optimization
- Code splitting strategies
- Caching improvements
→ See [Project Roadmap - Performance Optimization](./projectRoadmap.md#4-performance-optimization-)

### 3. Security
- Regular security audits
- Authentication enhancements
- Authorization improvements
→ See [Technical Learnings - Authentication System](./technicalLearnings.md#authentication-system)

## Development Guidelines

### 1. Type Safety
- Follow [Type System Guidelines](./typeSystemGuidelines.md)
- Use strict type checking
- Implement proper error handling
→ See [Type System Guidelines - Type Safety Checklist](./typeSystemGuidelines.md#type-safety-checklist)

### 2. Testing
- Write type-safe tests
- Use custom matchers
- Maintain high coverage
→ See [Type System Guidelines - Testing Types](./typeSystemGuidelines.md#testing-types)

### 3. Code Quality
- Follow ESLint rules
- Maintain consistent formatting
- Document complex types
→ See [Type System Guidelines - Best Practices](./typeSystemGuidelines.md#best-practices)

## Related Documentation
- [Technical Learnings](./technicalLearnings.md)
- [Type System Guidelines](./typeSystemGuidelines.md)
- [Project Roadmap](./projectRoadmap.md)
- [Current Task](./currentTask.md)
- [Codebase Summary](./codebaseSummary.md)
- [Authentication Documentation](./authentication.md)
- [Cookie & Token Standards](./cookie-token-standards.md)
