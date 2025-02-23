import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { config } from '@/lib/config';
import { signAccessToken, signRefreshToken } from '@/lib/auth/token-manager';
import { UserRole } from '@/lib/types/auth';

export async function POST(request: Request) {
  try {
    // Log request details
    console.log('[Login] Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Parse request body
    let body;
    try {
      const text = await request.text();
      console.log('[Login] Raw request body:', text);
      body = JSON.parse(text);
    } catch (e) {
      console.error('[Login] JSON parse error:', e);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      console.log('[Login] Missing credentials:', { email: !!email, password: !!password });
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      console.log('[Login] Invalid credential types:', { 
        emailType: typeof email, 
        passwordType: typeof password 
      });
      return NextResponse.json(
        { error: 'Invalid credential format' },
        { status: 400 }
      );
    }

    console.log('[Login] Attempt for:', email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user) {
      console.log('[Login] User not found:', email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (!user.isVerified) {
      console.log('[Login] Email not verified:', email);
      return NextResponse.json(
        { error: 'Please verify your email before logging in' },
        { status: 401 }
      );
    }

    if (!user.password) {
      console.log('[Login] User has no password:', email);
      return NextResponse.json(
        { error: 'Invalid account setup' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('[Login] Invalid password for:', email);
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    console.log('[Login] Successful for:', email);

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    };
    console.log('[Login] Token payload:', tokenPayload);

    const accessToken = await signAccessToken(tokenPayload);
    console.log('[Login] Access token generated');
    
    const refreshToken = await signRefreshToken(tokenPayload);
    console.log('[Login] Refresh token generated');

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(
          Date.now() +
            parseInt(config.jwt.refreshExpiration) * 24 * 60 * 60 * 1000
        ),
      },
    });

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set cookies on response
    console.log('[Login Route] Setting access token cookie:', config.cookie.accessToken);
    response.cookies.set(config.cookie.accessToken, accessToken, {     
      httpOnly: true,
      secure: false, // Set to false for localhost
      sameSite: 'lax',
      path: '/',
      maxAge: parseInt(config.jwt.accessExpiration) * 60 * 1000, // Convert minutes to milliseconds
    });
    console.log('[Login Route] Access token cookie set');

    console.log('[Login Route] Setting refresh token cookie:', config.cookie.refreshToken);
    response.cookies.set(config.cookie.refreshToken, refreshToken, {   
      httpOnly: true,
      secure: false, // Set to false for localhost
      sameSite: 'lax',
      path: '/',
      maxAge: parseInt(config.jwt.refreshExpiration) * 24 * 60 * 60 * 1000, // Convert days to milliseconds
    });
    console.log('[Login Route] Refresh token cookie set');


    return response;
  } catch (error) {
    console.error('[Login] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
