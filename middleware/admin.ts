import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { config } from '@/lib/config';
import { UserRole } from '@/lib/types/auth';

export async function adminMiddleware(request: NextRequest) {
  try {
    const token = request.cookies.get(config.cookie.accessToken)?.value;
    console.log("[adminMiddleware] Token from cookies:", token);
    if (!token) {
      throw new Error('No token found');
    }

    const verifiedToken = await jwtVerify(
      token,
      new TextEncoder().encode(config.jwt.accessSecret)
    );
    const decoded = verifiedToken.payload;
    console.log("[adminMiddleware] Decoded token:", decoded);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    // Check if user has admin role
    let role: string = "";
    if (typeof decoded === "object" && decoded !== null && "role" in decoded) {
      role = (decoded as any).role;
    }
    if (!role || (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN)) {
      console.error("[adminMiddleware] Access denied: User is not an admin");
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Clone the request with modified headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-role", role);
    requestHeaders.set("accessToken", token);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Also set headers on response for client-side access
    response.headers.set("x-user-role", role);
    response.headers.set("accessToken", token);
    return response;
  } catch (error) {
    console.error("[adminMiddleware] Error verifying token:", error);
    // Clear invalid token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(config.cookie.accessToken);
    return response;
  }
}
