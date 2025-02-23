import { PrismaClient } from '@prisma/client';
import { UserRole, ResourceType, ResourceAction } from '@/lib/types/auth';

const prisma = new PrismaClient();

async function main() {
  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
  });

  if (!adminUser) {
    console.error('No admin user found');
    return;
  }

  // Clear existing activities
  await prisma.activity.deleteMany({});

  // Sample activity types
  const activityTypes = [
    { type: ResourceType.USER, action: ResourceAction.CREATE, details: 'Created new user account' },
    { type: ResourceType.USER, action: ResourceAction.EDIT, details: 'Updated user profile' },
    { type: ResourceType.USER, action: ResourceAction.DELETE, details: 'Deleted user account' },
    { type: ResourceType.USER, action: ResourceAction.ASSIGN, details: 'Assigned role to user' },
    { type: ResourceType.USER, action: ResourceAction.REJECT, details: 'Revoked role from user' },
    { type: ResourceType.USER, action: ResourceAction.VIEW, details: 'User logged in' },
    { type: ResourceType.USER, action: ResourceAction.REJECT, details: 'User logged out' },
    { type: ResourceType.SETTINGS, action: ResourceAction.EDIT, details: 'Updated system settings' },
    { type: ResourceType.PoV, action: ResourceAction.CREATE, details: 'Created new PoV' },
    { type: ResourceType.PoV, action: ResourceAction.EDIT, details: 'Updated PoV details' },
    { type: ResourceType.PoV, action: ResourceAction.DELETE, details: 'Deleted PoV' },
    { type: ResourceType.PHASE, action: ResourceAction.CREATE, details: 'Added new phase' },
    { type: ResourceType.PHASE, action: ResourceAction.APPROVE, details: 'Completed phase' },
    { type: ResourceType.TASK, action: ResourceAction.ASSIGN, details: 'Assigned task to user' },
    { type: ResourceType.TASK, action: ResourceAction.APPROVE, details: 'Completed task' },
  ];

  // Create sample activities
  const activities = await Promise.all(
    activityTypes.map(async ({ type, action, details }) => {
      return prisma.activity.create({
        data: {
          userId: adminUser.id,
          type,
          action,
          metadata: {
            details: details,
            timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(), // Random time in last 7 days
          },
        },
      });
    })
  );

  console.log('Created sample audit data:', activities);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
