const { PrismaClient } = require('@prisma/client');
const { UserRole, UserStatus } = require('../lib/types/auth');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('rikrik123', 10);

    const user = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: hashedPassword,
        role: UserRole.ADMIN,
        name: 'Admin User',
        status: UserStatus.ACTIVE,
      },
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        name: 'Admin User',
        status: UserStatus.ACTIVE,
      },
    });

    console.log('Admin user created:', user);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
