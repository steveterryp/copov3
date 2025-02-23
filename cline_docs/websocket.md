# WebSocket System Documentation

## Overview
The WebSocket system provides real-time communication capabilities for the application, supporting team activity updates, PoV-specific notifications, and client-server health monitoring. It includes both server-side implementation and client-side integration through a custom React hook.

## Architecture

### Server Components

#### WebSocket Server
```typescript
interface WebSocketClient extends WebSocket {
  userId?: string;
  subscriptions?: Set<string>;
}

const wsServer = new WebSocketServer({ noServer: true });
```

#### Activity Broadcasting
```typescript
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

### Client Components

#### useWebSocket Hook
```typescript
interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnected';
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  // Implementation includes:
  // - Automatic connection management
  // - Token refresh
  // - Reconnection handling
  // - Message processing
};
```

## Authentication

### Token Generation
```typescript
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

### Connection Flow
1. Client requests WebSocket token from `/api/auth/ws-token`
2. Server validates access token and generates WebSocket token
3. Client initiates WebSocket connection with token
4. Server validates token and establishes connection
5. Connection is maintained with automatic reconnection

## Message Protocol

### System Messages
```typescript
// Health check messages
{ type: 'ping' }
{ type: 'pong' }

// Error messages
{ 
  type: 'error',
  message: string 
}
```

### Subscription Management
```typescript
// Subscribe to PoV
{ 
  type: 'subscribe',
  povId: string 
}

// Unsubscribe from PoV
{ 
  type: 'unsubscribe',
  povId: string 
}

// Subscription confirmations
{ type: 'subscribed', povId: string }
{ type: 'unsubscribed', povId: string }
```

### Activity Messages
```typescript
{
  type: 'activity',
  data: {
    id: string,
    type: ActivityType,
    action: ActivityAction,
    povId: string,
    userId: string,
    title: string,
    message: string,
    severity?: 'error' | 'warning' | 'info' | 'success',
    actionUrl?: string
  }
}
```

## Client Integration

### Basic Usage
```typescript
function MyComponent() {
  const { isConnected, sendMessage, lastMessage } = useWebSocket();

  // Subscribe to updates
  useEffect(() => {
    sendMessage({
      type: 'subscribe',
      povId: 'my-pov-id'
    });
  }, [sendMessage]);

  // Handle messages
  useEffect(() => {
    if (lastMessage?.type === 'activity') {
      // Process activity
    }
  }, [lastMessage]);
}
```

### Connection Management
```typescript
const { connectionStatus } = useWebSocket();

useEffect(() => {
  switch (connectionStatus) {
    case 'connected':
      // Handle initial connection
      break;
    case 'disconnected':
      // Handle disconnection
      break;
    case 'reconnected':
      // Handle reconnection
      break;
  }
}, [connectionStatus]);
```

## Testing

### Mock Implementation
```typescript
// Mock WebSocket hook
const mockUseWebSocket = () => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');

  useEffect(() => {
    // Setup listeners for test control
  }, []);

  return {
    isConnected: connectionStatus !== 'disconnected',
    connectionStatus,
    lastMessage,
    sendMessage: jest.fn()
  };
};

// Test utilities
const simulateWebSocketMessage = (message: WebSocketMessage) => {
  // Update mock state
};

const simulateConnectionStatus = (status: ConnectionStatus) => {
  // Update mock state
};
```

### Testing Patterns
```typescript
describe('WebSocket Integration', () => {
  beforeEach(() => {
    // Reset mocks and timers
  });

  it('handles connection changes', async () => {
    render(<MyComponent />);
    
    act(() => {
      simulateConnectionStatus('disconnected');
    });

    await waitFor(() => {
      // Verify component response
    });
  });
});
```

## Security Considerations

1. **Token Management**
   - Short-lived tokens (1 hour)
   - Secure token transmission
   - Token payload validation
   - Token refresh mechanism

2. **Connection Security**
   - SSL/TLS encryption
   - Token-based authentication
   - Connection validation
   - Message format validation

3. **Error Handling**
   - Invalid token rejection
   - Connection validation
   - Message format validation
   - Token verification error logging

## Performance Optimization

1. **Connection Management**
   - Automatic reconnection
   - Connection pooling
   - Resource cleanup
   - Token caching

2. **Message Handling**
   - Targeted message delivery
   - Subscription-based filtering
   - Efficient state updates
   - Batch processing

3. **State Management**
   - Optimistic updates
   - State reconciliation
   - Cache invalidation
   - Memory management

## Future Enhancements

1. **Offline Support**
   - Message queuing
   - Offline storage
   - Message persistence
   - Sync mechanisms

2. **Advanced Features**
   - Presence detection
   - Typing indicators
   - Read receipts
   - Activity status

3. **Scaling**
   - Load balancing
   - Connection pooling
   - Redis pub/sub
   - Horizontal scaling
