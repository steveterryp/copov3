import { NextRequest } from 'next/server';
import { TokenPayload, ApiResponse, UserRole, UserStatus } from '@/lib/types/auth';
import { AdminUserService } from '../services/user';
import { AdminUserResponse } from '../types';

const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 3,
  [UserRole.ADMIN]: 2,
  [UserRole.USER]: 1,
};

interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  customRoleId?: string;
}

interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  customRoleId?: string;
}

export async function getAdminUsersHandler(
  _req: NextRequest,
  _context: { params: Record<string, string> },
  user?: TokenPayload
): Promise<AdminUserResponse> {
  try {
    // Check if user exists and has admin access
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      throw new Error('Unauthorized - requires admin access');
    }

    const users = await AdminUserService.getUsers();

    return {
      data: { users },
    };
  } catch (error) {
    console.error('[getAdminUsersHandler]:', error);
    throw error;
  }
}

export async function createUserHandler(
  req: NextRequest,
  _context: { params: Record<string, string> },
  user?: TokenPayload
): Promise<AdminUserResponse> {
  try {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      throw new Error('Unauthorized - requires admin access');
    }

    const data = await req.json();
    
    // Validate request data
    if (!data.email || !data.name || !data.role || !data.status) {
      throw new Error('Missing required fields');
    }

    // Validate role and status
    if (!Object.values(UserRole).includes(data.role)) {
      throw new Error('Invalid role');
    }

    if (!Object.values(UserStatus).includes(data.status)) {
      throw new Error('Invalid status');
    }

    const requestData: CreateUserRequest = {
      email: data.email,
      name: data.name,
      role: data.role,
      status: data.status,
      customRoleId: data.customRoleId,
    };

    const currentUserRoleLevel = roleHierarchy[user.role];
    const newUserRoleLevel = roleHierarchy[requestData.role];

    if (newUserRoleLevel > currentUserRoleLevel) {
      throw new Error('Cannot create a user with a higher role than your own');
    }

    const newUser = await AdminUserService.createUser(requestData);
    return {
      data: { users: [newUser] },
    };
  } catch (error) {
    console.error('[createUserHandler]:', error);
    throw error;
  }
}

export async function updateUserHandler(
  req: NextRequest,
  _context: { params: Record<string, string> },
  user?: TokenPayload
): Promise<AdminUserResponse> {
  try {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      throw new Error('Unauthorized - requires admin access');
    }

    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      throw new Error('User ID is required');
    }

    const data = await req.json();
    
    // Validate role and status if provided
    if (data.role && !Object.values(UserRole).includes(data.role)) {
      throw new Error('Invalid role');
    }

    if (data.status && !Object.values(UserStatus).includes(data.status)) {
      throw new Error('Invalid status');
    }

    const requestData: UpdateUserRequest = {
      name: data.name,
      role: data.role,
      status: data.status,
      customRoleId: data.customRoleId,
    };

    const targetUser = await AdminUserService.getUserById(userId);
    
    if (!targetUser) {
      throw new Error('User not found');
    }

    const currentUserRoleLevel = roleHierarchy[user.role];
    const targetUserRoleLevel = roleHierarchy[targetUser.role];
    const newRoleLevel = requestData.role ? roleHierarchy[requestData.role] : targetUserRoleLevel;

    if (targetUserRoleLevel > currentUserRoleLevel) {
      throw new Error('Cannot modify a user with a higher role than your own');
    }

    if (newRoleLevel > currentUserRoleLevel) {
      throw new Error('Cannot assign a role higher than your own');
    }

    const updatedUser = await AdminUserService.updateUser(userId, requestData);
    return {
      data: { users: [updatedUser] },
    };
  } catch (error) {
    console.error('[updateUserHandler]:', error);
    throw error;
  }
}

export async function deleteUserHandler(
  req: NextRequest,
  _context: { params: Record<string, string> },
  user?: TokenPayload
): Promise<AdminUserResponse> {
  try {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      throw new Error('Unauthorized - requires admin access');
    }

    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      throw new Error('User ID is required');
    }

    const targetUser = await AdminUserService.getUserById(userId);
    
    if (!targetUser) {
      throw new Error('User not found');
    }

    const currentUserRoleLevel = roleHierarchy[user.role];
    const targetUserRoleLevel = roleHierarchy[targetUser.role];

    if (targetUserRoleLevel > currentUserRoleLevel) {
      throw new Error('Cannot delete a user with a higher role than your own');
    }

    await AdminUserService.deleteUser(userId);
    return {
      data: { users: [] },
    };
  } catch (error) {
    console.error('[deleteUserHandler]:', error);
    throw error;
  }
}
