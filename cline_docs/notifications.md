# Notification System Documentation

## Overview
The notification system provides notifications for application events. Notifications are loaded when the user logs in and remain static until the page is refreshed or the user logs in again. The system supports various notification types and integrates tightly with the authentication system to ensure secure, user-scoped notifications.

## Notification Loading Mechanism

When a user logs in:

1. **Full page refresh**: The page performs a full refresh.
2. **AppLayout mounts**: The `AppLayout` component mounts, which includes the `NotificationBell` component if the user is authenticated.
3. **NotificationBell mounts**: The `NotificationBell` component mounts.
4. **useEffect hook runs**:  `NotificationBell`'s `useEffect` hook runs on mount and loads notifications.
5. **Static notifications**: Notifications are loaded fresh and remain static until the user refreshes the page or logs in again.
6. **Individual updates**: Individual notifications update their read status when clicked, but the list of notifications is not dynamically updated in real-time.

This means notifications are loaded fresh every time the user logs in or refreshes the page.

## Architecture

### Modular API Structure
Following our [API Refactoring Guide](./api_refactoring_guide.md), the notification system uses a modular architecture:

```
lib/notifications/
├── types.ts                 # Notification type definitions
├── prisma/
│   ├── select.ts           # Prisma select types
│   └── mappers.ts          # Type mappers
├── handlers/
│   ├── get.ts              # GET notifications handler
│   ├── post.ts             # Create notification handler
│   └── read.ts             # Mark as read handler
└── services/
    ├── activity.ts         # Activity logging
    ├── delivery.ts         # Notification delivery
    └── cleanup.ts          # Auto-cleanup service
```

#### Type Definitions (types.ts)
```typescript
// Type-safe notification enums
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export enum NotificationCategory {
  TASK = 'TASK',
  POV = 'POV',
  PHASE = 'PHASE',
  SYSTEM = 'SYSTEM',
  TEAM = 'TEAM'
}

// Type-safe notification interfaces
export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    resourceId?: string;
    resourceType?: string;
    triggeredBy?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationResponse {
  data: Notification[];
  unreadCount: number;
  metadata?: {
    lastFetchedAt: string;
    hasMore: boolean;
  };
}

export interface CreateNotificationRequest {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  userId: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

// Type-safe error handling
export interface NotificationError {
  code: 'DELIVERY_FAILED' | 'INVALID_USER' | 'SYSTEM_ERROR';
  message: string;
  details?: Record<string, unknown>;
}
```

#### Prisma Layer (prisma/)
```typescript
// select.ts
export const notificationSelect = {
  id: true,
  type: true,
  title: true,
  message: true,
  userId: true,
  read: true,
  actionUrl: true,
  createdAt: true,
} as const;

// mappers.ts
export function mapNotificationFromPrisma(
  notification: PrismaNotification
): Notification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    userId: notification.userId,
    read: notification.read,
    actionUrl: notification.actionUrl,
    createdAt: notification.createdAt,
  };
}
```

#### Handlers (handlers/)
```typescript
// get.ts with proper error handling
export const getNotificationsHandler: ApiHandler<NotificationResponse> = 
  async (req, context, user) => {
    try {
      // Parse query parameters with validation
      const { page = 1, limit = 50 } = parseQueryParams(req.url);
      const skip = (page - 1) * limit;

      // Get notifications with proper includes
      const [notifications, unreadCount] = await prisma.$transaction([
        prisma.notification.findMany({
          where: { 
            userId: user.id,
            createdAt: {
              gte: subDays(new Date(), 30) // Only last 30 days
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.notification.count({
          where: { 
            userId: user.id,
            read: false
          }
        })
      ]);

      // Map with proper error handling
      const mappedNotifications = notifications.map(notification => {
        try {
          return mapNotificationFromPrisma(notification);
        } catch (error) {
          console.error(
            `[Notification Mapping Error] ID: ${notification.id}:`,
            error
          );
          return null;
        }
      }).filter((n): n is Notification => n !== null);

      return {
        data: mappedNotifications,
        unreadCount,
        metadata: {
          lastFetchedAt: new Date().toISOString(),
          hasMore: notifications.length === limit
        }
      };
    } catch (error) {
      console.error('[Get Notifications Error]:', error);
      throw new Error('Failed to fetch notifications');
    }
  };

// post.ts with validation
export const createNotificationHandler: ApiHandler<void> = 
  async (req, context, user) => {
    try {
      const text = await req.text();
      console.log('[Create Notification] Raw request body:', text);
      
      const data = JSON.parse(text);
      if (!isValidNotificationRequest(data)) {
        throw new Error('Invalid notification request');
      }

      await createNotification({
        ...data,
        metadata: {
          ...data.metadata,
          createdBy: user.id,
          createdAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('[Create Notification Error]:', error);
      throw error;
    }
  };

// Type guard for request validation
function isValidNotificationRequest(
  data: unknown
): data is CreateNotificationRequest {
  if (!data || typeof data !== 'object') return false;
  const request = data as CreateNotificationRequest;
  
  return (
    typeof request.title === 'string' &&
    typeof request.message === 'string' &&
    typeof request.userId === 'string' &&
    Object.values(NotificationType).includes(request.type) &&
    Object.values(NotificationCategory).includes(request.category)
  );
}
```

#### Services (services/)
```typescript
// delivery.ts
export async function createNotification(
  data: CreateNotificationRequest
): Promise<void> {
  await prisma.notification.create({
    data: {
      ...data,
      read: false,
    },
  });
  
  await trackActivity({
    type: 'notification_created',
    userId: data.userId,
    metadata: { notificationType: data.type },
  });
}

// cleanup.ts
export async function cleanupOldNotifications(): Promise<void> {
  const threshold = subDays(new Date(), 7);
  await prisma.notification.deleteMany({
    where: {
      read: true,
      createdAt: { lt: threshold },
    },
  });
}
```

### Frontend Components

#### NotificationProvider
- Manages global notification state
- Handles polling and caching (Note: Polling and caching are not currently implemented as per the updated description)
- Provides context for notification operations
- Auto-cleanup of old notifications (Note: Auto-cleanup is mentioned but not detailed in the provided documentation)
- Connection status management (Note: Connection status management is mentioned but might not be fully relevant in the current static loading approach)

#### NotificationContext
Provides:
- `notifications`: Array of current notifications
- `addNotification`: Add new notifications
- `markAsRead`: Mark notifications as read
- `clearAll`: Clear all notifications
- `refresh`: Manual refresh function (Note: Refresh function might not trigger real-time updates in the current static approach)
- `loading`: Loading state
- `error`: Error state
- `initialFetchFailed`: Initial fetch status

### Data Types

```typescript
interface NotificationPayload {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface UseNotificationsResult {
  loading: boolean;
  notifications: NotificationPayload[];
  error: Error | null;
  addNotification: (title: string, message: string, options?: any) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  refresh: () => Promise<void>;
  initialFetchFailed: boolean;
}
```

### Authentication Integration
→ [Authentication Documentation](./authentication.md)

#### Token Management
- Uses httpOnly cookies for authentication
- Middleware automatically adds Authorization header
- All requests include credentials
- Notifications scoped to authenticated user

#### Security Flow
1. Authentication Check:
   ```typescript
   // Frontend Hook
   const response = await fetch('/api/notifications', {
     credentials: 'include'
   });

   // Backend
   if (!verifyToken(request.cookies)) {
     return unauthorized();
   }
   ```

2. Request Authentication:
   ```typescript
   // API requests include credentials
   fetch('/api/notifications', {
     credentials: 'include',
     headers: {
       'If-Modified-Since': lastFetchTime.toUTCString()
     }
   });
   ```

3. User Scoping:
   ```typescript
   // Notifications fetched per user
   const notifications = await prisma.notification.findMany({
     where: { userId: user.userId }
   });
   ```

## Notification Types

### Task Assignment Notifications

The system automatically sends notifications when tasks are assigned to users:

1. **Trigger Points**:
   ```typescript
   // In TaskService
   if (task.assigneeId) {
     await sendAssigneeNotification(
       task.id,
       task.assigneeId,
       task.title,
       task.povId
     );
   }
   ```

   Notifications are sent:
   - When creating a new task with an assignee
   - When adding an assignee to an existing task
   - When changing a task's assignee

2. **Notification Format**:
   ```typescript
   {
     type: NotificationType.INFO,
     title: 'New Task Assignment',
     message: `Assigned task ${taskTitle} by ${povOwner.name}`,
     userId: assigneeId,
     actionUrl: `/pov/${povId}/phase/${phaseId}/tasks`
   }
   ```

3. **Implementation Details**:
   - Fetches POV owner's name for context
   - Includes link to task list page
   - Handles edge cases (missing POV/phase)
   - Non-blocking (task operations succeed even if notification fails)

4. **User Experience**:
   - Appears in notification bell immediately
   - Shows task name and assigner
   - Links directly to relevant task list
   - Can be marked as read with one click

## Usage

### Basic Usage

```tsx
import { useNotifications } from './notifications';

function MyComponent() {
  const { addNotification } = useNotifications();

  const handleEvent = () => {
    addNotification(
      'Success',
      'Operation completed',
      { type: 'success' }
    );
  };
}
```

### Helper Methods

```tsx
const {
  notifications, // Current notifications
  loading,      // Loading state
  error,        // Error state
  markAsRead,   // Mark as read function
  clearAll,     // Clear all function
  refresh       // Manual refresh function
} = useNotifications();

// Example usage
markAsRead('notification-id');
```

### Connection Status

```tsx
const { initialFetchFailed, loading } = useNotifications();

// Handle connection status
if (initialFetchFailed) {
  // Show error state
}
```

## Features

### Efficient Polling
- Regular polling with configurable interval (default: 30s)
- Uses If-Modified-Since header for caching
- 304 Not Modified responses preserve bandwidth
- Automatic retry on failure
**(Note: These features are described but not currently implemented as per the updated overview)**

### Auto-Cleanup
- Unread notifications are kept indefinitely
- Read notifications are automatically cleaned up after 7 days
- Client-side state management
**(Note: Auto-cleanup implementation details are not provided in the documentation)**

### Connection Management
- Automatic retry on failure
- Exponential backoff
- Connection status tracking
- Error state handling
**(Note: Connection management features might not be fully relevant in the current static loading approach)**

### Server-Side Notifications
Send notifications from the server using the utility function:
```typescript
import { sendNotification } from '@/lib/notifications/send-notification';

await sendNotification(
  userId,
  'Title',
  'Message',
  { 
    type: 'success',
    actionUrl: '/some/path'
  }
);
```

## Testing

### Automated Testing
- Polling mechanism testing
- Connection status simulation
- Notification message testing
- Cleanup handling
**(Note: Testing for polling, connection status, and cleanup might not be fully relevant in the current static loading approach)**

### Manual Testing

#### Setup
1. Start development server:
   ```bash
   npm run dev
   ```

2. Create test notification:
   ```bash
   npx tsx scripts/test-notification.ts
   ```

#### Browser Console Testing

1. Basic Notifications
   ```javascript
   const { addNotification } = useNotifications();

   // Success notification
   addNotification(
     'Success Title',
     'Operation completed successfully',
     { type: 'success' }
   );

   // Error notification
   addNotification(
     'Error Title',
     'Something went wrong',
     { type: 'error' }
   );
   ```

2. Testing Options
   ```javascript
   // Full options example
   addNotification(
     'Complete Example',
     'Testing all options',
     {
       type: 'info',           // 'success' | 'error' | 'warning' | 'info'
       actionUrl: '/test',     // clicking notification navigates here
     }
   );
   ```

3. Managing Notifications
   ```javascript
   const { notifications, markAsRead, clearAll } = useNotifications();

   // View all notifications
   console.log('Current notifications:', notifications);

   // Mark notification as read
   markAsRead('notification-id');

   // Clear all notifications
   clearAll();
   ```

#### Visual Verification

1. Notification Display
   - Notifications appear in top-right corner
   - Newest notifications appear at top
   - Maximum 50 notifications shown
   - Proper styling for each type (success, error, warning, info)

2. Interaction Features
   - Click notification to mark as read
   - Click action URL to navigate
   - Click X to dismiss
   - Notification bell shows unread count

3. Connection Status
   - Loading states during fetches
   - Error states on failure
   - Retry mechanism on failure
**(Note: Connection status verification might not be fully relevant in the current static loading approach)**


## Best Practices

1. **Error Handling**
   - Use appropriate notification types for different scenarios
   - Include actionable information in error messages
   - Provide action URLs when applicable

2. **Performance**
   - Use If-Modified-Since for efficient polling
   - Implement cleanup for old notifications
   - Handle loading and error states
**(Note: Performance best practices related to polling and caching might not be applicable in the current static loading approach)**

3. **Connection Management**
   - Monitor connection status
   - Provide fallback UI for errors
   - Handle retries gracefully
**(Note: Connection management best practices might not be fully relevant in the current static loading approach)**

4. **State Management**
   - Keep notifications sorted by timestamp
   - Handle read/unread status efficiently
   - Limit maximum number of notifications

## Component Integration

### NotificationBell
- Displays unread notification count
- Provides access to notification center
- Shows loading/error states

### NotificationCenter
- Lists all notifications
- Supports mark as read functionality
- Provides clear all option
- Shows empty state when no notifications

### NotificationItem
- Displays individual notification
- Handles read/unread status
- Supports action URLs
- Shows timestamp and type indicator
