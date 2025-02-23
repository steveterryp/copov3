import { NextRequest } from "next/server"
import { AdminRoleService } from "../services/role"
import { ApiError, ErrorCode } from "@/lib/errors"
import { getAuthUser } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types/auth"
import type { Role, RoleResponse } from "../types"

interface RouteParams {
  params: {
    roleId?: string
  }
}

export async function getAdminRolesHandler(req: NextRequest): Promise<ApiResponse<RoleResponse[]>> {
  try {
    const user = await getAuthUser(req)

    // Check if user exists and has admin access
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new ApiError(ErrorCode.FORBIDDEN, 'Unauthorized - requires admin access');
    }

    const roles = await AdminRoleService.getRoles();
    return { data: roles };
  } catch (error) {
    throw error;
  }
}

export async function getRoleHandler(req: NextRequest, { params }: RouteParams): Promise<ApiResponse<RoleResponse>> {
  try {
    const user = await getAuthUser(req)

    // Check if user exists and has admin access
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new ApiError(ErrorCode.FORBIDDEN, 'Unauthorized - requires admin access');
    }

    if (!params.roleId) {
      throw new ApiError(ErrorCode.BAD_REQUEST, 'Role ID is required');
    }

    const role = await AdminRoleService.getRole(params.roleId);
    return { data: role };
  } catch (error) {
    throw error;
  }
}

export async function updateRoleHandler(req: NextRequest, { params }: RouteParams): Promise<ApiResponse<RoleResponse>> {
  try {
    const user = await getAuthUser(req)

    // Check if user exists and has admin access
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new ApiError(ErrorCode.FORBIDDEN, 'Unauthorized - requires admin access');
    }

    if (!params.roleId) {
      throw new ApiError(ErrorCode.BAD_REQUEST, 'Role ID is required');
    }

    const data = await req.json();
    const role = await AdminRoleService.updateRole(params.roleId, data);
    return { data: role };
  } catch (error) {
    throw error;
  }
}

export async function createRoleHandler(req: NextRequest): Promise<ApiResponse<RoleResponse>> {
  try {
    const user = await getAuthUser(req)

    // Check if user exists and has admin access
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new ApiError(ErrorCode.FORBIDDEN, 'Unauthorized - requires admin access');
    }

    const data = await req.json();
    const role = await AdminRoleService.createRole(data);
    return { data: role };
  } catch (error) {
    throw error;
  }
}

export async function deleteRoleHandler(req: NextRequest, { params }: RouteParams): Promise<ApiResponse<{ success: true }>> {
  try {
    const user = await getAuthUser(req)

    // Check if user exists and has admin access
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new ApiError(ErrorCode.FORBIDDEN, 'Unauthorized - requires admin access');
    }

    if (!params.roleId) {
      throw new ApiError(ErrorCode.BAD_REQUEST, 'Role ID is required');
    }

    await AdminRoleService.deleteRole(params.roleId);
    return { data: { success: true } };
  } catch (error) {
    throw error;
  }
}
