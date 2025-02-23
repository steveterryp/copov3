# User Registration Implementation

## Overview

The user registration system implements a secure, email-verified registration flow with the following key features:
- Email verification requirement
- Secure password setting after verification
- JWT-based authentication
- Refresh token support
- TypeScript type safety throughout

## Database Schema

```prisma
model User {
  id               String           @id @default(cuid())
  name             String
  email            String           @unique
  password         String
  role             UserRole         @default(USER)
  status           UserStatus       @default(ACTIVE)
  verificationToken String?         @map("verification_token")
  isVerified       Boolean          @default(false) @map("is_verified")
  verifiedAt       DateTime?        @map("verified_at")
  lastLogin        DateTime?
  resetTokenHash   String?
  resetTokenExpiry DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  customRoleId     String?
  // ... relationships ...
}
```

## Registration Flow

### 1. Initial Registration (app/api/auth/register/route.ts)

```typescript
POST /api/auth/register
```

**Request Body:**
```typescript
{
  email: string;
  name: string;
}
```

**Process:**
1. Validates required fields
2. Checks email format
3. Verifies email isn't already registered
4. Generates verification token using crypto
5. Creates user record with:
   - Temporary password (random hex)
   - Verification token
   - isVerified = false
6. Sends verification email

**Response:**
```typescript
{
  message: string;
  email: string;
}
```

### 2. Email Verification (app/api/auth/verify/[token]/route.ts)

```typescript
POST /api/auth/verify/[token]
```

**Request Body:**
```typescript
{
  password: string;
}
```

**Process:**
1. Validates token from URL
2. Validates password requirements
3. Uses transaction to:
   - Find unverified user by token
   - Hash new password
   - Update user record:
     - Set password
     - Set isVerified = true
     - Set verifiedAt timestamp
     - Clear verification token

**Response:**
```typescript
{
  message: string;
}
```

### 3. Login (app/api/auth/login/route.ts)

```typescript
POST /api/auth/login
```

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Process:**
1. Validates credentials
2. Finds user by email
3. Verifies email is verified
4. Validates password hash
5. Generates:
   - Access token (JWT)
   - Refresh token
6. Stores refresh token
7. Sets secure cookies

**Response:**
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }
}
```

## Security Measures

### Password Security
- Passwords hashed using bcrypt
- Salt rounds configurable in config.security.saltRounds
- Minimum/maximum length enforced
- Temporary password used during registration

### Token Security
- Verification tokens: crypto.randomBytes(32)
- Access tokens: Short-lived JWTs
- Refresh tokens: Longer-lived, stored in database
- All tokens transmitted via secure cookies

### Token Implementation (lib/auth/token-manager.ts)
```typescript
import { SignJWT, jwtVerify } from 'jose';

const accessSecret = new TextEncoder().encode(config.jwt.accessSecret);
const refreshSecret = new TextEncoder().encode(config.jwt.refreshSecret);

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({
    ...payload,
    sub: payload.userId // Set sub claim to userId for JWT standard
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${parseInt(config.jwt.accessExpiration) * 60}s`)
    .setIssuedAt()
    .sign(accessSecret);
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({
    ...payload,
    sub: payload.userId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${parseInt(config.jwt.refreshExpiration) * 24 * 60 * 60}s`)
    .setIssuedAt()
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const verified = await jwtVerify(token, accessSecret);
  const { sub: userId, email, role } = verified.payload;
  if (!userId || !email || !role) {
    throw new Error('Invalid token payload');
  }
  return { userId: userId as string, email: email as string, role: role as UserRole };
}
```

### Refresh Token Flow (app/api/auth/refresh/route.ts)
```typescript
POST /api/auth/refresh
```

**Process:**
1. Extract refresh token from cookie
2. Validate token exists in database and not expired
3. Verify JWT signature and payload
4. Generate new access token
5. Optionally rotate refresh token
6. Update or create new database record
7. Set new cookies

**Security Measures:**
- One-time use (token rotation)
- Database tracking for revocation
- Automatic cleanup of expired tokens
- Cascading deletion with user account

### Email Security
- Verification required before login
- Tokens single-use and invalidated after use
- Email templates with both HTML and text versions

### Email Templates (lib/email.ts)
```typescript
export function generateVerificationEmail(verificationToken: string, userName: string) {
  const verifyUrl = `${config.app.url}/verify?token=${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Hello ${userName},</p>
      <p>Thank you for registering. Please click the button below to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>This link will expire in ${config.auth.verificationTokenExpiry} minutes.</p>
      <p>Best regards,<br>${config.app.name} Team</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eaeaea;" />
      <p style="color: #666; font-size: 12px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        ${verifyUrl}
      </p>
    </div>
  `;

  const text = `
    Verify Your Email
    
    Hello ${userName},
    
    Thank you for registering. Please click the link below to verify your email address:
    
    ${verifyUrl}
    
    If you didn't create an account, you can safely ignore this email.
    
    This link will expire in ${config.auth.verificationTokenExpiry} minutes.
    
    Best regards,
    ${config.app.name} Team
  `;

  return { html, text };
}
```

### Verification Link Structure
- Base URL: Configured in config.app.url (e.g., http://localhost:3000 in development)
- Path: /verify
- Query Parameter: ?token=[verification_token]
- Token Format: 64 character hex string (32 bytes)
- Example: http://localhost:3000/verify?token=a1b2c3d4...

## Type System

### User Types (lib/types/auth.ts)
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date | null;
  customRoleId?: string | null;
  verificationToken?: string | null;
  isVerified: boolean;
  verifiedAt?: Date | null;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}
```

### Request/Response Types
```typescript
export interface RegisterData {
  email: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
```

## Configuration

### Environment Variables
```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Configuration
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15 # minutes
JWT_REFRESH_EXPIRATION=7 # days

# Cookie Configuration
COOKIE_ACCESS_TOKEN=token
COOKIE_REFRESH_TOKEN=refresh_token
COOKIE_DOMAIN=localhost

# Security
LOG_LEVEL=info
LOG_FORMAT=json
CORS_ORIGIN=*

# Authentication
# Password requirements:
# - Min length: 6
# - Max length: 100
# - Must contain: uppercase, lowercase, number, special char
# - Password reset token expires in 60 minutes
# - Verification token expires in 24 hours
```

### Security Configuration (lib/config.ts)
```typescript
security: {
  saltRounds: 10,
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100,
},

auth: {
  passwordMinLength: 6,
  passwordMaxLength: 100,
  passwordResetTokenExpiry: 60, // 60 minutes
  verificationTokenExpiry: 24 * 60, // 24 hours
  passwordPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
  passwordRequirements: [
    'At least one uppercase letter',
    'At least one lowercase letter',
    'At least one number',
    'At least one special character (@$!%*?&)',
    'Between 6 and 100 characters'
  ],
}
```

### Cookie Configuration
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: // Varies by token type
}
```

### Authentication Middleware (middleware/auth.ts)
```typescript
export function requirePermission(
  action: ResourceAction,
  resourceType: ResourceType,
  getResourceId: (req: NextRequest) => Promise<string>
): (handler: RouteHandler) => RouteHandler {
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

      // Add user and resource info to headers
      const headers = new Headers(req.headers);
      headers.set('x-user-id', user.id);
      headers.set('x-user-role', user.role);
      headers.set('x-resource-id', resource.id);
      headers.set('x-resource-type', resource.type);

      return NextResponse.next({ headers });
    } catch (error: any) {
      console.error('[Auth Middleware Error]:', error);
      return NextResponse.json(
        { error: 'Unauthorized - ' + (error.message || 'Unknown error') },
        { status: 401 }
      );
    }
  };
}

export const requireRole = (role: UserRole) => 
  requirePermission(ResourceAction.VIEW, ResourceType.SETTINGS, async () => 'settings');

export const requireAdmin = () => requireRole(UserRole.ADMIN);
export const requireSuperAdmin = () => requireRole(UserRole.SUPER_ADMIN);
```

### Route Protection
- All routes under /dashboard and /settings are protected
- API routes under /api/authenticated require valid token
- Unauthorized access redirects to login
- Token verification happens before route handlers

## Error Handling

### HTTP Status Codes
- 200: Success
- 201: Created (successful registration)
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid credentials)
- 409: Conflict (email exists)
- 500: Internal Server Error

### Validation Errors
```typescript
{
  validationErrors: {
    email?: string[];
    password?: string[];
    name?: string[];
  }
}
```

## Testing

### Test Cases
1. Registration
   - Valid registration
   - Duplicate email
   - Invalid email format
   - Missing required fields

2. Verification
   - Valid token and password
   - Invalid token
   - Invalid password format
   - Expired token

3. Login
   - Successful login
   - Unverified user
   - Invalid credentials
   - Invalid password

### Test Scripts
```bash
# Unit tests
npm run test:unit auth

# Integration tests
npm run test:integration auth

# E2E tests
npm run test:e2e auth
```

## Deployment Considerations

1. Email Service
   - Configure SMTP settings
   - Set up email templates
   - Monitor delivery rates

2. Security
   - Set secure cookie options
   - Configure CORS
   - Rate limiting
   - Request throttling

3. Monitoring
   - Log registration attempts
   - Track verification rates
   - Monitor login failures

## Development and Testing

### Test Users
Test users can be created using the `scripts/create-test-user.js` script. These users are:
- Created with verified email status
- Set up with compliant passwords
- Given specific roles (ADMIN/USER)

Default test accounts:
```
Admin User:
- Email: admin@example.com
- Password: Admin123@
- Role: ADMIN

Test User:
- Email: rika@example.com
- Password: Rika123@
- Role: USER

Additional Test User:
- Email: chris@example.com
- Password: Chris123@
- Role: USER
```

To create/update test users:
```bash
node scripts/create-test-user.js
```

The script ensures:
- Password compliance with system requirements
- Proper password hashing using bcrypt
- Email verification status
- Role assignment

### Development Setup
When setting up the development environment:
1. Run database migrations
2. Seed the database with test data
3. Create test users with the script above
4. Use test accounts for development and testing

## Future Improvements

1. Enhanced Security
   - 2FA support
   - Password complexity rules
   - Login attempt limiting

2. User Experience
   - Registration progress tracking
   - Email template customization
   - Multiple language support

3. Administration
   - User management dashboard
   - Registration analytics
   - Bulk user operations
