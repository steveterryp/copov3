import { NextRequest, NextResponse } from 'next/server';
import { config } from '../../../../lib/config';
import { signAccessToken } from '../../../../lib/jwt';
import { prisma } from '../../../../lib/prisma';
import { verifyRefreshToken } from '../../../../lib/jwt';

export async function POST(req: NextRequest) {
  try {
    console.log('[Refresh] Attempting token refresh');

    // Get refresh token from cookie
    const refreshToken = req.cookies.get(config.cookie.refreshToken)?.value;
    if (!refreshToken) {
      console.log('[Refresh] No refresh token found');
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }

    // Verify refresh token
    console.log('[Refresh] Verifying refresh token');
    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
      console.log('[Refresh] Invalid refresh token');
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Check if refresh token exists in database
    console.log('[Refresh] Checking refresh token in database');
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      console.log('[Refresh] Token not found in database or expired');
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Generate new tokens
    console.log('[Refresh] Generating new tokens');
    const accessToken = await signAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    // Update refresh token expiry
    console.log('[Refresh] Updating refresh token in database');
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        expiresAt: new Date(
          Date.now() +
            parseInt(config.jwt.refreshExpiration) * 24 * 60 * 60 * 1000
        ),
      },
    });

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: 'lax' as const,
      path: '/',
    };

    // Create response with new access token
    const response = NextResponse.json({ success: true });

    // Set cookies using Next.js Response API
    response.cookies.set({
      name: config.cookie.accessToken,
      value: accessToken,
      ...cookieOptions,
      maxAge: config.cookie.maxAge,
    });

    response.cookies.set({
      name: config.cookie.refreshToken,
      value: refreshToken,
      ...cookieOptions,
      maxAge: parseInt(config.jwt.refreshExpiration) * 24 * 60 * 60,
    });

    console.log('[Refresh] Token refresh successful');
    return response;
  } catch (error) {
    console.error('[Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 401 }
    );
  }
}
