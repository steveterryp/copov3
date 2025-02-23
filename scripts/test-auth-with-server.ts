#!/usr/bin/env ts-node

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { SignJWT } from 'jose';
import { createSecretKey } from 'crypto';
import { config } from '../lib/config';
import { prisma } from '../lib/prisma';

async function generateTestToken(): Promise<string> {
  const secret = createSecretKey(Buffer.from(process.env.JWT_ACCESS_SECRET || 'access-secret'));
  const token = await new SignJWT({ 
    sub: 'cm787j6lj0001cjd6286yd2tw', // Use actual admin user ID
    email: 'admin@example.com', 
    role: 'ADMIN' // Use correct role case
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(secret);
  return token;
}

function startDevServer(): Promise<{ process: any; ready: Promise<void> }> {
  return new Promise((resolve, reject) => {
    console.log("Starting development server...");
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, FORCE_COLOR: 'true' }
    });

    let serverReady = false;

    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log('Server stdout:', output);
      if (!serverReady && (output.includes('✓ Ready') || output.includes('Ready'))) {
        serverReady = true;
        resolve({ process: serverProcess, ready: Promise.resolve() });
      }
    });

    serverProcess.on('error', (err) => {
      console.error("Error starting server:", err);
      reject(err);
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!serverReady) {
        reject(new Error("Server did not start in 60 seconds"));
        serverProcess.kill();
      }
    }, 60000);
  });
}

async function testAuth(): Promise<void> {
  const serverInfo = await startDevServer();
  // Wait a bit to ensure the server is fully ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  const token = await generateTestToken();
  console.log("Generated Token:", token);
  try {
    // Check if database is accessible
    console.log('Checking database connection...');
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection failed:', error);
      console.log('\nPlease ensure:');
      console.log('- PostgreSQL is running');
      console.log('- DATABASE_URL is correctly configured in .env');
      console.log('- Database exists and is accessible');
      return;
    }

    // Test authentication
    console.log('\nTesting authentication...');
    const response = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        'Cookie': `${config.cookie.accessToken}=${token}`
      }
    });
    const status = response.status;
    console.log('Response Status:', status);
    const body = await response.text();
    
    if (status === 200) {
      console.log('Response Body:', body);
    } else if (status === 401) {
      console.log('Response Body:', body);
      console.log('\nAuthentication failed. This could be due to:');
      console.log('1. Invalid token');
      console.log('2. User not found in database');
      console.log('3. Token-user mismatch');
      console.log('\nPlease ensure:');
      console.log('- Database is properly seeded');
      console.log('- Token contains correct user ID');
      console.log('- User exists in database');
    } else {
      console.log('Unexpected response status:', status, body);
    }
  } catch (error) {
    console.error('Error during authentication test:', error);
    throw error;
  }
  serverInfo.process.kill();
}

testAuth().catch(err => console.error("Test Auth Error:", err));
