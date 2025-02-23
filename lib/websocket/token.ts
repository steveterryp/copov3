import jwt from 'jsonwebtoken';
import { UserRole } from '@/lib/types/auth';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

const WS_AUTH_SECRET = process.env.WS_AUTH_SECRET || 'your-websocket-secret';

/**
 * Generate WebSocket token
 */
export async function generateWsToken(payload: TokenPayload): Promise<string> {
  return jwt.sign(payload, WS_AUTH_SECRET, {
    expiresIn: '1h',
  });
}

/**
 * Verify WebSocket token
 */
export async function verifyWsToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, WS_AUTH_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('WebSocket token expired');
    }
    throw new Error('Invalid WebSocket token');
  }
}

/**
 * Extract WebSocket token from query string
 */
export function extractWsToken(url: string): string {
  const token = new URL(url).searchParams.get('token');
  if (!token) {
    throw new Error('No WebSocket token provided');
  }
  return token;
}
