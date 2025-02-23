import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  database: {
    connected: boolean;
  };
}

interface LogMetadata {
  timestamp: string;
  level: string;
  message: string;
}

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

export async function GET(request: NextRequest) {
  const healthStatus: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    database: {
      connected: await checkDatabaseConnection(),
    },
  };

  return new NextResponse(JSON.stringify(healthStatus), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
