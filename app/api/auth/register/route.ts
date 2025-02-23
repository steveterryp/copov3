import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { config } from '../../../../lib/config';
import { isValidEmail } from '../../../../lib/utils';
import { generateVerificationEmail, sendEmail } from '../../../../lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { 
          validationErrors: {
            ...((!email) && { email: ['Email is required'] }),
            ...((!name) && { name: ['Name is required'] })
          }
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { 
          validationErrors: {
            email: ['Invalid email format']
          }
        },
        { status: 400 }
      );
    }


    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        isVerified: true,
      },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      } else {
        // If user exists but not verified, delete the old record
        await prisma.user.delete({
          where: { id: existingUser.id },
        });
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + config.auth.verificationTokenExpiry * 60 * 1000);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        verificationToken,
        isVerified: false,
        verifiedAt: null,
        // Set a temporary password that can't be used to login
        // This will be updated when the user sets their password after verification
        password: crypto.randomBytes(32).toString('hex'),
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Send verification email
    const { html, text } = generateVerificationEmail(verificationToken, user.name);
    await sendEmail({
      to: user.email,
      subject: 'Verify your email address',
      html,
      text,
    });

    return NextResponse.json({ 
      message: 'Verification email sent',
      email: user.email 
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
