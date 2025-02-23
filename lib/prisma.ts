import { PrismaClient, Prisma } from '@prisma/client';

// Declare global variable for prisma instance
declare global {
  var prismaClient: PrismaClient | undefined;
}

// Initialize Prisma Client with minimal connection pooling
function createPrismaClient(): PrismaClient {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Add connection pooling parameters if not already present
  try {
    const url = new URL(dbUrl);
    const params = new URLSearchParams(url.search);
    
    // Only set parameters if they don't exist
    if (!params.has('pgbouncer')) params.set('pgbouncer', 'true');
    if (!params.has('pool_timeout')) params.set('pool_timeout', '5');
    if (!params.has('connection_limit')) params.set('connection_limit', '3');
    
    url.search = params.toString();
    dbUrl = url.toString();
  } catch (error) {
    console.error('Invalid DATABASE_URL:', error);
    throw new Error('Invalid DATABASE_URL environment variable');
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'info' },
      { emit: 'stdout', level: 'warn' },
    ] : undefined,
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });
}

// For development, use a global variable to prevent multiple instances during hot reloading
const prisma = global.prismaClient || createPrismaClient();

if (process.env.NODE_ENV === 'development') {
  global.prismaClient = prisma;
}

// Cleanup and error handling
const cleanup = async () => {
  try {
    console.log('[Prisma] Cleaning up database connections...');
    await prisma.$disconnect();
  } catch (error) {
    console.error('[Prisma] Error during cleanup:', error);
    process.exit(1);
  }
};


/**
 * Verifies the database connection and connection pooling
 * @returns {Promise<boolean>} True if connection succeeds, false otherwise
 */
async function checkDatabaseConnection(): Promise<boolean> {
  try {
    console.log('[Prisma] Checking database connection...');
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('[Prisma] Database connection successful');
    return true;
  } catch (error) {
    console.error('[Prisma] Database connection failed:', error);
    return false;
  }
}

// Initialize connection
prisma.$connect().catch((e: Error) => {
  console.error('[Prisma] Failed to connect:', e);
  process.exit(1);
});

export { prisma, PrismaClient, checkDatabaseConnection };
