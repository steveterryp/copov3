import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { config } from '@/lib/config';
import { ResourceAction, ResourceType, UserRole } from '@/lib/types/auth';
import { checkPermission } from '@/lib/auth/permissions';
import { getResourceById } from '@/lib/auth/resources';

type RouteHandler = (req: NextRequest) => Promise<NextResponse>;

export function requirePermission(
  action: ResourceAction,
  resourceType: ResourceType,
  getResourceId: (req: NextRequest) => Promise<string>
): (handler: RouteHandler) => RouteHandler {
  return function(handler: RouteHandler): RouteHandler {
    return async function(req: NextRequest): Promise<NextResponse> {
      try {
        // Get token from cookie
        const token = req.cookies.get(config.cookie.accessToken)?.value;
        if (!token) {
          return NextResponse.json(
            { error: 'Unauthorized - Not authenticated' },
            { status: 401 }
          );
        }

        // Verify JWT
        const verifiedToken = await jwtVerify(
          token,
          new TextEncoder().encode(config.jwt.accessSecret)
        );
        const decoded = verifiedToken.payload;
        if (!decoded) {
          return NextResponse.json(
            { error: 'Unauthorized - Invalid token' },
            { status: 401 }
          );
        }

        // Get user info from token
        const user = {
          id: decoded.sub as string,
          role: decoded.role as UserRole,
        };

        // Get resource ID and fetch resource
        const resourceId = await getResourceId(req);
        const resource = await getResourceById(resourceType, resourceId);

        // Check permission
        const hasPermission = await checkPermission(
          user,
          resource,
          action,
          {
            ip: req.ip,
            userAgent: req.headers.get('user-agent') || undefined,
          }
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Forbidden - Insufficient permissions' },
            { status: 403 }
          );
        }

        // Call the handler with the original request
        const response = await handler(req);

        // Add user and resource info to response headers
        const headers = new Headers(response.headers);
        headers.set('x-user-id', user.id);
        headers.set('x-user-role', user.role);
        headers.set('x-resource-id', resource.id);
        headers.set('x-resource-type', resource.type);

        // Create new response with updated headers
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      } catch (error: any) {
        console.error('[Auth Middleware Error]:', error);
        return NextResponse.json(
          { error: 'Unauthorized - ' + (error.message || 'Unknown error') },
          { status: 401 }
        );
      }
    };
  };
}

export function requireRole(role: UserRole) {
  return requirePermission(
    ResourceAction.VIEW,
    ResourceType.SETTINGS,
    async () => 'settings'
  );
}

export function requireAdmin() {
  return requireRole(UserRole.ADMIN);
}

export function requireSuperAdmin() {
  return requireRole(UserRole.SUPER_ADMIN);
}
