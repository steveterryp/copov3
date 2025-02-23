import type { Server as HttpServer } from 'http';
import type { WebSocket as WS } from 'ws';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface WebSocketClient extends WS {
  userId?: string;
  subscriptions?: Set<string>;
}

export function initializeWebSocketServer(server: HttpServer) {
  const wsServer = new WebSocketServer({ noServer: true });

  // Handle upgrade requests
  server.on('upgrade', async (request: any, socket: any, head: any) => {
    // Only handle WebSocket paths
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
      // Verify token using the same secret as the API
      const payload = jwt.verify(token, config.jwt.accessSecret as jwt.Secret);
      if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Complete WebSocket handshake
      wsServer.handleUpgrade(request, socket, head, (ws: WebSocketClient) => {
        ws.userId = payload.userId as string;
        ws.subscriptions = new Set();

        // Set up message handling
        ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
              case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;

              case 'subscribe':
                if (message.povId && ws.subscriptions) {
                  ws.subscriptions.add(message.povId);
                  ws.send(JSON.stringify({ 
                    type: 'subscribed', 
                    povId: message.povId 
                  }));
                }
                break;

              case 'unsubscribe':
                if (message.povId && ws.subscriptions) {
                  ws.subscriptions.delete(message.povId);
                  ws.send(JSON.stringify({ 
                    type: 'unsubscribed', 
                    povId: message.povId 
                  }));
                }
                break;

              default:
                ws.send(JSON.stringify({ 
                  type: 'error', 
                  message: 'Unknown message type' 
                }));
            }
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

// Helper function to broadcast activity to relevant clients
export function broadcastActivity(wsServer: WebSocketServer, activity: any) {
  wsServer.clients.forEach((client: WebSocketClient) => {
    // Only send to clients subscribed to this PoV
    if (
      client.readyState === WebSocket.OPEN &&
      client.subscriptions?.has(activity.povId)
    ) {
      client.send(JSON.stringify({
        type: 'activity',
        data: activity
      }));
    }
  });
}
