import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { prisma, checkDatabaseConnection } from './prisma';
import { config } from './config';
import bcrypt from 'bcryptjs';

export class DatabaseInitializer {
  private static instance: DatabaseInitializer;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseInitializer {
    if (!DatabaseInitializer.instance) {
      DatabaseInitializer.instance = new DatabaseInitializer();
    }
    return DatabaseInitializer.instance;
  }

  /**
   * Initialize the database connection and perform necessary setup
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Database already initialized');
      return;
    }

    const startTime = Date.now();
    logger.info('Initializing database connection');

    try {
      // Check database connection
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }

      // Perform any necessary migrations or setup
      await this.setupDatabase();

      const duration = Date.now() - startTime;
      logger.info('Database initialization completed', {
        duration: `${duration}ms`,
      });

      this.isInitialized = true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Database initialization failed', {
        duration: `${duration}ms`,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });

      throw error;
    }
  }

  /**
   * Perform database setup and migrations
   */
  private async setupDatabase(): Promise<void> {
    try {
      // Add any additional setup steps here
      await this.createInitialData();
      await this.validateDatabaseSchema();
    } catch (error) {
      logger.error('Database setup failed', {
        error: error instanceof Error ? error : new Error('Unknown error')
      });
      throw error;
    }
  }

  /**
   * Create initial data if needed
   */
  private async createInitialData(): Promise<void> {
    try {
      // Check if we need to create initial admin user
      const adminExists = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (!adminExists && config.env.isDevelopment) {
        logger.info('Creating initial admin user');
        
        const hashedPassword = await bcrypt.hash('change_this_password', config.security.saltRounds);
        
        await prisma.user.create({
          data: {
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'ADMIN',
            password: hashedPassword,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to create initial data', {
        error: error instanceof Error ? error : new Error('Unknown error')
      });
      throw error;
    }
  }

  /**
   * Validate database schema
   */
  private async validateDatabaseSchema(): Promise<void> {
    try {
      // Add any schema validation logic here
      // For example, checking required tables exist
      const tables = [
        'User',
        'RefreshToken',
        'PoV',
        'Task',
        'Phase',
      ];

      for (const table of tables) {
        try {
          await prisma.$queryRaw`SELECT 1 FROM "${table}" LIMIT 1`;
        } catch (error) {
          logger.error(`Table "${table}" not found or inaccessible`, {
            error: error instanceof Error ? error : new Error('Unknown error')
          });
          throw error;
        }
      }
    } catch (error) {
      logger.error('Schema validation failed', {
        error: error instanceof Error ? error : new Error('Unknown error')
      });
      throw error;
    }
  }

  /**
   * Cleanup database connections
   */
  public async cleanup(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await prisma.$disconnect();
      this.isInitialized = false;
      logger.info('Database connections cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup database connections', {
        error: error instanceof Error ? error : new Error('Unknown error')
      });
      throw error;
    }
  }
}

// Export singleton instance
export const dbInit = DatabaseInitializer.getInstance();
