import { prisma } from '../lib/prisma';
import { povService } from '../lib/pov/services/pov';
import { phaseService } from '../lib/pov/services/phase';
import { POVStatus, Priority, PhaseType } from '@prisma/client';

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
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        owner: {
          connect: { id: testUser.id }
        }
      },
    });
    console.log('✓ Test PoV created');

    // Create test phases
    const phases = await Promise.all([
      phaseService.createPhase({
        povId: poV.id,
        templateId: '', // No template
        name: 'Planning Phase',
        description: 'Initial planning phase',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        order: 0,
        details: {
          tasks: [
            {
              key: 'task1',
              completed: false,
              required: true,
              notes: 'Planning task 1',
            },
          ],
        },
      }),
      phaseService.createPhase({
        povId: poV.id,
        templateId: '', // No template
        name: 'Development Phase',
        description: 'Main development phase',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        order: 1,
        details: {
          tasks: [
            {
              key: 'task2',
              completed: false,
              required: true,
              notes: 'Development task 1',
            },
          ],
        },
      }),
    ]);
    console.log('✓ Test phases created');

    // Test phase reordering
    await phaseService.reorderPhases(poV.id, [phases[1].id, phases[0].id], [0, 1]);
    console.log('✓ Phases reordered');

    // Clean up
    await prisma.phase.deleteMany({ where: { povId: poV.id } });
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
