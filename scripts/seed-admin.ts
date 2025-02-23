#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123'; // In production, ensure this is securely hashed
  const adminRole = 'ADMIN';

  // Use the email as the unique identifier for the user
  const existingAdmin = await prisma.user.findUnique({
    where: { id: adminEmail }
  });

  if (existingAdmin) {
    console.log('Admin user already exists:', existingAdmin);
  } else {
    const admin = await prisma.user.create({
      data: {
        id: adminEmail,
        email: adminEmail,
        name: 'Admin User',
        role: adminRole,
        password: adminPassword
      }
    });
    console.log('Admin user seeded:', admin);
  }
}

seedAdmin()
  .catch((error) => {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
