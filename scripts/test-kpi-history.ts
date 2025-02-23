import { prisma } from '../lib/prisma';
import { kpiService } from '../lib/pov/services/kpi';
import { POVStatus, Priority, KPIType } from '@prisma/client';

async function main() {
  try {
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'test123', // This would normally be hashed
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    console.log('✓ Test user created');

    // Create test KPI template
    const template = await prisma.kPITemplate.create({
      data: {
        name: 'Test Template',
        description: 'Test KPI Template',
        type: KPIType.NUMERIC,
        isCustom: false,
        defaultTarget: {
          value: 100,
          threshold: {
            warning: 80,
            critical: 60,
          },
        },
        calculation: `
          function calculate(context) {
            return context.current || 0;
          }
        `,
      },
    });
    console.log('✓ Test template created');

    // Create test PoV
    const poV = await prisma.pOV.create({
      data: {
        title: 'Test PoV',
        description: 'Test PoV Description',
        status: POVStatus.PROJECTED,
        priority: Priority.MEDIUM,
        metadata: {
          customer: 'Test Customer',
          teamSize: '5-10',
          successCriteria: 'Test success criteria',
          technicalRequirements: 'Test technical requirements',
        },
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        owner: {
          connect: { id: testUser.id }
        }
      },
    });
    console.log('✓ Test PoV created');

    // Create test KPI
    const kpi = await prisma.pOVKPI.create({
      data: {
        povId: poV.id,
        templateId: template.id,
        name: 'Test KPI',
        target: {
          value: 100,
          threshold: {
            warning: 80,
            critical: 60,
          },
        },
        current: 75,
        weight: 1,
        history: [],
      },
    });
    console.log('✓ Test KPI created');

    // Test KPI history
    const history = await kpiService.getKPIHistory(kpi.id);
    console.log('✓ Initial KPI history:', history);

    // Clean up
    await prisma.pOVKPI.delete({ where: { id: kpi.id } });
    await prisma.kPITemplate.delete({ where: { id: template.id } });
    await prisma.pOV.delete({ where: { id: poV.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✓ Test cleanup completed');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
