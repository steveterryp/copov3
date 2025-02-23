import { type PrismaClient } from '@/lib/prisma';
import { AdminUser, Role, Activity, SystemSettings } from '../types';
import { UserRole, UserStatus } from '@/lib/types/auth';

import { User as PrismaUserType } from '@prisma/client';

type PrismaUser = PrismaUserType & {
  customRole?: {
    id: string;
    name: string;
  };
};

type PrismaSystemSettings = {
  id: string;
  notifications: boolean;
  twoFactor: boolean;
  darkMode: boolean;
  updatedAt: Date;
};
type PrismaRole = Awaited<ReturnType<PrismaClient['role']['findUnique']>> & {
  users?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  }>;
};
type PrismaActivity = Awaited<ReturnType<PrismaClient['activity']['findUnique']>> & {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};
export function mapAdminUserFromPrisma(user: NonNullable<PrismaUser>): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    status: user.status as UserStatus,
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    verificationToken: user.verificationToken || null,
    isVerified: user.isVerified,
    verifiedAt: user.verifiedAt ? user.verifiedAt.toISOString() : null,
    customRoleId: user.customRoleId || undefined,
    customRole: user.customRole ? {
      id: user.customRole.id,
      name: user.customRole.name,
    } : undefined,
  };
}

export function mapRoleFromPrisma(role: NonNullable<PrismaRole>): Role {
  return {
    id: role.id,
    name: role.name,
    permissions: role.permissions,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
    users: role.users?.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      status: user.status as UserStatus,
    })) || [],
  };
}

export function mapSystemSettingsFromPrisma(settings: NonNullable<PrismaSystemSettings>): SystemSettings {
  return {
    id: settings.id,
    notifications: settings.notifications,
    twoFactor: settings.twoFactor,
    darkMode: settings.darkMode,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export function mapActivityFromPrisma(activity: NonNullable<PrismaActivity>): Activity {
  return {
    id: activity.id,
    userId: activity.userId,
    type: activity.type,
    action: activity.action,
    metadata: activity.metadata as Record<string, any> | undefined,
    createdAt: activity.createdAt.toISOString(),
    user: {
      name: activity.user.name,
      email: activity.user.email,
      role: activity.user.role,
    },
  };
}
