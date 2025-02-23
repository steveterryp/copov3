# Admin Features Documentation

## Architecture Overview

The admin section of the application follows a modular architecture built on Next.js 13+ with App Router, utilizing Material-UI for components and styling. The architecture is organized into several key layers:

### Directory Structure

```
app/
├── (authenticated)/          # Protected routes
│   └── admin/               # Admin section routes
│       ├── dashboard/       # Admin dashboard
│       ├── roles/           # Job titles management
│       ├── users/           # User management
│       ├── permissions/     # User permissions
│       ├── audit/          # Audit logging
│       ├── crm/            # CRM integration
│       │   ├── mapping/    # Field mappings
│       │   ├── settings/   # CRM settings
│       │   └── sync/       # Sync configuration
│       └── phases/         # Phase management
│           ├── templates/  # Phase templates
│           └── workflow/   # Workflow configuration
├── api/                     # API routes
│   └── admin/              # Admin-specific endpoints
components/
├── admin/                   # Admin-specific components
│   ├── AuditLog/           # Audit logging components
│   ├── UserManagement/     # User management components
│   └── UserForm/           # User creation/editing form
├── layout/                  # Shared layout components
│   └── AdminNav.tsx        # Admin navigation sidebar
lib/
├── admin/                   # Admin business logic
│   ├── handlers/           # API route handlers
│   ├── hooks/              # Custom React hooks
│   ├── prisma/             # Database queries & mappers
│   ├── services/           # Business logic services
│   └── types/              # TypeScript definitions
└── auth/                    # Authentication & authorization
```

## Key Features

### 1. Admin Dashboard

The admin dashboard provides a comprehensive overview of all administrative features:

- User Management
- User Permissions
- Job Titles
- CRM Integration
- Phase Templates
- Audit Logging

Each section is represented by a card with:
- Clear title and description
- Quick access button
- Visual icon representation

### 2. Job Titles Management

A dedicated interface for managing organizational roles:

- Create, edit, and delete job titles
- View users assigned to each role
- Prevent deletion of roles with assigned users
- Case-insensitive duplicate name detection

### 3. User Management

Comprehensive user management system with:

- User creation and editing
- Role assignment
- Status management
- Custom job title assignment
- Last login tracking
- Bulk actions support

### 4. Audit Logging

Advanced audit logging system featuring:

- Detailed activity tracking
- Filtering by:
  - Activity type
  - Action
  - Date range
- Real-time updates
- Pagination support
- Metadata display
- User attribution

### 5. CRM Integration

Multi-faceted CRM integration management:

- Field mapping configuration
- Sync settings
- Template management
- Integration status monitoring

### 6. Phase Management

Comprehensive phase and workflow management:

- Phase template creation
- Workflow configuration
- Approval process setup
- Status tracking

## Navigation System

The navigation system has been standardized with consistent paths:

```typescript
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, href: '/admin/dashboard' },
  { text: 'PoV Management', icon: <DescriptionIcon />, href: '/admin/pov' },
  { text: 'Analytics', icon: <AnalyticsIcon />, href: '/admin/analytics' },
  { text: 'Users', icon: <GroupIcon />, href: '/admin/users' },
  { text: 'User Permissions', icon: <SecurityIcon />, href: '/admin/permissions' },
  { text: 'Job Titles', icon: <WorkIcon />, href: '/admin/roles' },
  { text: 'Audit Log', icon: <HistoryIcon />, href: '/admin/audit' },
  { text: 'Settings', icon: <SettingsIcon />, href: '/admin/settings' },
];
```

## Data Access Patterns

The application follows consistent data access patterns:

1. **API Response Format**:
   ```typescript
   // Type-safe API response format
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

   // Example usage in API route
   export async function GET(req: NextRequest) {
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

       const data = await fetchData();
       return NextResponse.json({
         data,
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
   ```

2. **Data Fetching**:
   - Custom hooks for data management
   - Consistent error handling
   - Loading state management
   - Automatic data refresh

3. **State Management**:
   - Local state for UI components
   - Server state through SWR/React Query
   - Optimistic updates for better UX

## Component Architecture

### 1. Form Components

All form components follow a consistent pattern:

- Validation using React Hook Form
- Material-UI integration
- Error message handling
- Loading state management
- Success/failure notifications

### 2. Table Components

Table components include:

- Sorting capabilities with type-safe column definitions
- Pagination with proper error handling
- Advanced filtering with validation
- Bulk actions with confirmation
- Row-level actions with permissions
- Loading states with skeletons
- Empty state handling with proper messaging

Example implementation:
```typescript
// Type-safe table configuration
interface TableConfig<T> {
  columns: Array<{
    key: keyof T;
    label: string;
    sortable?: boolean;
    filter?: {
      type: 'text' | 'select' | 'date' | 'boolean';
      options?: Array<{
        value: string;
        label: string;
      }>;
    };
    render?: (value: T[keyof T], row: T) => React.ReactNode;
  }>;
  defaultSort?: {
    column: keyof T;
    direction: 'asc' | 'desc';
  };
  bulkActions?: Array<{
    label: string;
    icon: React.ReactNode;
    action: (selectedIds: string[]) => Promise<void>;
    confirm?: {
      title: string;
      message: string;
    };
    permission?: string;
  }>;
  rowActions?: Array<{
    label: string;
    icon: React.ReactNode;
    action: (id: string) => Promise<void>;
    confirm?: {
      title: string;
      message: string;
    };
    permission?: string;
  }>;
}

// Example usage
const userTableConfig: TableConfig<User> = {
  columns: [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filter: { type: 'text' }
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      filter: {
        type: 'select',
        options: [
          { value: 'USER', label: 'User' },
          { value: 'ADMIN', label: 'Admin' }
        ]
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Chip
          label={value}
          color={value === 'ACTIVE' ? 'success' : 'error'}
        />
      )
    }
  ],
  defaultSort: {
    column: 'name',
    direction: 'asc'
  },
  bulkActions: [
    {
      label: 'Delete Selected',
      icon: <DeleteIcon />,
      action: deleteUsers,
      confirm: {
        title: 'Delete Users',
        message: 'Are you sure you want to delete the selected users?'
      },
      permission: 'DELETE_USERS'
    }
  ]
};
```

### 3. Dialog Components

Standard dialog implementation:

- Consistent layout
- Action buttons
- Error handling
- Loading states
- Form integration

## Best Practices

1. **Error Handling**:
   - Consistent error message format
   - User-friendly error displays
   - Detailed error logging
   - Recovery options

2. **Performance**:
   - Optimized data fetching
   - Efficient re-renders
   - Lazy loading
   - Caching strategies

3. **Security**:
   - Role-based access control
   - API route protection
   - Input validation
   - XSS prevention

4. **Accessibility**:
   - ARIA labels
   - Keyboard navigation
   - Screen reader support
   - Color contrast compliance

5. **Testing**:
   - Unit tests for components
   - Integration tests for workflows
   - API endpoint testing
   - End-to-end testing

## Future Enhancements

1. **Analytics Dashboard**:
   - User activity metrics
   - System performance monitoring
   - Usage statistics
   - Custom report generation

2. **Advanced Permissions**:
   - Granular permission control
   - Custom role creation
   - Permission inheritance
   - Activity-based permissions

3. **Audit Enhancements**:
   - Advanced filtering
   - Export capabilities
   - Real-time monitoring
   - Custom alert setup
