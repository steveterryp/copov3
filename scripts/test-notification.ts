import { PrismaClient } from '@prisma/client';
import { config } from '../lib/config';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get test user
    const user = await prisma.user.findFirst({
      where: {
        email: 'rika@example.com',
      },
    });

    if (!user) {
      console.error('Test user not found. Please create a test user first.');
      process.exit(1);
    }

    // Create test notification
    const notification = await prisma.notification.create({
      data: {
        message: 'This is a test notification to verify the notification system.',
        type: 'info',
        userId: user.id,
        read: false,
      },
    });

    console.log('Test notification created:', notification);
  } catch (error) {
    console.error('Error creating test notification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
