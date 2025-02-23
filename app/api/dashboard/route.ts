import { NextRequest, NextResponse } from 'next/server';
import { handleGetDashboard } from '@/lib/dashboard/handlers/get';
import { authMiddleware } from '@/lib/auth/middleware'; // Import authMiddleware from correct path

export async function GET(req: NextRequest) {
  console.log('[Dashboard API] Received request:', {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    cookies: req.cookies.getAll(),
    timestamp: new Date().toISOString()
  });

  try {
    const response = await handleGetDashboard(req);
    console.log('[Dashboard API] Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    });
    return response;
  } catch (error) {
    console.error('[Dashboard API] Error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Add OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}
