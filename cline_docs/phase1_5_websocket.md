# WebSocket Implementation

## Overview
The WebSocket server provides real-time communication capabilities for:
- Team activity updates
- PoV-specific notifications
- Client-server health monitoring

## Architecture

### Server Components
```typescript
// WebSocket client interface
interface WebSocketClient extends WebSocket {
  userId?: string;
  subscriptions?: Set<string>;
}

// WebSocket server instance
const wsServer = new WebSocketServer({ noServer: true });

// Activity broadcast helper
function broadcastActivity(wsServer: WebSocketServer, activity: any) {
  wsServer.clients.forEach((client: WebSocketClient) => {
    if (client.readyState === WebSocket.OPEN && 
        client.subscriptions?.has(activity.povId)) {
      client.send(JSON.stringify({
        type: 'activity',
        data: activity
      }));
    }
  });
}
```

### Authentication Flow
1. Token Generation
```typescript
// Generate WebSocket token from access token
export async function GET() {
  const accessToken = cookies().get('accessToken');
  const decoded = await verifyToken(accessToken.value);
  
  const wsToken = sign(
    {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    },
    config.auth.accessToken.secret,
    { expiresIn: '1h' }
  );

  return NextResponse.json({ token: wsToken });
}
```

2. Token Validation
```typescript
// Verify token using the same secret as the API
const payload = jwt.verify(token, config.auth.accessToken.secret);
if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
  socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  socket.destroy();
  return;
}
```

### Server Setup
```typescript
// Initialize WebSocket server
export function initializeWebSocketServer(server: Server): WebSocketServer {
  const wsServer = new WebSocketServer({ noServer: true });

  // Handle upgrade requests
  server.on('upgrade', async (request, socket, head) => {
    // Validate WebSocket path
    if (!request.url?.startsWith('/ws/')) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // Get token from query string
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      // Verify token and complete handshake
      const payload = jwt.verify(token, config.auth.accessToken.secret);
      if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wsServer.handleUpgrade(request, socket, head, (ws: WebSocketClient) => {
        ws.userId = payload.userId;
        ws.subscriptions = new Set();

        // Set up message handling
        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            handleMessage(ws, message);
          } catch (error) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid message format' 
            }));
          }
        });
      });
    } catch (error) {
      console.error('WebSocket token verification failed:', error);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  return wsServer;
}
```

### Security
1. Token-based Authentication
   - JWT validation on connection
   - User ID association with socket
   - Secure handshake process
   - Consistent token payload structure

2. Error Handling
   - Invalid token rejection
   - Connection validation
   - Message format validation
   - Token verification error logging

### Message Types
1. System Messages
   ```typescript
   // Ping/Pong for connection health
   { type: 'ping' }
   { type: 'pong' }
   ```

2. Subscription Management
   ```typescript
   // Subscribe to PoV updates
   { 
     type: 'subscribe',
     povId: string 
   }

   // Unsubscribe from PoV updates
   { 
     type: 'unsubscribe',
     povId: string 
   }
   ```

3. Activity Broadcasting
   ```typescript
   {
     type: 'activity',
     data: {
       id: string,
       type: ActivityType,
       action: ActivityAction,
       povId: string,
       userId: string
     }
   }
   ```

### Connection Flow
1. Client requests WebSocket token from /api/auth/ws-token
2. Server validates access token and generates WebSocket token
3. Client initiates WebSocket connection with token
4. Server validates token and payload structure
5. On success:
   - Creates WebSocket client
   - Associates user ID
   - Initializes subscriptions set
6. On failure:
   - Returns 401 Unauthorized
   - Closes connection
   - Logs verification error

### Subscription Management
1. Client subscribes to PoV:
   ```typescript
   client.subscriptions.add(povId);
   ```

2. Server confirms subscription:
   ```typescript
   { type: 'subscribed', povId }
   ```

3. Client unsubscribes:
   ```typescript
   client.subscriptions.delete(povId);
   ```

4. Server confirms unsubscription:
   ```typescript
   { type: 'unsubscribed', povId }
   ```

### Activity Broadcasting
1. Server receives activity:
   ```typescript
   broadcastActivity(wsServer, activity);
   ```

2. Server filters clients:
   - Checks readyState
   - Verifies subscription
   - Sends to matching clients

### Error Handling
1. Invalid Message Format:
   ```typescript
   { 
     type: 'error',
     message: 'Invalid message format'
   }
   ```

2. Unknown Message Type:
   ```typescript
   {
     type: 'error',
     message: 'Unknown message type'
   }
   ```

## Integration Points

### Activity Tracking
```typescript
// Middleware integration
activityTracker(request, next);
```

### Client Components
1. TeamActivity Widget
   - Real-time updates
   - Activity filtering
   - Subscription management
   - Connection status indicator

2. ActivityNotification Component
   - Toast notifications
   - Sound effects
   - Activity filtering
   - Connection status handling

## Performance Considerations
1. Connection Management
   - Ping/pong health checks
   - Automatic cleanup
   - Resource optimization
   - Token expiration handling

2. Message Broadcasting
   - Targeted delivery
   - Subscription-based filtering
   - Efficient client tracking
   - Token validation caching

## Future Enhancements
1. Message Queuing
   - Offline message storage
   - Message persistence
   - Delivery guarantees

2. Advanced Features
   - Presence detection
   - Typing indicators
   - Read receipts
   - Token refresh mechanism

3. Scaling
   - Load balancing
   - Connection pooling
   - Redis pub/sub
   - Token validation optimization
