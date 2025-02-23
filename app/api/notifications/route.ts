import { NextRequest } from 'next/server';
import { getNotificationsHandler } from '@/lib/notifications/handlers/get';

export async function GET(req: NextRequest) {
  try {
    console.log('[Notifications API] Getting notifications');
    console.log('[Notifications API] Request cookies:', req.cookies);
    console.log('[Notifications API] Request headers:', Object.fromEntries(req.headers.entries()));
    return await getNotificationsHandler(req);
  } catch (error) {
    console.error('[Notifications API] Error:', error);
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
