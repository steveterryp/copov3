import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { status: 'error', message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Try to count users as a simple query test
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        userCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
