import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { cookies } from 'next/headers'; // Import cookies

export async function GET(req: NextRequest) {
  try {
    console.log('[Auth Me] Access token cookie:', cookies().get('accessToken')?.value); // Log access token cookie
    console.log('[Auth Me] Getting user data');
    const user = await getAuthUser(req);

    if (!user) {
      console.log('[Auth Me] No user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Auth Me] User found:', user);
    // Return in the expected format with data wrapper and accessToken
    const token = cookies().get('token')?.value;
    return NextResponse.json({
      data: {
        user,
        accessToken: token
      }
    });
  } catch (error) {
    console.error('[Auth Me] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
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
