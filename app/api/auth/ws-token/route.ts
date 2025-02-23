import { NextRequest } from 'next/server';
import auth from '@/lib/auth';
import { UserRole } from '@/lib/types/auth';
import { config } from '@/lib/config';

/**
 * Generate WebSocket token
 */
export async function POST(req: NextRequest) {
  try {
    // Get access token from authorization header
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return Response.json(
        {
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await auth.tokens.verifyAccessToken(token);
    if (!decoded) {
      return Response.json(
        {
          error: {
            message: 'Invalid token',
            code: 'INVALID_TOKEN',
          },
        },
        { status: 401 }
      );
    }

    // Generate WebSocket token
    const wsToken = await auth.tokens.generateTokens({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    return Response.json({
      data: {
        token: wsToken.accessToken,
      },
    });
  } catch (error) {
    console.error('[WebSocket Token Error]:', error);
    return Response.json(
      {
        error: {
          message: 'Failed to generate WebSocket token',
          code: 'WS_TOKEN_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
