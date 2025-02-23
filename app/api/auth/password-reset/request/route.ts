import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { config } from '@/lib/config';
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json({ 
        message: 'If an account exists with this email, a password reset link will be sent.' 
      });
    }

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const resetTokenExpiry = new Date(
      Date.now() + config.auth.passwordResetTokenExpiry * 60 * 1000
    );

    // Save reset token hash and expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    try {
      const { html, text } = generatePasswordResetEmail(resetToken, user.name);
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password',
        html,
        text,
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't expose email sending errors to the client
    }

    return NextResponse.json({ 
      message: 'If an account exists with this email, a password reset link will be sent.' 
    });
  } catch (error) {
    console.error('[POST /api/auth/password-reset/request]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
