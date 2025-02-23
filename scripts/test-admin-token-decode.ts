#!/usr/bin/env ts-node
import { SignJWT, jwtVerify } from 'jose';
import { createSecretKey } from 'crypto';

async function generateAndVerifyAdminToken(): Promise<void> {
  const secret = createSecretKey(Buffer.from(process.env.JWT_ACCESS_SECRET || 'access-secret'));
  // Generate an admin token with correct credentials
  const token = await new SignJWT({ userId: 'admin', email: 'admin@example.com', role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(secret);
  console.log('Generated Admin Token:', token);
  
  // Verify the token
  try {
    const { payload } = await jwtVerify(token, secret);
    console.log('Admin Token Payload:', payload);
  } catch (error) {
    console.error('Error verifying admin token:', error);
  }
}

generateAndVerifyAdminToken().catch((error) => {
  console.error('Unexpected error:', error);
});