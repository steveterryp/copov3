import { PrismaClient, POVStatus, Priority, PhaseType, Prisma, SalesTheatre } from '@prisma/client';
import { UserRole } from '../lib/types/auth';
import { TeamRole } from '../lib/types/team';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const POV_TITLES = [
  // Security Audits
  'UPS Security Infrastructure Assessment',
  'FedEx Network Vulnerability Analysis',
  'Walmart Data Protection Review',
  'Boeing Cybersecurity Evaluation',
  'Lockheed Martin Security Audit',
  'American Airlines Security Assessment',
  
  // Digital Transformation
  'Costco Digital Transformation Strategy',
  'Home Depot E-commerce Modernization',
  'Target Cloud Migration Initiative',
  'CVS Healthcare Digital Platform',
  'Wells Fargo Digital Banking Upgrade',
  'Bank of America Mobile App Redesign',
  
  // Infrastructure Projects
  'Microsoft Azure Integration',
  'Amazon AWS Migration',
  'Chevron Infrastructure Optimization',
  'ExxonMobil Data Center Upgrade',
  'Johnson & Johnson IT Modernization',
  'Pfizer Cloud Infrastructure'
];

async function main() {
  console.log('Creating comprehensive dashboard test data...');

  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.pOV.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.kPITemplate.deleteMany();
  await prisma.pOVKPI.deleteMany();

  // Get all countries
  const countries = await prisma.country.findMany() as unknown as Array<{
    id: string;
    name: string;
    code: string;
    theatre: SalesTheatre;
  }>;

  // Get regions for each country
  const regionsMap = new Map();
  
  for (const country of countries) {
    const regions = await prisma.$queryRaw`
      SELECT id, name, type, "countryId"
      FROM "Region"
      WHERE "countryId" = ${country.id}
    ` as Array<{
      id: string;
      name: string;
      type: string;
      countryId: string;
    }>;
    regionsMap.set(country.id, regions);
  }

  if (countries.length === 0) {
    throw new Error('No countries found. Please run the geographical seed script first.');
  }

  // Create KPI templates
  const kpiTemplates = await Promise.all([
    prisma.kPITemplate.create({
      data: {
        name: 'Revenue Growth',
        description: 'Measures revenue growth percentage',
        type: 'PERCENTAGE',
        defaultTarget: {
          value: 10,
          threshold: {
            warning: 5,
            critical: 0
          }
        },
        calculation: `
          (context) => {
            const current = context.current;
            const previous = context.history[0]?.value || 0;
            return ((current - previous) / previous) * 100;
          }
        `,
        visualization: JSON.stringify({
          type: 'gauge',
          options: {
            min: -10,
            max: 30,
            unit: '%'
          }
        })
      }
    }),
    prisma.kPITemplate.create({
      data: {
        name: 'Customer Satisfaction',
        description: 'Measures customer satisfaction score',
        type: 'NUMERIC',
        defaultTarget: {
          value: 4.5,
          threshold: {
            warning: 4.0,
            critical: 3.5
          }
        },
        calculation: `
          (context) => {
            const ratings = context.current.ratings;
            return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          }
        `,
        visualization: JSON.stringify({
          type: 'line',
          options: {
            min: 0,
            max: 5,
            unit: 'stars'
          }
        })
      }
    }),
    prisma.kPITemplate.create({
      data: {
        name: 'Milestone Completion',
        description: 'Tracks milestone completion rate',
        type: 'PERCENTAGE',
        defaultTarget: {
          value: 100,
          threshold: {
            warning: 90,
            critical: 80
          }
        },
        calculation: `
          (context) => {
            const { completed, total } = context.current;
            return (completed / total) * 100;
          }
        `,
        visualization: JSON.stringify({
          type: 'bar',
          options: {
            min: 0,
            max: 100,
            unit: '%'
          }
        })
      }
    })
  ]);

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: UserRole.ADMIN,
    },
  });

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'rika@example.com',
        name: 'Rika Terry',
        password: await bcrypt.hash('Rikrik123!', 10),
        role: UserRole.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'chris@example.com',
        name: 'Chris Terry',
        password: await bcrypt.hash('chris123', 10),
        role: UserRole.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@example.com',
        name: 'Sarah Johnson',
        password: await bcrypt.hash('sarah123', 10),
        role: UserRole.USER,
      },
    }),
  ]);

  // Create teams with mixed membership
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        name: 'Enterprise Security',
        members: {
          create: users.map((user, index) => ({
            userId: user.id,
            role: index === 0 ? TeamRole.OWNER : TeamRole.MEMBER,
          })),
        },
      },
    }),
    prisma.team.create({
      data: {
        name: 'Digital Transformation',
        members: {
          create: users.map((user, index) => ({
            userId: user.id,
            role: index === 1 ? TeamRole.OWNER : TeamRole.MEMBER,
          })),
        },
      },
    }),
  ]);

  // Create POVs with detailed phases and tasks
  const povStatuses = [POVStatus.IN_PROGRESS, POVStatus.PROJECTED, POVStatus.WON];
  const priorities = [Priority.HIGH, Priority.MEDIUM, Priority.LOW];
  const phaseTypes = [PhaseType.PLANNING, PhaseType.EXECUTION, PhaseType.REVIEW];

  for (const user of users) {
    // Get 3 random unique POV titles for each user
    const shuffledTitles = [...POV_TITLES].sort(() => Math.random() - 0.5);
    const userPovTitles = shuffledTitles.slice(0, 3);

    for (let i = 0; i < 3; i++) {
      const status = povStatuses[Math.floor(Math.random() * povStatuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const team = teams[Math.floor(Math.random() * teams.length)];
      
      // Select random country and its regions
      const country = countries[Math.floor(Math.random() * countries.length)];
      const countryRegions = regionsMap.get(country.id) || [];
      
      if (countryRegions.length === 0) {
        throw new Error(`No regions found for country ${country.name}`);
      }

      const region = countryRegions[Math.floor(Math.random() * countryRegions.length)];
      
      const pov = await prisma.pOV.create({
        data: {
          title: userPovTitles[i],
          description: `Comprehensive assessment and improvement plan for ${userPovTitles[i].split(' ').slice(0, -1).join(' ')}`,
          status,
          priority,
          startDate: new Date(Date.now() - (30 * i) * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + (60 - 30 * i) * 24 * 60 * 60 * 1000),
          ownerId: user.id,
          teamId: team.id,
          salesTheatre: country.theatre,
          countryId: country.id,
          regionId: region.id,
          phases: {
            create: phaseTypes.map((type, phaseIndex) => ({
              name: `${type} Phase`,
              description: `${type} phase for ${userPovTitles[i]}`,
              type,
              startDate: new Date(Date.now() - (30 * i) * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + (60 - 30 * i) * 24 * 60 * 60 * 1000),
              order: phaseIndex,
              tasks: {
                create: Array(5).fill(null).map((_, taskIndex) => ({
                  title: `Task ${taskIndex + 1}`,
                  description: `Description for task ${taskIndex + 1}`,
                  status: Math.random() > 0.5 ? 'COMPLETED' : 'IN_PROGRESS',
                  priority: priorities[Math.floor(Math.random() * priorities.length)],
                  assigneeId: users[Math.floor(Math.random() * users.length)].id,
                })),
              },
            })),
          },
        },
      });

      // Create KPIs for each POV
      await Promise.all(kpiTemplates.map(async (template) => {
        // Generate random initial values based on template type
        let current, target, history;
        switch (template.name) {
          case 'Revenue Growth':
            current = Math.floor(Math.random() * 1000000);
            target = {
              value: 15,
              threshold: {
                warning: 10,
                critical: 5
              }
            };
            history = Array(6).fill(null).map((_, index) => ({
              value: Math.floor(Math.random() * 1000000),
              timestamp: new Date(Date.now() - (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString()
            }));
            break;
          
          case 'Customer Satisfaction':
            current = {
              ratings: Array(5).fill(null).map(() => Math.floor(Math.random() * 5) + 1)
            };
            target = {
              value: 4.5,
              threshold: {
                warning: 4.0,
                critical: 3.5
              }
            };
            history = Array(6).fill(null).map((_, index) => ({
              value: Math.random() * 5,
              timestamp: new Date(Date.now() - (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString()
            }));
            break;
          
          case 'Milestone Completion':
            const totalTasks = 10;
            const completedTasks = Math.floor(Math.random() * (totalTasks + 1));
            current = {
              completed: completedTasks,
              total: totalTasks
            };
            target = {
              value: 100,
              threshold: {
                warning: 90,
                critical: 80
              }
            };
            history = Array(6).fill(null).map((_, index) => ({
              value: Math.floor(Math.random() * 100),
              timestamp: new Date(Date.now() - (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString()
            }));
            break;
        }

        return prisma.pOVKPI.create({
          data: {
            povId: pov.id,
            templateId: template.id,
            name: template.name,
            target: target as Prisma.InputJsonValue,
            current: current as Prisma.InputJsonValue,
            history: history as Prisma.InputJsonValue,
            weight: Math.floor(Math.random() * 30) + 10 // Random weight between 10-40
          }
        });
      }));

      // Create activities for each POV
      await Promise.all([
        prisma.activity.create({
          data: {
            type: 'POV',
            action: 'CREATE',
            userId: user.id,
            metadata: { 
              povId: pov.id,
              povTitle: pov.title,
              details: `Created POV: ${pov.title}` 
            },
          },
        }),
        prisma.activity.create({
          data: {
            type: 'POV',
            action: 'UPDATE',
            userId: user.id,
            metadata: { 
              povId: pov.id,
              povTitle: pov.title,
              details: `Updated POV status to ${status}` 
            },
          },
        }),
      ]);
    }
  }

  console.log('Dashboard test data created successfully!');
}

main()
  .catch((e) => {
    console.error('Error creating dashboard test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
