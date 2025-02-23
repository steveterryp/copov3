import { NextRequest } from "next/server"
import { ApiError, ErrorCode } from "@/lib/errors"
import { createHandler } from "@/lib/api-handler"
import { prisma } from "@/lib/prisma"
import { UserRole, ResourceType, ResourceAction } from "@/lib/types/auth"
import { z } from "zod"

const updatePermissionSchema = z.object({
  role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  resource: z.enum(Object.values(ResourceType) as [string, ...string[]]),
  action: z.enum(Object.values(ResourceAction) as [string, ...string[]]),
  value: z.boolean(),
})

type UpdatePermissionRequest = z.infer<typeof updatePermissionSchema>

export const GET = createHandler(
  async (req: NextRequest, context, user) => {
    // Check if user exists and has admin access
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ApiError(
        ErrorCode.FORBIDDEN,
        "Access denied. Only administrators can view system permissions."
      )
    }

    // Get all permissions from database
    const permissions = await prisma.rolePermission.findMany();

    return { data: { permissions, currentUserRole: user.role } }
  },
  {
    requireAuth: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  }
)

export const PUT = createHandler(
  async (req: NextRequest, context, user) => {
    // Validate request
    const body = (await req.json()) as UpdatePermissionRequest
    const result = updatePermissionSchema.safeParse(body)
    if (!result.success) {
      throw new ApiError(
        ErrorCode.BAD_REQUEST,
        "Invalid request format. Please ensure all required fields are provided and have valid values."
      )
    }

    // Check if user exists and has admin access
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      throw new ApiError(
        ErrorCode.FORBIDDEN,
        "Access denied. Only administrators can manage system permissions."
      )
    }

    const { role, resource, action, value } = body

    // Only SUPER_ADMIN can modify ADMIN permissions
    if (role === UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ApiError(
        ErrorCode.FORBIDDEN,
        "Only super admins can modify admin permissions. Please contact a super admin to make changes to admin permissions."
      )
    }

    // Log the permission update attempt
    console.log('Permission update:', {
      user: user.role,
      target: role,
      resource,
      action,
      value
    });

    // Update role permission in the database
    const updatedPermission = await prisma.rolePermission.upsert({
      where: {
        role_resourceType_action: {
          role,
          resourceType: resource,
          action,
        },
      },
      update: {
        enabled: value,
      },
      create: {
        role,
        resourceType: resource,
        action,
        enabled: value,
      },
    })

    return { data: updatedPermission }
  },
  {
    requireAuth: true,
    allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  }
)
