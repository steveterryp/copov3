import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { config } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.userId,
      },
    });

    // Clear cookies
    const cookieStore = cookies();
    cookieStore.delete(config.cookie.accessToken);
    cookieStore.delete(config.cookie.refreshToken);

    return NextResponse.json(
      { message: 'Logged out successfully' },
      {
        status: 200,
        headers: {
          'Set-Cookie': `${config.cookie.accessToken}=; Path=${config.cookie.path}; HttpOnly; Secure=${config.cookie.secure}; SameSite=${config.cookie.sameSite}; Max-Age=0${config.cookie.domain ? `; Domain=${config.cookie.domain}` : ''}, ${config.cookie.refreshToken}=; Path=${config.cookie.path}; HttpOnly; Secure=${config.cookie.secure}; SameSite=${config.cookie.sameSite}; Max-Age=0${config.cookie.domain ? `; Domain=${config.cookie.domain}` : ''}`,
        },
      }
    );
  } catch (error) {
    console.error('[Logout Error]:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
