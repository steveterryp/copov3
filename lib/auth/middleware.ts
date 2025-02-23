import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { config } from '@/lib/config';
import { UserRole } from '../types/auth';

export async function authMiddleware(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log("[authMiddleware] Starting authentication check:", {
      requestId,
      url: req.url,
      method: req.method,
      pathname: req.nextUrl.pathname,
      headers: Object.fromEntries(req.headers.entries()),
      cookies: Object.fromEntries(req.cookies.getAll().map(c => [c.name, c.value])),
      timestamp: new Date().toISOString()
    });

    // Check for token in cookies or Authorization header
    const cookieToken = req.cookies.get(config.cookie.accessToken)?.value;
    const headerToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    const token = headerToken || cookieToken;

    console.log("[authMiddleware] Token check:", {
      requestId,
      hasCookieToken: !!cookieToken,
      cookieTokenLength: cookieToken?.length,
      hasHeaderToken: !!headerToken,
      headerTokenLength: headerToken?.length,
      finalToken: !!token,
      finalTokenLength: token?.length,
      cookieNames: req.cookies.getAll().map(c => c.name),
      timestamp: new Date().toISOString()
    });

    if (!token) {
      console.log("[authMiddleware] Access token missing, checking refresh token", {
        requestId,
        timestamp: new Date().toISOString()
      });
      
      const refreshToken = req.cookies.get(config.cookie.refreshToken)?.value;
      if (!refreshToken) {
        console.log("[authMiddleware] No refresh token found", {
          requestId,
          timestamp: new Date().toISOString()
        });
        throw new Error('No tokens found');
      }

      console.log("[authMiddleware] Found refresh token, attempting refresh", {
        requestId,
        refreshTokenLength: refreshToken.length,
        timestamp: new Date().toISOString()
      });

      // Try to refresh the token
      const response = await fetch(`${req.nextUrl.origin}/api/auth/refresh`, {
        method: 'POST',
        headers: new Headers({
          Cookie: `${config.cookie.refreshToken}=${refreshToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        console.error("[authMiddleware] Token refresh failed", {
          requestId,
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        });
        throw new Error('Token refresh failed');
      }

      console.log("[authMiddleware] Token refresh successful", {
        requestId,
        timestamp: new Date().toISOString()
      });

      // Get the new access token from response cookies
      const cookies = response.headers.get('set-cookie');
      if (!cookies) {
        throw new Error('No cookies in refresh response');
      }

      // Return response with new cookies
      const redirectResponse = NextResponse.redirect(req.url);
      redirectResponse.headers.set('Set-Cookie', cookies);
      return redirectResponse;
    }

    // Verify access token
    console.log("[authMiddleware] Starting token verification", {
      requestId,
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });
    let decoded;
    try {
      const verifiedToken = await jwtVerify(
        token,
        new TextEncoder().encode(config.jwt.accessSecret)
      );
      decoded = verifiedToken.payload;
      console.log("[authMiddleware] Token verification successful", {
        requestId,
        payload: decoded,
        userId: (decoded as any).userId,
        role: (decoded as any).role,
        exp: (decoded as any).exp,
        iat: (decoded as any).iat,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[authMiddleware] Token verification failed", {
        requestId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      });
      // Try to refresh the token
      const refreshToken = req.cookies.get(config.cookie.refreshToken)?.value;
      if (refreshToken) {
        console.log("[authMiddleware] Found refresh token, attempting refresh");
        const response = await fetch(`${req.nextUrl.origin}/api/auth/refresh`, {
          method: 'POST',
          headers: new Headers({
            Cookie: `${config.cookie.refreshToken}=${refreshToken}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }),
          credentials: 'include',
        });

        if (response.ok) {
          const cookies = response.headers.get('set-cookie');
          if (cookies) {
            const redirectResponse = NextResponse.redirect(req.url);
            redirectResponse.headers.set('Set-Cookie', cookies);
            return redirectResponse;
          }
        }
      }
      throw new Error('Invalid token');
    }

    if (!decoded) {
      throw new Error('Invalid token');
    }

    // Add user info to request headers
    const requestHeaders = new Headers(req.headers);
    const userId = (decoded as any).userId;
    const role = (decoded as any).role;
    requestHeaders.set("x-user-id", userId);
    requestHeaders.set("x-user-role", role);

    // Create response with cloned request
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Set cookies in response
    response.cookies.set(config.cookie.accessToken, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    console.log("[authMiddleware] Authentication successful", {
      requestId,
      userId,
      role,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });

    return response;
  } catch (error: any) {
    console.error("[authMiddleware] Authentication failed", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });
    // Clear tokens and redirect to login
    const response = NextResponse.redirect(new URL('/login', req.nextUrl.origin));
    response.cookies.delete(config.cookie.accessToken);
    response.cookies.delete(config.cookie.refreshToken);
    return response;
  }
}
