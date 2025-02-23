import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for request counts
// In production, you'd want to use Redis or similar
const requestCounts = new Map<string, { count: number; timestamp: number }>();

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now - value.timestamp > 60000) { // 1 minute
      requestCounts.delete(key);
    }
  }
}, 60000);

export function requestThrottleMiddleware(req: NextRequest) {
  const key = `${req.ip}-${req.nextUrl.pathname}`;
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '1000', 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10);

  // Get current request count
  const current = requestCounts.get(key) || { count: 0, timestamp: now };

  // Reset count if window has passed
  if (now - current.timestamp > windowMs) {
    current.count = 0;
    current.timestamp = now;
  }

  // Increment count
  current.count++;
  requestCounts.set(key, current);

  // Check if over limit
  if (current.count > maxRequests) {
    console.warn(`[Request Throttle] Too many requests from ${req.ip} to ${req.nextUrl.pathname}`);
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: Math.ceil((current.timestamp + windowMs - now) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((current.timestamp + windowMs - now) / 1000).toString()
        }
      }
    );
  }

  // Add rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', (maxRequests - current.count).toString());
  response.headers.set('X-RateLimit-Reset', (current.timestamp + windowMs).toString());

  return response;
}
