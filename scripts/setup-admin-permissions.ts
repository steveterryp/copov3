import { PrismaClient } from '@prisma/client';
import { ResourceType, ResourceAction, UserRole } from '../lib/types/auth';

// Define admin resources that need permissions
const adminResources = [
  ResourceType.USER,
  ResourceType.USER_MANAGEMENT,
  ResourceType.PERMISSIONS,
  ResourceType.JOB_TITLES,
  ResourceType.SETTINGS,
  ResourceType.ANALYTICS
];

const prisma = new PrismaClient();

async function setupAdminPermissions() {
  try {
    console.log('Setting up admin permissions...');

    // Create permissions for standard resources
    for (const resource of Object.values(ResourceType)) {
      for (const action of Object.values(ResourceAction)) {
        await prisma.rolePermission.upsert({
          where: {
            role_resourceType_action: {
              role: UserRole.ADMIN,
              resourceType: resource,
              action: action,
            },
          },
          update: {
            enabled: true,
          },
          create: {
            role: UserRole.ADMIN,
            resourceType: resource,
            action: action,
            enabled: true,
          },
        });
      }
    }

    // Create permissions for admin resources
    for (const resource of adminResources) {
      for (const action of Object.values(ResourceAction)) {
        await prisma.rolePermission.upsert({
          where: {
            role_resourceType_action: {
              role: UserRole.ADMIN,
              resourceType: resource,
              action: action,
            },
          },
          update: {
            enabled: true,
          },
          create: {
            role: UserRole.ADMIN,
            resourceType: resource,
            action: action,
            enabled: true,
          },
        });
      }
    }

    console.log('Admin permissions setup complete!');
  } catch (error) {
    console.error('Error setting up admin permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminPermissions();
