const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

// Password requirements from config
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;
const passwordRequirements = [
  'At least one uppercase letter',
  'At least one lowercase letter',
  'At least one number',
  'At least one special character (@$!%*?&)',
  'Between 6 and 100 characters'
];
const saltRounds = 10;

const prisma = new PrismaClient();

async function createTestUser(email, name, role, password) {
  try {
    // Validate password against requirements
    if (!password.match(passwordPattern)) {
      throw new Error(`Password must meet requirements: ${passwordRequirements.join(', ')}`);
    }

    const hashedPassword = await hash(password, saltRounds);
    const user = await prisma.user.upsert({
      where: { email: email },
      update: {
        password: hashedPassword,
        role: role,
        name: name,
        isVerified: true
      },
      create: {
        email: email,
        name: name,
        password: hashedPassword,
        role: role,
        isVerified: true
      }
    });
    console.log(`Test ${role} user created/updated: ${user.email}`);
  } catch (error) {
    console.error(`Error creating test ${role} user:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await createTestUser('admin@example.com', 'Admin User', 'ADMIN', 'Admin123@');
  await createTestUser('rika@example.com', 'Rika Terry', 'USER', 'Rika123@');
  await createTestUser('chris@example.com', 'Chris User', 'USER', 'Chris123@');
}

main();
