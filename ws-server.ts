import type { Server } from 'http';
import * as dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeWebSocketServer } from './lib/websocket/activityServer';

dotenv.config();

declare namespace NodeJS {
  interface ProcessEnv {
    WS_PORT?: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
  }
}

const server: Server = createServer();
const wsServer = initializeWebSocketServer(server);

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);

server.listen(WS_PORT, () => {
  console.log(`> WebSocket server listening on port ${WS_PORT}`);
});
