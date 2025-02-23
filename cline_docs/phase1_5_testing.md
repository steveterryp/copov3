# Phase 1.5 Testing Strategy

## WebSocket Testing

### Test Structure
```typescript
describe('WebSocket Server', () => {
  describe('Connection Handling', () => {
    // Connection tests
  });

  describe('Message Handling', () => {
    // Message handling tests
  });
});
```

### Mock Implementation
```typescript
// Mock WebSocket Client
class MockWebSocket {
  on = jest.fn();
  send = jest.fn();
  readyState = WebSocket.OPEN;
  subscriptions = new Set();
}

// Mock WebSocket Server
const mockServer = {
  handleUpgrade: jest.fn((req, socket, head, cb) => {
    const ws = new MockWebSocket();
    cb(ws);
  }),
  close: jest.fn(cb => cb?.()),
  clients: new Set(),
};
```

### Test Cases

#### Connection Tests
1. Token Validation
```typescript
it('should reject connections without token', (done) => {
  const socket = {
    write: jest.fn(),
    destroy: jest.fn(),
  };

  httpServer.emit('upgrade', request, socket, Buffer.from(''));

  setImmediate(() => {
    expect(socket.write).toHaveBeenCalledWith('HTTP/1.1 401 Unauthorized\r\n\r\n');
    expect(socket.destroy).toHaveBeenCalled();
    done();
  });
});
```

2. Invalid Token Handling
```typescript
it('should reject connections with invalid token', (done) => {
  (verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));
  // Test implementation
});
```

3. Successful Connection
```typescript
it('should accept connections with valid token', (done) => {
  (verifyToken as jest.Mock).mockResolvedValue({ userId: TEST_USER_ID });
  // Test implementation
});
```

#### Message Handling Tests
1. Ping/Pong
```typescript
it('should handle ping messages', (done) => {
  const messageHandler = mockWs.on.mock.calls
    .find(call => call[0] === 'message')?.[1];
  messageHandler(Buffer.from(JSON.stringify({ type: 'ping' })));
  expect(mockWs.send).toHaveBeenCalledWith(
    JSON.stringify({ type: 'pong' })
  );
});
```

2. Subscription Management
```typescript
it('should handle subscribe messages', (done) => {
  // Test subscription addition
});

it('should handle unsubscribe messages', (done) => {
  // Test subscription removal
});
```

3. Error Handling
```typescript
it('should handle invalid message format', (done) => {
  // Test invalid JSON handling
});

it('should handle unknown message types', (done) => {
  // Test unknown message type handling
});
```

4. Activity Broadcasting
```typescript
it('should broadcast activities to subscribed clients', (done) => {
  const povId = 'test-pov-123';
  mockWs.subscriptions.add(povId);
  wsServer.clients = new Set([mockWs]);

  broadcastActivity(wsServer, {
    id: 'test-activity',
    type: 'TASK',
    action: 'CREATE',
    povId,
    userId: TEST_USER_ID,
  });

  expect(mockWs.send).toHaveBeenCalledWith(
    JSON.stringify({
      type: 'activity',
      data: expect.any(Object)
    })
  );
});
```

### Test Utilities

#### Setup and Teardown
```typescript
beforeEach((done) => {
  httpServer = new Server();
  wsServer = initializeWebSocketServer(httpServer);
  httpServer.listen(TEST_PORT, done);
});

afterEach((done) => {
  wsServer?.close(() => {
    httpServer.close(done);
  });
});
```

#### Helper Functions
```typescript
function createMockSocket() {
  return {
    write: jest.fn(),
    destroy: jest.fn(),
  };
}

function createMockRequest(token?: string) {
  return {
    url: token ? `/ws/?token=${token}` : '/ws/',
    headers: { host: `localhost:${TEST_PORT}` },
  };
}
```

### Test Coverage
- Connection Handling: 3 tests
- Message Handling: 5 tests
- Activity Broadcasting: 1 test
- Total Coverage: 9 tests

### Testing Best Practices
1. Async Testing
   - Use done callback
   - Handle promises properly
   - Use setImmediate for timing

2. Mock Management
   - Clear mocks between tests
   - Proper type definitions
   - Realistic mock behavior

3. Error Handling
   - Test error cases
   - Verify error messages
   - Check cleanup

4. Test Isolation
   - Independent tests
   - Clean state between tests
   - No shared state

### Future Test Improvements
1. Performance Testing
   - Connection limits
   - Message throughput
   - Memory usage

2. Integration Tests
   - Client-server flow
   - End-to-end scenarios
   - Real network conditions

3. Load Testing
   - Multiple connections
   - High message volume
   - Resource utilization
