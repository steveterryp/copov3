import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '@/lib/config';

const resetSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(config.auth.passwordMinLength, `Password must be at least ${config.auth.passwordMinLength} characters`)
    .max(config.auth.passwordMaxLength, `Password must be at most ${config.auth.passwordMaxLength} characters`)
    .regex(
      config.auth.passwordPattern,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetSchema.parse(body);

    // Hash the provided token to compare with stored hash
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching reset token that hasn't expired
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, config.security.saltRounds);

    // Update user's password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
    });

    // Log the password reset activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        type: 'AUTH',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ 
      message: 'Password has been reset successfully' 
    });
  } catch (error) {
    console.error('[POST /api/auth/password-reset/reset]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid password format',
          details: error.errors.map(err => err.message)
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
