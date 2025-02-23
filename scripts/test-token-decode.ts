#!/usr/bin/env ts-node
import { SignJWT, jwtVerify } from 'jose';
import { createSecretKey } from 'crypto';

async function generateAndVerifyToken() {
  const secretString = process.env.JWT_ACCESS_SECRET || 'access-secret';
  const secret = createSecretKey(Buffer.from(secretString));
  
  // Generate a test token with dummy user payload
  const token = await new SignJWT({ userId: 'test-user', email: 'test@example.com', role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(secret);
  console.log('Generated Token:', token);
  
  // Verify the generated token
  try {
    const { payload } = await jwtVerify(token, secret);
    console.log('Verified Token Payload:', payload);
  } catch (error) {
    console.error('Error verifying token:', error);
  }
}

generateAndVerifyToken().catch((error) => {
  console.error('Unexpected error:', error);
});