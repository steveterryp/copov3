# Authentication System Documentation

## Overview
The authentication system is a comprehensive JWT-based solution with role-based access control, secure session management, and a complete user registration and login flow. It's built with Next.js 14, TypeScript, and PostgreSQL, providing a secure and scalable authentication foundation.

## Features

### User Management
- User registration with email/password
- Secure password hashing using bcrypt
- Email format validation
- Password strength requirements
- Duplicate email prevention
- Default username generation from email
- Role-based user accounts (ADMIN, MANAGER, USER)

### Authentication
- JWT-based authentication
- Token rotation for security
- Refresh token mechanism
- Multi-session support
- Session tracking and management
- Automatic token cleanup
- Secure HTTP-only cookies
- CSRF protection
- Path-based optimization

### Security Features
- Password hashing with bcrypt (10 rounds)
- Secure cookie handling
  - HTTP-only cookies
  - Secure in production
  - SameSite policy
- CSRF protection
- Token expiration
- Automatic cleanup of expired tokens
- Rate limiting
- Secure headers
- Content Security Policy

### Route Protection
- Role-based access control (RBAC)
- Protected API routes
- Public paths configuration
- Efficient middleware
- Path-based auth checks
- Role validation
- Method-based restrictions

### User Interface
- Clean, responsive auth pages
- Form validation
- Error handling
- Success messages
- Loading states
- Navigation between auth pages
- Mobile-friendly design

## Configuration

### Environment Variables
```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/db_name?schema=public"

# JWT Configuration
JWT_ACCESS_SECRET="your-access-token-secret"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Next Auth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### Security Configuration
```typescript
security: {
  bcryptSaltRounds: 10,
  cookieSecure: process.env.NODE_ENV === 'production',
  cookieSameSite: 'lax',
  corsEnabled: true,
  rateLimitEnabled: true,
  helmet: {
    enabled: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  },
}
```

### Route Permissions
```typescript
routePermissions: [
  // Admin-only routes
  {
    pattern: /^\/api\/admin/,
    config: {
      roles: [Role.ADMIN],
    },
  },
  // Manager routes
  {
    pattern: /^\/api\/pov\/manage/,
    config: {
      roles: [Role.ADMIN, Role.MANAGER],
    },
  },
  // User routes with method restrictions
  {
    pattern: /^\/api\/pov\/\w+/,
    config: {
      roles: [Role.ADMIN, Role.MANAGER, Role.USER],
      methods: ['GET', 'POST'],
    },
  },
]
```

## Implementation Details

### Database Schema
```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  password      String
  name          String?
  role          Role          @default(USER)
  refreshTokens RefreshToken[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}

enum Role {
  ADMIN
  MANAGER
  USER
}
```

### API Routes
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/logout` - User logout
- `/api/auth/refresh` - Token refresh
- `/api/auth/me` - Get current user
- `/api/auth/revoke` - Revoke refresh token

### Middleware
The auth middleware handles:
- Token validation
- Role-based access
- Public path allowance
- Redirect logic
- Token cleanup

### Token Management
- Access tokens: Short-lived (15 minutes)
- Refresh tokens: Long-lived (7 days)
- Token rotation on refresh
- Automatic cleanup of expired tokens
- Secure storage in HTTP-only cookies

## Usage Examples

### Protected API Route
```typescript
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '../lib/jwt';
import { hasPermission } from '../lib/auth/rbac';

export async function GET(request: Request) {
  const accessToken = request.cookies.get('accessToken')?.value;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const decoded = verifyAccessToken(accessToken);
    if (!hasPermission('/api/protected', decoded.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Protected route logic here
    return NextResponse.json({ data: 'Protected data' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
```

### Protected Page Component
```typescript
'use client';

import { useAuth } from '../lib/hooks/use-auth';
import { redirect } from 'next/navigation';

export default function ProtectedPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Protected Page</h1>
      <p>Welcome, {user.email}</p>
    </div>
  );
}
```

## Testing
The auth system includes comprehensive tests:
- Unit tests for auth utilities
- Integration tests for API routes
- Component tests for auth pages
- End-to-end auth flow tests
- Token management tests
- RBAC validation tests

## Future Enhancements
1. OAuth/Social login integration
2. Two-factor authentication
3. Password reset functionality
4. Email verification
5. Session management UI
6. Enhanced security logging
7. Audit trail for auth events
8. Rate limiting per user
9. IP-based blocking
10. Enhanced password policies

## Maintenance
- Regular security audits
- Token cleanup scheduling
- Database optimization
- Performance monitoring
- Security patch updates
