#!/usr/bin/env ts-node

import { SignJWT } from 'jose';
import { createSecretKey } from 'crypto';
import fetch from 'node-fetch';

async function generateTestToken(): Promise<string> {
  const secret = createSecretKey(Buffer.from(process.env.JWT_ACCESS_SECRET || 'access-secret'));
  const token = await new SignJWT({ userId: 'test-user', email: 'test@example.com', role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(secret);
  return token;
}

async function testAuth(): Promise<void> {
  const token = await generateTestToken();
  console.log('Generated Token:', token);
  const response = await fetch('http://localhost:3000/api/auth/me', {
    method: 'GET',
    headers: {
      'Cookie': `token=${token}`
    }
  });
  console.log('Status:', response.status);
  const body = await response.text();
  console.log('Response Body:', body);
}

testAuth().catch((error) => {
  console.error('Error in testAuth:', error);
});