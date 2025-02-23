const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    const hashedPassword = await bcrypt.hash('rikrik123', 10);

    const user = await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: {
        password: hashedPassword,
      },
    });

    console.log('Admin password updated:', user);
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();
