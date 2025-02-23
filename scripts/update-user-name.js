import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateUser() {
  try {
    const user = await prisma.user.update({
      where: { email: 'rika@example.com' },
      data: { name: 'Rika Terry' }
    });
    console.log('Updated user:', user);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

updateUser();
