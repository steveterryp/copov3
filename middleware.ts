import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authMiddleware } from './lib/auth/middleware';
import { requestThrottleMiddleware } from './middleware/request-throttle';

export async function middleware(request: NextRequest) {
  // Apply request throttling first
  const throttleResponse = await requestThrottleMiddleware(request);
  if (throttleResponse.status === 429) {
    return throttleResponse;
  }

  try {
    console.log('[middleware] Processing request:', request.nextUrl.pathname);
    console.log('[middleware] Request cookies:', request.cookies);
    console.log('[middleware] Request headers:', Object.fromEntries(request.headers.entries()));

    // Protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/pov') ||
        request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/test-auth')) {
      console.log('[middleware] Protected route detected');
      return await authMiddleware(request);
    }

    // API routes that need auth
    if (request.nextUrl.pathname.startsWith('/api/') &&
        !request.nextUrl.pathname.startsWith('/api/auth/') &&
        !request.nextUrl.pathname.startsWith('/api/public/')) {
      console.log('[middleware] Protected API route detected');
      const response = await authMiddleware(request);
      
      // If auth successful, add CORS headers to the response
      if (response.status === 200) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
        return response;
      }
      return response;
    }

    // Public routes
    console.log('[middleware] Public route detected');
    return NextResponse.next();
  } catch (error) {
    console.error('[middleware] Error:', error);
    // For API routes, return 401 instead of redirecting
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // For page routes, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configure middleware matching
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
