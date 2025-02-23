import type { IncomingMessage, ServerResponse } from 'http';
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeWebSocketServer } = require('./lib/websocket/activityServer');

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
  }
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Initialize WebSocket server
  const wsServer = initializeWebSocketServer(server);
  console.log('WebSocket server initialized');

  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.NODE_ENV
      }`
    );
    console.log('> WebSocket server ready');
  });

  // Handle server shutdown
  const cleanup = () => {
    console.log('Shutting down server...');
    wsServer.close(() => {
      console.log('WebSocket server closed');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
});
