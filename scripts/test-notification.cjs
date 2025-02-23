const { PrismaClient } = require('@prisma/client');
const { NotificationType } = require('../lib/types/notification');

const validTypes = ['info', 'success', 'warning', 'error'];

const prisma = new PrismaClient();

async function sendNotification(email, message, type = NotificationType.INFO) {
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid notification type: ${type}. Must be one of: ${validTypes.join(', ')}`);
  }
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error(`User not found with email: ${email}`);
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        message,
        type,
        read: false
      }
    });

    console.log('\nSending notification:');
    console.log('To:', email);
    console.log('Message:', message);
    console.log('Type:', type);
    console.log('\n✅ Notification created:', notification);
  } catch (error) {
    console.error('\n❌ Failed to create notification:', error);
    throw error;
  }
}

async function main() {
  const email = process.argv[2];
  const message = process.argv[3];
  const type = process.argv[4] || 'info';

  if (!email || !message) {
    console.error('\nUsage: node test-notification.cjs <email> <message> [type]');
    console.error('Valid types:', validTypes.join(', '));
    process.exit(1);
  }

  try {
    await sendNotification(email, message, type);
  } catch (error) {
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
