import { prisma } from '@/lib/prisma';
import { adminUserSelect } from '../prisma/select';
import { mapAdminUserFromPrisma } from '../prisma/mappers';
import { AdminUser } from '../types';
import { UserRole, UserStatus } from '@/lib/types/auth';

interface CreateUserData {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  customRoleId?: string;
  isVerified?: boolean;
  verificationToken?: string;
  verifiedAt?: Date | null;
}

interface UpdateUserData {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  customRoleId?: string;
}

export class AdminUserService {
  /**
   * Get all users
   */
  static async getUsers(): Promise<AdminUser[]> {
    try {
      const users = await prisma.user.findMany({
        select: adminUserSelect,
        orderBy: {
          name: 'asc',
        },
      });

      return users.map(user => mapAdminUserFromPrisma({
        ...user,
        customRole: user.customRole || undefined
      }));
    } catch (error) {
      console.error('[AdminUserService.getUsers]:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<AdminUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: adminUserSelect,
      });

      return user ? mapAdminUserFromPrisma({
        ...user,
        customRole: user.customRole || undefined
      }) : null;
    } catch (error) {
      console.error('[AdminUserService.getUserById]:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  static async createUser(data: CreateUserData): Promise<AdminUser> {
    try {
      const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        status: data.status,
        // Add a temporary password that must be changed on first login
        password: 'temp-password',
        customRoleId: data.customRoleId,
        isVerified: data.isVerified ?? false,
        verificationToken: data.verificationToken,
        verifiedAt: data.verifiedAt,
      },
        select: adminUserSelect,
      });

      return mapAdminUserFromPrisma({
        ...user,
        customRole: user.customRole || undefined
      });
    } catch (error) {
      console.error('[AdminUserService.createUser]:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, data: UpdateUserData): Promise<AdminUser> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          role: data.role,
          status: data.status,
          customRoleId: data.customRoleId,
        },
        select: adminUserSelect,
      });

      return mapAdminUserFromPrisma({
        ...user,
        customRole: user.customRole || undefined
      });
    } catch (error) {
      console.error('[AdminUserService.updateUser]:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      console.error('[AdminUserService.deleteUser]:', error);
      throw error;
    }
  }
}
