const { PrismaClient, SalesTheatre, POVStatus, Priority, UserRole, TeamRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

type CountryInput = {
  name: string;
  code: string;
  salesTheatre: typeof SalesTheatre[keyof typeof SalesTheatre];
  regions: {
    create: Array<{
      name: string;
      type: string;
    }>;
  };
};

const createCountry = async (input: CountryInput) => {
  // Check if country already exists
  const existingCountry = await prisma.country.findFirst({
    where: { code: input.code }
  });
  
  if (existingCountry) {
    console.log(`Country ${input.name} (${input.code}) already exists, skipping creation`);
    return existingCountry;
  }
  
  // Runtime casting to bypass type checking
  const data = {
    name: input.name,
    code: input.code,
    theatre: input.salesTheatre,
    regions: {
      create: input.regions.create
    }
  };

  console.log(`Creating country ${input.name} (${input.code})`);
  return await prisma.country.create({
    data: data as any
  });
};

async function main() {
  console.log('Starting seed process...');
  
  // Check if we already have POVs
  const existingPovCount = await prisma.pOV.count();
  if (existingPovCount > 0) {
    console.log(`Found ${existingPovCount} existing POVs, skipping country and POV creation`);
    return;
  }
  
  console.log('Creating new seed data...');
  
  // Create North America regions
  const northAmerica = await createCountry({
    name: 'United States',
    code: 'US',
    salesTheatre: SalesTheatre.NORTH_AMERICA,
    regions: {
      create: [
        { name: 'East Coast', type: 'EAST' },
        { name: 'West Coast', type: 'WEST' },
        { name: 'Central', type: 'CENTRAL' }
      ]
    }
  });

  // Create EMEA regions
  const emea = await createCountry({
    name: 'United Kingdom',
    code: 'UK',
    salesTheatre: SalesTheatre.EMEA,
    regions: {
      create: [
        { name: 'London', type: 'CENTRAL' },
        { name: 'Northern England', type: 'NORTH' },
        { name: 'Southern England', type: 'SOUTH' }
      ]
    }
  });

  // Create APJ regions
  const apj = await createCountry({
    name: 'Australia',
    code: 'AU',
    salesTheatre: SalesTheatre.APJ,
    regions: {
      create: [
        { name: 'Eastern Australia', type: 'EAST' },
        { name: 'Western Australia', type: 'WEST' },
        { name: 'Central Australia', type: 'CENTRAL' }
      ]
    }
  });

  // Create LAC regions
  const lac = await createCountry({
    name: 'Brazil',
    code: 'BR',
    salesTheatre: SalesTheatre.LAC,
    regions: {
      create: [
        { name: 'Northern Brazil', type: 'NORTH' },
        { name: 'Southern Brazil', type: 'SOUTH' },
        { name: 'Central Brazil', type: 'CENTRAL' }
      ]
    }
  });
  
  // Get users for POV creation
  console.log('Fetching users...');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: 'admin@example.com' },
        { email: 'rika@example.com' }
      ]
    }
  });
  
  if (users.length === 0) {
    console.log('Creating default users...');
    // Create default users if they don't exist
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const rikaPassword = await bcrypt.hash('Rikrik123!', 10);
    
    console.log('Creating admin user with password hash:', adminPassword);
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        role: UserRole.ADMIN,
        isVerified: true
      }
    });
    
    console.log('Creating rika user with password hash:', rikaPassword);
    await prisma.user.create({
      data: {
        name: 'Rika User',
        email: 'rika@example.com',
        password: rikaPassword,
        role: UserRole.USER,
        isVerified: true
      }
    });
    
    // Fetch the newly created users
    users.push(...await prisma.user.findMany({
      where: {
        OR: [
          { email: 'admin@example.com' },
          { email: 'rika@example.com' }
        ]
      }
    }));
  }
  
  const adminUser = users.find((u: { email: string }) => u.email === 'admin@example.com');
  const rikaUser = users.find((u: { email: string }) => u.email === 'rika@example.com');
  
  if (!adminUser || !rikaUser) {
    throw new Error('Required users not found');
  }
  
  // Create teams if they don't exist
  console.log('Creating teams...');
  let digitalTeam = await prisma.team.findFirst({
    where: { name: 'Digital Transformation' }
  });
  
  if (!digitalTeam) {
    digitalTeam = await prisma.team.create({
      data: {
        name: 'Digital Transformation',
        members: {
          create: [
            {
              userId: adminUser.id,
              role: TeamRole.OWNER
            },
            {
              userId: rikaUser.id,
              role: TeamRole.MEMBER
            }
          ]
        }
      }
    });
  }
  
  let cloudTeam = await prisma.team.findFirst({
    where: { name: 'Cloud Migration' }
  });
  
  if (!cloudTeam) {
    cloudTeam = await prisma.team.create({
      data: {
        name: 'Cloud Migration',
        members: {
          create: [
            {
              userId: adminUser.id,
              role: TeamRole.ADMIN
            },
            {
              userId: rikaUser.id,
              role: TeamRole.PROJECT_MANAGER
            }
          ]
        }
      }
    });
  }
  
  // Get regions for POV creation
  console.log('Fetching regions...');
  const regions = await prisma.region.findMany({
    include: { country: true }
  });
  
  if (regions.length === 0) {
    throw new Error('No regions found');
  }
  
  // Create sample POVs
  console.log('Creating sample POVs...');
  
  const usRegion = regions.find((r: { country: { code: string }, type: string }) => r.country.code === 'US' && r.type === 'EAST');
  const ukRegion = regions.find((r: { country: { code: string }, type: string }) => r.country.code === 'UK' && r.type === 'CENTRAL');
  const auRegion = regions.find((r: { country: { code: string }, type: string }) => r.country.code === 'AU' && r.type === 'EAST');
  
  if (!usRegion || !ukRegion || !auRegion) {
    throw new Error('Required regions not found');
  }
  
  // Create POVs
  await prisma.pOV.create({
    data: {
      title: 'Acme Corp Digital Transformation',
      description: 'Comprehensive digital transformation project for Acme Corporation focusing on modernizing their legacy systems.',
      status: POVStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      startDate: new Date(2025, 1, 1), // Feb 1, 2025
      endDate: new Date(2025, 6, 30),  // July 30, 2025
      objective: 'Modernize legacy systems and improve digital customer experience',
      dealId: 'ACME-2025-001',
      opportunityName: 'Acme Digital Transformation',
      revenue: 1500000.00,
      customerName: 'Acme Corporation',
      customerContact: 'John Smith',
      competitors: ['IBM', 'Accenture'],
      solution: 'Full-stack modernization with cloud migration',
      tags: ['digital', 'transformation', 'cloud'],
      estimatedBudget: 1750000.00,
      resources: JSON.stringify({
        developers: 5,
        designers: 2,
        projectManagers: 1
      }),
      salesTheatre: SalesTheatre.NORTH_AMERICA,
      countryId: usRegion.country.id,
      regionId: usRegion.id,
      ownerId: adminUser.id,
      teamId: digitalTeam.id,
      metadata: JSON.stringify({
        customer: 'Enterprise',
        teamSize: 'Large',
        successCriteria: '30% reduction in operational costs',
        technicalRequirements: 'Cloud migration, API development, frontend modernization'
      })
    }
  });
  
  await prisma.pOV.create({
    data: {
      title: 'Globex Financial Services Platform',
      description: 'Development of a new financial services platform for Globex UK with focus on security and compliance.',
      status: POVStatus.PROJECTED,
      priority: Priority.MEDIUM,
      startDate: new Date(2025, 2, 15), // March 15, 2025
      endDate: new Date(2025, 8, 15),   // Sept 15, 2025
      objective: 'Create secure, compliant financial services platform',
      dealId: 'GLOBEX-2025-003',
      opportunityName: 'Globex Financial Platform',
      revenue: 2200000.00,
      customerName: 'Globex UK',
      customerContact: 'Emma Johnson',
      competitors: ['Deloitte', 'KPMG'],
      solution: 'Custom financial platform with security focus',
      tags: ['financial', 'security', 'compliance'],
      estimatedBudget: 2500000.00,
      resources: JSON.stringify({
        developers: 7,
        securityExperts: 3,
        projectManagers: 2
      }),
      salesTheatre: SalesTheatre.EMEA,
      countryId: ukRegion.country.id,
      regionId: ukRegion.id,
      ownerId: rikaUser.id,
      teamId: cloudTeam.id,
      metadata: JSON.stringify({
        customer: 'Financial',
        teamSize: 'Medium',
        successCriteria: 'Pass all security audits with zero critical findings',
        technicalRequirements: 'ISO27001 compliance, GDPR compliance, encryption'
      })
    }
  });
  
  await prisma.pOV.create({
    data: {
      title: 'Oceanic Retail Analytics Solution',
      description: 'Implementation of advanced analytics and AI for Oceanic Retail to optimize inventory and customer experience.',
      status: POVStatus.VALIDATION,
      priority: Priority.URGENT,
      startDate: new Date(2025, 0, 10), // Jan 10, 2025
      endDate: new Date(2025, 4, 10),   // May 10, 2025
      objective: 'Implement AI-driven analytics for retail optimization',
      dealId: 'OCEANIC-2025-007',
      opportunityName: 'Oceanic Retail Analytics',
      revenue: 1200000.00,
      customerName: 'Oceanic Retail',
      customerContact: 'David Chen',
      competitors: ['Microsoft', 'Amazon'],
      solution: 'Custom analytics platform with ML/AI components',
      tags: ['retail', 'analytics', 'AI'],
      estimatedBudget: 1350000.00,
      resources: JSON.stringify({
        dataScientists: 4,
        developers: 3,
        analysts: 2
      }),
      salesTheatre: SalesTheatre.APJ,
      countryId: auRegion.country.id,
      regionId: auRegion.id,
      ownerId: adminUser.id,
      teamId: digitalTeam.id,
      metadata: JSON.stringify({
        customer: 'Retail',
        teamSize: 'Medium',
        successCriteria: '15% improvement in inventory turnover',
        technicalRequirements: 'Machine learning, predictive analytics, dashboard'
      })
    }
  });
  
  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
