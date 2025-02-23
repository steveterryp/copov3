const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating dummy data...');

  // Clean existing data
  await prisma.task.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.pOV.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users...');

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const rikaUser = await prisma.user.create({
    data: {
      email: 'rika@example.com',
      name: 'Rika Terry',
      password: await bcrypt.hash('Rikrik123!', 10),
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  const chrisUser = await prisma.user.create({
    data: {
      email: 'chris@example.com',
      name: 'Chris Terry',
      password: await bcrypt.hash('chris123', 10),
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  console.log('Creating teams...');

  // Create teams
  const emeaTeam = await prisma.team.create({
    data: {
      name: 'EMEA',
      members: {
        create: [
          {
            userId: rikaUser.id,
            role: 'OWNER',
          },
          {
            userId: chrisUser.id,
            role: 'MEMBER',
          },
        ],
      },
    },
  });

  const apacTeam = await prisma.team.create({
    data: {
      name: 'APAC',
      members: {
        create: [
          {
            userId: chrisUser.id,
            role: 'OWNER',
          },
          {
            userId: rikaUser.id,
            role: 'MEMBER',
          },
        ],
      },
    },
  });

  console.log('Creating POVs...');

  // Create POVs for Rika
  const rikaPOVs = await Promise.all([
    prisma.pOV.create({
      data: {
        title: 'EMEA Market Analysis',
        description: 'Comprehensive market analysis for EMEA region',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        ownerId: rikaUser.id,
        teamId: emeaTeam.id,
      },
    }),
    prisma.pOV.create({
      data: {
        title: 'EMEA Customer Feedback',
        description: 'Analysis of customer feedback from EMEA region',
        status: 'DRAFT',
        priority: 'MEDIUM',
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        ownerId: rikaUser.id,
        teamId: emeaTeam.id,
      },
    }),
  ]);

  console.log('Dummy data creation completed!');
}

main()
  .catch((e) => {
    console.error('Error creating dummy data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
