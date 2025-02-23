import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface UseWebSocketReturn {
  subscribe: (type: string, handler: MessageHandler) => () => void;
  send: (type: string, data: any) => void;
  connected: boolean;
}

/**
 * Hook for WebSocket connection and message handling
 */
export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());
  const connectedRef = useRef<boolean>(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // Get WebSocket token
        const response = await fetch('/api/auth/ws-token');
        if (!response.ok) {
          throw new Error('Failed to get WebSocket token');
        }
        const { token } = await response.json();

        // Create WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(
          `${protocol}//${window.location.host}/ws?token=${token}`
        );

        ws.onopen = () => {
          console.log('WebSocket connected');
          connectedRef.current = true;
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          connectedRef.current = false;
          // Attempt to reconnect after delay
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            const handlers = handlersRef.current.get(message.type);
            if (handlers) {
              handlers.forEach((handler) => handler(message.data));
            }
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        };

        wsRef.current = ws;

        return () => {
          ws.close();
          wsRef.current = null;
          connectedRef.current = false;
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        // Attempt to reconnect after delay
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();
  }, []);

  // Subscribe to message type
  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);

    return () => {
      const handlers = handlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(type);
        }
      }
    };
  }, []);

  // Send message
  const send = useCallback((type: string, data: any) => {
    if (wsRef.current && connectedRef.current) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  return {
    subscribe,
    send,
    connected: connectedRef.current,
  };
}
