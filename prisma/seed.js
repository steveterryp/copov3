const { PrismaClient, POVStatus, Priority, PhaseType } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const regions = [
  {
    name: 'North America',
    description: 'United States and Canada',
    countries: [
      { name: 'United States', code: 'US' },
      { name: 'Canada', code: 'CA' }
    ]
  },
  {
    name: 'Latin America & Caribbean',
    description: 'Central and South America',
    countries: [
      { name: 'Brazil', code: 'BR' },
      { name: 'Mexico', code: 'MX' },
      { name: 'Argentina', code: 'AR' },
      { name: 'Colombia', code: 'CO' },
      { name: 'Chile', code: 'CL' }
    ]
  },
  {
    name: 'EMEA',
    description: 'Europe, Middle East, and Africa',
    countries: [
      { name: 'United Kingdom', code: 'GB' },
      { name: 'Germany', code: 'DE' },
      { name: 'France', code: 'FR' },
      { name: 'Netherlands', code: 'NL' },
      { name: 'United Arab Emirates', code: 'AE' },
      { name: 'South Africa', code: 'ZA' }
    ]
  },
  {
    name: 'APJ',
    description: 'Asia Pacific and Japan',
    countries: [
      { name: 'Japan', code: 'JP' },
      { name: 'Australia', code: 'AU' },
      { name: 'Singapore', code: 'SG' },
      { name: 'India', code: 'IN' },
      { name: 'South Korea', code: 'KR' }
    ]
  }
];

async function seedGeographicalData() {
  console.log('Seeding geographical data...');

  // Clear existing data
  await prisma.country.deleteMany();
  await prisma.region.deleteMany();

  for (const region of regions) {
    const createdRegion = await prisma.region.create({
      data: {
        name: region.name,
        description: region.description,
      },
    });

    for (const country of region.countries) {
      await prisma.country.create({
        data: {
          name: country.name,
          code: country.code,
          regionId: createdRegion.id,
        },
      });
    }
  }

  const regionsCount = await prisma.region.count();
  const countriesCount = await prisma.country.count();
  
  console.log(`Geographical data seeded successfully: ${regionsCount} regions, ${countriesCount} countries`);
}

async function main() {
  // Create test user (Rika)
  const testUser = await prisma.user.upsert({
    where: { email: 'rika@example.com' },
    update: {},
    create: {
      email: 'rika@example.com',
      name: 'Rika Terry',
      password: await bcrypt.hash('rikrik123', 10),
      role: 'USER',
    },
  });

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  // Create a team
  const team = await prisma.team.upsert({
    where: { id: 'team-1' },
    update: {},
    create: {
      id: 'team-1',
      name: 'Core Team',
      members: {
        create: [
          {
            userId: adminUser.id,
            role: 'ADMIN',
          },
          {
            userId: testUser.id,
            role: 'MEMBER',
          },
        ],
      },
    },
  });

  // Create POVs with different statuses
  const povs = await Promise.all([
    // Active POV
    prisma.pOV.upsert({
      where: { id: 'pov-1' },
      update: {},
      create: {
        id: 'pov-1',
        title: 'Cloud Migration POV',
        description: 'Evaluating cloud migration solutions',
        status: POVStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        ownerId: adminUser.id,
        teamId: team.id,
        phases: {
          create: [
            {
              name: 'Planning Phase',
              description: 'Initial planning and requirements gathering',
              type: PhaseType.PLANNING,
              startDate: new Date(),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              order: 1,
              tasks: {
                create: [
                  {
                    title: 'Requirements Analysis',
                    description: 'Gather and document requirements',
                    assigneeId: testUser.id,
                    status: 'IN_PROGRESS',
                    priority: 'HIGH',
                  },
                ],
              },
            },
          ],
        },
      },
    }),

    // Projected POV
    prisma.pOV.upsert({
      where: { id: 'pov-2' },
      update: {},
      create: {
        id: 'pov-2',
        title: 'Security Assessment POV',
        description: 'Security assessment for new infrastructure',
        status: POVStatus.PROJECTED,
        priority: Priority.MEDIUM,
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000),
        ownerId: adminUser.id,
        teamId: team.id,
      },
    }),

    // Completed POV
    prisma.pOV.upsert({
      where: { id: 'pov-3' },
      update: {},
      create: {
        id: 'pov-3',
        title: 'Network Optimization POV',
        description: 'Network performance optimization project',
        status: POVStatus.WON,
        priority: Priority.MEDIUM,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        ownerId: adminUser.id,
        teamId: team.id,
        phases: {
          create: [
            {
              name: 'Implementation',
              description: 'Implementation of optimizations',
              type: PhaseType.EXECUTION,
              startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              order: 1,
              tasks: {
                create: [
                  {
                    title: 'Network Analysis',
                    description: 'Analyze current network performance',
                    assigneeId: testUser.id,
                    status: 'COMPLETED',
                    priority: 'HIGH',
                  },
                ],
              },
            },
          ],
        },
      },
    }),
  ]);

  console.log('Seed data created:', {
    users: {
      test: testUser,
      admin: adminUser,
    },
    team,
    povs,
  });

  // Seed geographical data
  await seedGeographicalData();
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
