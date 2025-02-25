import { PrismaClient } from '@prisma/client';
import { ResourceAction, ResourceType, UserRole } from '../lib/types/auth';

const prisma = new PrismaClient();

async function setupPermissions() {
  console.log('Setting up default permissions...');

  // Delete existing permissions to start fresh
  await prisma.rolePermission.deleteMany({});
  console.log('Cleared existing permissions');

  // Define permissions for SUPER_ADMIN
  const superAdminPermissions = Object.values(ResourceType).flatMap(resourceType =>
    Object.values(ResourceAction).map(action => ({
      role: UserRole.SUPER_ADMIN,
      resourceType,
      action,
      enabled: true,
    }))
  );

  // Define permissions for ADMIN
  const adminPermissions = Object.values(ResourceType).flatMap(resourceType =>
    Object.values(ResourceAction).map(action => ({
      role: UserRole.ADMIN,
      resourceType,
      action,
      enabled: true,
    }))
  );

  // Define permissions for USER
  const userPermissions = [
    // PoV permissions
    { role: UserRole.USER, resourceType: ResourceType.PoV, action: ResourceAction.VIEW, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.PoV, action: ResourceAction.CREATE, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.PoV, action: ResourceAction.EDIT, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.PoV, action: ResourceAction.DELETE, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.PoV, action: ResourceAction.COMMENT, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.PoV, action: ResourceAction.UPLOAD, enabled: true },
    
    // Phase permissions
    { role: UserRole.USER, resourceType: ResourceType.PHASE, action: ResourceAction.VIEW, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.PHASE, action: ResourceAction.CREATE, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.PHASE, action: ResourceAction.EDIT, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.PHASE, action: ResourceAction.DELETE, enabled: true },
    
    // Task permissions
    { role: UserRole.USER, resourceType: ResourceType.TASK, action: ResourceAction.VIEW, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.TASK, action: ResourceAction.CREATE, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.TASK, action: ResourceAction.EDIT, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.TASK, action: ResourceAction.DELETE, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.TASK, action: ResourceAction.ASSIGN, enabled: true },
    { role: UserRole.USER, resourceType: ResourceType.TASK, action: ResourceAction.COMMENT, enabled: true },
    
    // Team permissions
    { role: UserRole.USER, resourceType: ResourceType.TEAM, action: ResourceAction.VIEW, enabled: true },
  ];

  // Combine all permissions
  const allPermissions = [
    ...superAdminPermissions,
    ...adminPermissions,
    ...userPermissions,
  ];

  // Create permissions in database
  await prisma.rolePermission.createMany({
    data: allPermissions,
    skipDuplicates: true,
  });

  console.log(`Created ${allPermissions.length} permissions`);
  console.log('Permissions setup complete!');
}

setupPermissions()
  .catch(e => {
    console.error('Error setting up permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
