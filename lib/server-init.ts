import type { Server as HttpServer } from 'http';
import { initializeWebSocketServer } from './websocket/activityServer';

export function initializeServer(server: HttpServer) {
  // Initialize WebSocket server
  initializeWebSocketServer(server);

  // Log server initialization
  console.log('WebSocket server initialized');

  // Handle server shutdown
  const cleanup = () => {
    console.log('Shutting down server...');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
