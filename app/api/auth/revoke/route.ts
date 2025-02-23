import { NextRequest, NextResponse } from 'next/server';
import auth from '@/lib/auth';
import { ApiResponseWithCookies } from '@/lib/types/auth';
import { createExpiredTokenCookies, formatCookieHeader } from '@/lib/cookies';
import { prisma } from '@/lib/prisma';

/**
 * Revoke refresh token
 */
export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return Response.json(
        {
          error: {
            message: 'Refresh token not found',
            code: 'REFRESH_TOKEN_NOT_FOUND',
          },
        },
        { status: 401 }
      );
    }

    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: {
        token: refreshToken,
      },
    });

    // Create expired token cookies
    const expiredTokenCookies = createExpiredTokenCookies();

    const response = NextResponse.json({
      success: true,
    });

    // Set cookie headers
    expiredTokenCookies.forEach(cookie => {
      response.cookies.set(cookie);
    });

    return response;
  } catch (error) {
    console.error('[Revoke Error]:', error);
    return Response.json(
      {
        error: {
          message: 'Failed to revoke token',
          code: 'REVOKE_TOKEN_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
