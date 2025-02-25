import { NextRequest } from 'next/server';
import { verifyAccessToken } from '../jwt';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    console.log('[Auth] Getting cookies');
    // Get token from cookies or Authorization header
    const cookieToken = req.cookies.get(config.cookie.accessToken)?.value;
    const headerToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    const token = headerToken || cookieToken;

    console.log('[Auth] Token check:', {
      hasCookieToken: !!cookieToken,
      hasHeaderToken: !!headerToken,
      finalToken: !!token
    });

    if (!token) {
      console.log('[Auth] No token found in cookies or headers');
      return null;
    }

    console.log('[Auth] Verifying token');
    const decoded = await verifyAccessToken(token);
    console.log('[Auth] Token verification result:', !!decoded);

    if (!decoded) {
      console.log('[Auth] Token verification failed');
      return null;
    }

    const user = {
      userId: decoded.userId || decoded.sub, // Support both formats
      email: decoded.email,
      role: decoded.role
    };
    console.log('[Auth] User authenticated:', user);
    return user;
  } catch (error) {
    console.error('[Auth] Error:', error);
    return null;
  }
}

// For server components (not API routes)
export async function getAuthUserFromServer(): Promise<AuthUser | null> {
  try {
    console.log('[Auth] Getting cookies from server');
    const cookieStore = cookies();
    const token = cookieStore.get(config.cookie.accessToken)?.value;
    console.log('[Auth] Token found:', !!token);

    if (!token) {
      console.log('[Auth] No token found in cookies');
      return null;
    }

    console.log('[Auth] Verifying token');
    const decoded = await verifyAccessToken(token);
    console.log('[Auth] Token verification result:', !!decoded);

    if (!decoded) {
      console.log('[Auth] Token verification failed');
      return null;
    }

    const user = {
      userId: decoded.userId || decoded.sub, // Support both formats
      email: decoded.email,
      role: decoded.role
    };
    console.log('[Auth] User authenticated:', user);
    return user;
  } catch (error) {
    console.error('[Auth] Error:', error);
    return null;
  }
}
