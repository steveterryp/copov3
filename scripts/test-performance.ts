import { prisma } from '../lib/prisma';
import { povService } from '../lib/pov/services/pov';
import { phaseService } from '../lib/pov/services/phase';
import { POVStatus, Priority, PhaseType } from '@prisma/client';
import { PoVDetails } from '../lib/pov/types/core';
import { mapPoVToResponse } from '../lib/pov/prisma/mappers';

let testUser: { id: string };
let testPoV: PoVDetails;
const NUM_PHASES = 10;
const NUM_TASKS = 20;

async function main() {
  try {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'test123', // This would normally be hashed
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    console.log('✓ Test user created');

    // Create test team
    const testTeam = await prisma.team.create({
      data: {
        name: 'Test Team',
        members: {
          connect: { id: testUser.id },
        },
      },
    });
    console.log('✓ Test team created');

    // Create test PoV
    const rawPov = await povService.create({
      title: 'Test PoV',
      description: 'Test PoV for performance testing',
      status: POVStatus.IN_PROGRESS,
      priority: Priority.HIGH,
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
    });
    testPoV = mapPoVToResponse(rawPov);
    console.log('✓ Test PoV created');

    // Create phases
    console.time('Create phases');
    for (let i = 0; i < NUM_PHASES; i++) {
      await phaseService.createPhase({
        povId: testPoV.id,
        templateId: '', // No template
        name: `Phase ${i + 1}`,
        description: `Test phase ${i + 1}`,
        startDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        order: i,
        details: {
          tasks: Array.from({ length: NUM_TASKS }, (_, j) => ({
            key: `task-${i}-${j}`,
            completed: false,
            required: true,
            notes: `Task ${j + 1} notes`,
          })),
        },
      });
    }
    console.timeEnd('Create phases');

    // Test phase retrieval performance
    console.time('Get phases');
    const phases = await phaseService.getPoVPhases(testPoV.id);
    console.timeEnd('Get phases');
    console.log(`Retrieved ${phases.length} phases with ${phases.reduce((acc, p) => acc + (p.details?.tasks?.length || 0), 0)} total tasks`);

    // Clean up
    await prisma.phase.deleteMany({ where: { povId: testPoV.id } });
    await prisma.pOV.delete({ where: { id: testPoV.id } });
    await prisma.team.delete({ where: { id: testTeam.id } });
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
