# Project Documentation

This directory contains comprehensive documentation for the project. Below is a guide to the available documentation files:

## Core Documentation

### System Foundation
- [System Architecture](./system-architecture.md) - High-level system design and patterns
- [Technical Stack](./techStack.md) - Overview of technologies used
- [Project Roadmap](./projectRoadmap.md) - Development timeline and milestones
- [Current Task](./currentTask.md) - Active development focus

### Security & Access Control
- [User Registration Implementation](./userRegImplementation.md) - Complete registration and verification system
  - Email verification flow
  - Secure password handling
  - JWT-based authentication
  - Refresh token support
  - TypeScript type safety
  - RBAC middleware
  - Detailed configuration
- [Authentication & Token Architecture](./auth-token-architecture.md) - Comprehensive authentication system
  - Type-safe JWT handling
  - Standardized token payloads
  - Secure session management
  - Error handling with type safety
  - Cookie and token standards
- [Custom Roles Architecture](./customRolesArchitecture.md) - Three-tier role system
  - System Roles (Role Types)
    ```typescript
    enum UserRole {
      USER = 'USER',
      ADMIN = 'ADMIN',
      SUPER_ADMIN = 'SUPER_ADMIN'
    }
    ```
  - User Permissions (Access Control)
    ```typescript
    interface Permission {
      resource: ResourceType;
      action: ResourceAction;
      conditions?: Record<string, unknown>;
    }
    ```
  - Team Roles (Team-specific Access)
    ```typescript
    interface TeamRole {
      teamId: string;
      role: TeamRoleType;
      permissions: Permission[];
    }
    ```
  - Job Titles (Organizational Structure)
    ```typescript
    interface JobTitle {
      id: string;
      name: string;
      level: number;
      department: string;
      metadata?: Record<string, unknown>;
    }
    ```
- [RBAC Implementation](./rbacImplementation.md) - Role-based access control system
  - Type-safe permission management
    ```typescript
    interface PermissionCheck {
      user: {
        id: string;
        role: UserRole;
        teamRoles?: TeamRole[];
      };
      resource: {
        id: string;
        type: ResourceType;
        ownerId?: string;
        teamId?: string;
      };
      action: ResourceAction;
    }
    ```
  - Resource-level access control
  - Team-based access control
  - Permission UI configuration

### Communication & Notifications
- [Notifications](./notifications.md) - Real-time notification system
  - Type-safe notification system
    ```typescript
    interface NotificationConfig {
      types: {
        [K in NotificationType]: {
          template: string;
          priority: 'HIGH' | 'MEDIUM' | 'LOW';
          category: NotificationCategory;
          channels: Channel[];
          metadata?: Record<string, unknown>;
        };
      };
    }
    ```
  - Type-safe channel configuration
    ```typescript
    interface ChannelConfig {
      type: Channel;
      enabled: boolean;
      settings: {
        email?: {
          template: string;
          from: string;
        };
        inApp?: {
          position: 'top-right' | 'bottom-right';
          duration: number;
        };
        push?: {
          icon: string;
          badge: string;
        };
      };
    }
    ```
  - Type-safe user preferences
    ```typescript
    interface NotificationPreferences {
      channels: Partial<Record<Channel, boolean>>;
      types: Partial<Record<NotificationType, boolean>>;
      frequency: {
        digest: boolean;
        digestInterval: 'HOURLY' | 'DAILY' | 'WEEKLY';
        quietHours?: {
          start: string;
          end: string;
        };
      };
    }
    ```

### Design & Features
- [Design Guide](./designGuide.md) - Detailed feature descriptions and functionality
- [Navigation Analysis Plan](./navigation-analysis-plan.md) - Three-phase approach to analyzing and improving navigation
  - Automated route analysis
  - Visual navigation mapping
  - Interactive testing
  - Success metrics and implementation strategy

## Subsystem Architecture
- [Component Architecture](./componentArchitecture.md) - Frontend component structure
- [Dashboard Architecture](./dashboardArchitecture.md) - Dashboard widget system and data flow
- [WebSocket](./websocket.md) - Real-time communication system
- [Task Management Architecture](./taskMgmtArchitecture.md) - Task system design and implementation
- [POV Architecture](./povArchitecture.md) - Point of View system design and implementation
- [Date Handling Architecture](./date-handling-architecture.md) - Date handling, timezone support, and formatting

## Feature Documentation
- [POV Features](./povFeatures.md) - Point of View functionality
- [Dashboard Spec](./dashboardSpec.md) - Dashboard features and metrics

## Development Guidelines
- [Style Guide](./styleGuide.md) - Code style and formatting rules
- [Type System Guidelines](./typeSystemGuidelines.md) - TypeScript type system improvements and best practices
  - Prisma type integration
  - Mapper function type safety
  - Type guards and assertions
  - Performance considerations
- [Component Casing Guidelines](./component-casing-guidelines.md) - React component naming and file structure standards
- [Workflows](./workflows.md) - Development processes

## Testing Documentation
- [Testing Phases](./testingPhases.md) - Test strategy and phases
- [API Jest](./apiJest.md) - API testing with Jest
- [Auth Jest](./authJest.md) - Authentication testing
- [POV Jest](./povJest.md) - POV feature testing

## Implementation Details
- [Phase 1 Implementation](./phase1Implementation.md) - Phase 1 details
- [Phase 1.5 Implementation](./phase1_5_implementation.md) - Phase 1.5 details
- [Phase 1.5 Schema](./phase1_5_schema.md) - Database schema updates
- [Phase 1.5 UI](./phase1_5_ui.md) - UI implementation details
- [Big POV Architecture](./bigPovArchitecture.md) - Enhanced POV system with CRM integration and workflows
- [Workflow System](./workflow-system.md) - Comprehensive workflow system documentation
- [Workflow Management System](./workflow-management-system.md) - Phase type and workflow configuration system
- [KPI Management System](./kpi-management-system.md) - KPI templates, tracking, and visualization system
- [CRM Management System](./crm-management-system.md) - Split CRM architecture for POV-specific and global operations
- [Launch Management System](./launch-management-system.md) - Checklist-driven POV launch validation system

## Migration Documentation
- [Migration Progress - Phase 1](./migration/migrationProgress1.md) - Progress report on migrating from Material UI to Shadcn UI
  - Component migration status
  - Key learnings and patterns
  - Common issues and solutions
  - Migration checklist
  - Troubleshooting guide

## Technical Notes
- [Technical Learnings](./technicalLearnings.md) - Development insights and best practices
  - Authentication system improvements
  - Cookie and JWT token management
  - Security best practices
  - Error handling patterns
- [Schema Architecture](./schemaArchitecture.md) - Strategy for managing large Prisma schemas
- [Branch Comparison](./BranchComparison.md) - Git branch analysis

## User Instructions
Located in the `/userInstructions` directory:
- [Integration Setup](../userInstructions/integration-setup.md)
- [Notification Setup](../userInstructions/notification-setup.md)

## Features Directory
The `/features` directory contains detailed specifications for individual features and functionality.

## Keeping Documentation Updated
Documentation should be updated whenever:
1. New features are added
2. Existing features are modified
3. Architecture changes are made
4. Development processes are updated
5. New learnings are discovered

## Architecture Standards
- Follow the patterns defined in [System Architecture](./system-architecture.md)
- Implement security measures outlined in [Authentication & Token Architecture](./auth-token-architecture.md)
- Document technical decisions and learnings in [Technical Learnings](./technicalLearnings.md)
- Follow component naming conventions in [Component Casing Guidelines](./component-casing-guidelines.md)

## Documentation Standards
- Use clear, concise language
- Include code examples where relevant
- Keep formatting consistent
- Update related documents together
- Reference other documents when appropriate

## Contributing
When adding new documentation:
1. Follow the existing format
2. Update the README.md
3. Link related documents
4. Include necessary diagrams
5. Add to appropriate section
