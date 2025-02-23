import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { config } from '@/lib/config';

export interface AuthResult {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function verifyAuth(req: NextRequest): Promise<AuthResult | null> {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get(config.cookie.accessToken)?.value;
    console.log('[verifyAuth] Token:', token);
    
    if (!token) {
      console.log('[verifyAuth] No token found');
      return null;
    }

    // Verify JWT
    const payload = await verifyAccessToken(token);
    console.log('[verifyAuth] Token payload:', payload);
    
    if (!payload || !payload.sub) {
      console.log('[verifyAuth] Invalid payload:', payload);
      return null;
    }

    // Get user from database
    console.log('[verifyAuth] Looking up user:', payload.sub);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      console.log('[verifyAuth] User not found');
      return null;
    }

    console.log('[verifyAuth] User found:', user);
    return user;
  } catch (error) {
    console.error('[Auth Verification Error]:', error);
    return null;
  }
}
