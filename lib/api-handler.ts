import { NextRequest } from 'next/server';
import { ApiResponse, ApiResponseWithCookies, TokenPayload, UserRole } from './types/auth';
import { formatCookieHeader } from './cookies';
import { logger } from './logger';
import auth from '@/lib/auth';
import { config } from '@/lib/config';
import { ApiError } from './errors';

type ApiHandler<T = any> = (
  req: NextRequest,
  context: { params: Record<string, string> },
  user?: TokenPayload
) => Promise<Response | ApiResponse<T> | ApiResponseWithCookies<T>>;

interface ApiHandlerOptions {
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
}

export function handleApiError(error: unknown) {
  logger.error('[API Error]:', { error });

  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: error.statusCode }
    );
  }

  return Response.json(
    {
      error: {
        message: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
    { status: 500 }
  );
}

/**
 * API handler wrapper with authentication and error handling
 */
export function createHandler<T = any>(
  handler: ApiHandler<T>,
  options: ApiHandlerOptions = {}
) {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    try {
      // Check authentication if required
      let user: TokenPayload | undefined;
      if (options.requireAuth) {
        const token = req.cookies.get(config.cookie.accessToken)?.value;
        if (!token) {
          return Response.json(
            {
              error: {
                message: 'Unauthorized',
                code: 'UNAUTHORIZED',
              },
            },
            { status: 401 }
          );
        }

        const decoded = await auth.tokens.verifyAccessToken(token);
        if (!decoded) {
          return Response.json(
            {
              error: {
                message: 'Invalid token',
                code: 'INVALID_TOKEN',
              },
            },
            { status: 401 }
          );
        }

        user = decoded;

        // Check role if required
        if (options.allowedRoles && !options.allowedRoles.includes(user.role)) {
          return Response.json(
            {
              error: {
                message: 'Forbidden',
                code: 'FORBIDDEN',
              },
            },
            { status: 403 }
          );
        }
      }

      // Handle request
      const response = await handler(req, context, user);

      // Return raw Response if provided
      if (response instanceof Response) {
        return response;
      }

      // Format API response
      const headers = new Headers();

      // Set cookie headers if provided
      if ('cookies' in response && response.cookies?.length) {
        response.cookies.forEach(cookie => {
          headers.append('Set-Cookie', formatCookieHeader([cookie]));
        });
      }

      if ('error' in response && response.error) {
        return Response.json(
          { error: response.error },
          {
            status: response.error.code === 'UNAUTHORIZED' ? 401 : response.error.code === 'FORBIDDEN' ? 403 : 400,
            headers,
          }
        );
      }

      return Response.json({ data: response.data }, { headers });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export default createHandler;
