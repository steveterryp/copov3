const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { email: 'rika@example.com' }
        ]
      },
      select: {
        email: true,
        role: true,
        isVerified: true,
        password: true
      }
    });

    console.log('User Details:');
    users.forEach(user => {
      console.log('\nEmail:', user.email);
      console.log('Role:', user.role);
      console.log('Verified:', user.isVerified);
      console.log('Has Password:', !!user.password);
    });
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
