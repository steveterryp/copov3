# Notification System Setup Guide

## Overview
This guide walks through setting up the real-time notification system using efficient polling with caching, including server configuration, authentication, and client integration.

## Prerequisites
- Node.js 18+
- Access to authentication service
- SSL certificate (for production)
- Access to Slack/Teams workspaces
- Email service credentials

## Step-by-Step Setup

1. Environment Variables
   ```bash
   # Add to .env file
   JWT_SECRET=your-secret-key
   ACCESS_TOKEN_SECRET=your-access-token-secret

   # Email Configuration
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-username
   SMTP_PASS=your-password
   
   # Slack Integration
   SLACK_BOT_TOKEN=xoxb-your-token
   SLACK_SIGNING_SECRET=your-secret
   
   # Teams Integration
   TEAMS_APP_ID=your-app-id
   TEAMS_APP_SECRET=your-secret
   ```

2. Authentication Setup
   ```typescript
   // Configure JWT settings in config.ts
   export const config = {
     auth: {
       accessToken: {
         secret: process.env.ACCESS_TOKEN_SECRET,
         expiresIn: '1h'
       }
     }
   };
   ```

3. Client Integration
   ```typescript
   // Use NotificationProvider in your app
   import { NotificationProvider } from './components/notifications';

   function App() {
     return (
       <NotificationProvider>
         <YourApp />
       </NotificationProvider>
     );
   }
   ```

## Component Setup

### NotificationProvider
```typescript
// Add to layout or high-level component
import { NotificationProvider } from './components/notifications';

function Layout({ children }) {
  return (
    <NotificationProvider maxNotifications={50}>
      {children}
    </NotificationProvider>
  );
}
```

### NotificationBell
```typescript
// Add to header or navigation
import { NotificationBell } from './components/notifications';

function Header() {
  return (
    <header>
      <NotificationBell />
    </header>
  );
}
```

### Using Notifications
```typescript
// In your components
import { useNotifications } from './components/notifications';

function MyComponent() {
  const { addNotification, loading, error } = useNotifications();

  // Monitor loading and error states
  useEffect(() => {
    if (error) {
      console.error('Notification error:', error);
    }
  }, [error]);

  // Add manual notification
  const handleEvent = () => {
    addNotification(
      'Success',
      'Operation completed',
      { type: 'success' }
    );
  };
}
```

### Server-Side Notifications
```typescript
// Send notifications from server
import { sendNotification } from '@/lib/notifications/send-notification';

async function notifyUser(userId: string) {
  await sendNotification(
    userId,
    'Update Available',
    'New version has been released',
    { 
      type: 'info',
      actionUrl: '/updates'
    }
  );
}
```

## Quick Test Guide

### Test User Setup
Use this test account:
```
Name: Rika Terry
Email: rika@example.com
Password: rikrik123
```

### Testing Steps

1. Start the Server:
   ```bash
   npm run dev
   ```

2. Login:
   - Open your browser to http://localhost:3000/login
   - Enter email: rika@example.com
   - Enter password: rikrik123
   - Click "Sign in"

3. Test Notifications:
   - Open a new terminal
   - Run the test script:
     ```bash
     npx tsx scripts/test-notification.ts
     ```
   - You should see output showing the notification details
   - The script will show ✅ if successful or ❌ if there's an error

   Example output:
   ```
   Sending notification:
   To: rika@example.com
   Title: Test Notification
   Message: Hello Rika! This is a test notification.
   Options: { type: 'success' }

   ✅ Test notification sent successfully
   ```

4. View Notifications:
   - Look for the notification bell icon in the top-right corner
   - Click it to see all notifications
   - New notifications will appear within 30 seconds (polling interval)
   - Notifications can be marked as read by clicking them

### Testing Mock Setup
   ```typescript
   // In your test files
   import { mockUseNotifications } from '../test/mocks/use-notifications';

   // Mock the hook
   jest.mock('../lib/hooks/useNotifications', () => ({
     useNotifications: () => mockUseNotifications()
   }));
   ```

2. Test Notifications
   ```typescript
   it('handles notifications', async () => {
     render(<YourComponent />);

     // Simulate notification
     mockUseNotifications.addNotification({
       title: 'Test',
       message: 'Test message',
       type: 'info'
     });

     // Verify notification
     expect(screen.getByTestId('notification')).toBeInTheDocument();
   });
   ```

## Troubleshooting

### Common Issues

1. Notifications Not Updating
   - Check if polling interval is set correctly
   - Verify If-Modified-Since header is being sent
   - Check browser console for errors
   - Verify server can send notifications

2. Authentication Issues
   - Verify JWT configuration
   - Check token expiration
   - Validate token payload structure
   - Ensure secrets match between services

3. Performance Issues
   - Check polling interval (default: 30s)
   - Verify If-Modified-Since caching works
   - Monitor server response times
   - Check browser network tab

### Debugging Tools

1. Status Monitoring
   ```typescript
   const { loading, error } = useNotifications();
   console.log('Loading:', loading, 'Error:', error);
   ```

2. Notification State
   ```typescript
   const { notifications } = useNotifications();
   console.log('Current notifications:', notifications);
   ```

## Security Notes

1. Token Management
   - Use httpOnly cookies for tokens
   - Implement token refresh mechanism
   - Never expose secrets in client code
   - Validate token payload structure

2. Request Security
   - Use SSL in production
   - Validate all incoming data
   - Implement rate limiting
   - Monitor request patterns

3. Data Validation
   - Validate notification format
   - Sanitize notification content
   - Implement activity tracking

## Next Steps

1. Configure notification preferences
   - Set up user preferences
   - Configure polling interval
   - Set maximum notifications
   - Define notification categories

2. Implement monitoring
   - Add request logging
   - Track notification delivery
   - Monitor system health
   - Set up alerts

3. Plan for scaling
   - Optimize polling frequency
   - Add response caching
   - Plan database scaling
   - Consider load balancing

4. Configure External Notifications

   ### Slack Integration
   - Create Slack App:
     * Go to https://api.slack.com/apps
     * Create New App
     * Add permissions: chat:write, im:write, channels:read
     * Install to workspace
     * Copy Bot User OAuth Token
   - Test Integration:
     ```bash
     # Send test message
     npm run test-slack general "Test notification"
     ```

   ### Teams Integration
   - Set up Teams App:
     * Go to https://dev.teams.microsoft.com/apps
     * Register new app
     * Add permissions: ChatMessage.Send, ChannelMessage.Send
     * Generate client secret
     * Copy App ID and secret
   - Test Integration:
     ```bash
     # Send test message
     npm run test-teams general "Test notification"
     ```

   ### Email Integration
   - Configure Email Service:
     * Set up SMTP configuration
     * Create email templates directory:
       ```bash
       mkdir -p templates/email
       cp notification-templates/* templates/email/
       ```
     * Test email delivery:
       ```bash
       npm run test-email your@email.com
       ```
   - Verify Setup:
     ```bash
     # Run verification script
     npm run verify-notifications
     ```

5. External Integration Monitoring
   - Track delivery success rates
   - Monitor service health
   - Set up failure alerts
   - Collect usage metrics

## Related Documentation
- [Notifications](../cline_docs/notifications.md)
- [Tech Stack](../cline_docs/techStack.md)
- [System Architecture](../cline_docs/system-architecture.md)
- [Authentication System](../cline_docs/auth-system.md)
