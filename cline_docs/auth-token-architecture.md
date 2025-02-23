# Authentication and Token Architecture

## Executive Summary

The system implements a robust JWT-based authentication system with the following key features:

1. Authentication Flow:
- The system uses JWT-based authentication with access and refresh tokens
- Access tokens are short-lived (15 minutes by default)
- Refresh tokens are long-lived (7 days by default)
- Both tokens are stored in HTTP-only cookies

2. Token Management:
- Access tokens contain user ID (as 'sub'), email, and role
- Tokens are signed using HS256 algorithm with separate secrets for access and refresh tokens
- Token verification is handled by the jose library
- Token generation includes standard JWT claims (sub, iat, exp)

3. Authorization:
- Three-tier role system: USER, ADMIN, SUPER_ADMIN
- Fine-grained permissions system based on:
  - Resource types (PoV, PHASE, TASK, USER, etc.)
  - Actions (VIEW, CREATE, EDIT, DELETE, etc.)
  - Conditions (isOwner, isTeamMember, hasRole)
- Role-based permissions are predefined in rolePermissions

4. Middleware:
- Auth middleware verifies tokens and checks permissions
- Supports both cookie-based and Bearer token authentication
- Adds user and resource info to response headers
- Provides helper functions for role-based access control

5. API Routes:
- /api/auth/login: Handles user authentication and token generation
- /api/auth/me: Returns current user information
- Both routes include extensive logging for debugging

6. Security Features:
- HTTP-only cookies for token storage
- Secure password hashing with bcrypt
- Refresh token rotation
- Type-safe implementations throughout
- Comprehensive error handling and logging

7. Test Script:
- scripts/test-auth-with-server.ts


## Overview

The authentication system provides secure user authentication and authorization using JWT tokens and HTTP-only cookies, built specifically for Next.js 13+ App Router. It implements a robust token-based authentication flow with refresh token support, React Query integration, and comprehensive error handling.

## System Architecture

### 1. Route Structure
```
app/
├── (auth)/             # Public auth routes
│   ├── login/         # Login page
│   ├── register/      # Registration page
│   └── password-reset/ # Password recovery
└── (authenticated)/    # Protected routes
    ├── dashboard/     # User dashboard
    └── pov/          # POV management
```

### 2. Core Components

#### API Layer (`app/api/auth/`)
```typescript
app/api/auth/
├── login/            // User authentication and token generation
├── logout/           // Token invalidation and cookie cleanup
├── register/         // User registration
├── refresh/          // Token refresh flow
├── me/              // Current user information
├── revoke/          // Token revocation
├── verify/          // Email verification
├── profile/         // User profile management
├── password-reset/  // Password reset flow
│   ├── request/     // Request password reset
│   └── reset/       // Process reset
└── ws-token/        // WebSocket authentication
```

#### Authentication Services (`lib/auth/`)
```typescript
lib/auth/
├── middleware.ts     // Auth middleware with route group support
├── verify.ts        // Token verification and validation
├── get-auth-user.ts // User context retrieval
├── permissions.ts   // RBAC permission checks
└── resources.ts     // Resource-based access control
```

### 3. Configuration (lib/config.ts)
```typescript
jwt: {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15', // minutes
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7', // days
}

cookie: {
  accessToken: process.env.COOKIE_ACCESS_TOKEN || 'token',
  refreshToken: process.env.COOKIE_REFRESH_TOKEN || 'refresh_token',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
  httpOnly: true,
  maxAge: parseInt(process.env.JWT_ACCESS_EXPIRATION || '15') * 60 * 1000,
}
```

### 4. Type Definitions (lib/types/auth.ts)
```typescript
interface TokenPayload {
  userId: string;      // Stored as 'sub' claim in JWT
  email: string;       // User's email
  role: UserRole;      // User's role
  exp?: number;        // Expiration time
  iat?: number;        // Issued at time
}

interface JWTPayload extends Record<string, any> {
  userId: string;
  email: string;
  role: UserRole;
  exp?: number;
  iat?: number;
}

interface VerifiedToken {
  payload: TokenPayload;
  protectedHeader: {
    alg: 'HS256';
    typ?: 'JWT';
  };
}

interface TokenError {
  code: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_MISSING';
  message: string;
  details?: {
    expiredAt?: Date;
    invalidReason?: string;
  };
}

interface ApiError {
  message: string;
  code?: string;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
}

interface ApiResponseWithCookies<T = any> {
  data?: T;
  error?: ApiError;
  cookies?: ResponseCookie[];
}
```

## Token Flow

### 1. Token Creation Flow
```
Login Request
↓
Validate Credentials (login/route.ts)
↓
Generate Access Token (token-manager.ts)
  - Set sub claim to userId
  - Include email and role
  - Set expiration (15 minutes)
  - Sign with access secret
↓
Generate Refresh Token (token-manager.ts)
  - Set sub claim to userId
  - Include email and role
  - Set expiration (7 days)
  - Sign with refresh secret
↓
Store Refresh Token in Database
↓
Set HTTP-Only Cookies
  - Access token cookie
  - Refresh token cookie
↓
Return User Data Response
```

### 2. Token Verification Flow
```
Incoming Request
↓
Extract Token (get-auth-user.ts)
  - Check cookies first
  - Fall back to Authorization header
↓
Verify Token Signature (token-manager.ts)
  - Verify using appropriate secret
  - Check token expiration
  - Validate required claims
↓
Map JWT Claims to User Data
  - Map 'sub' to userId
  - Extract email and role
↓
Verify User in Database
  - Check user exists
  - Get fresh user data
↓
Check Permissions (auth.ts)
  - Verify resource access
  - Check action permissions
  - Validate conditions
↓
Allow/Deny Request
```

### 3. Token Refresh Flow
```
Access Token Expires
↓
Client Sends Refresh Token
↓
Verify Refresh Token
  - Check signature
  - Verify expiration
  - Validate claims
↓
Check Token in Database
  - Verify token exists
  - Check if revoked
↓
Generate New Access Token
↓
Update Cookies
  - Set new access token
  - Keep existing refresh token
↓
Return New Access Token
```

### 4. Token Revocation Flow
```
Logout Request
↓
Mark Refresh Token as Revoked
↓
Clear Cookies
  - Remove access token
  - Remove refresh token
↓
Return Success Response
```

## Implementation Details

### 1. State Management

#### AuthProvider with React Query
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user, setUser, clearUser, accessToken } = useAuthStore();

  // Login mutation
  const loginMutation = useMutation<AuthResponse, Error, LoginData>({
    mutationFn: async (data) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const responseData = await response.json() as ApiResponseWithCookies<AuthResponse>;
      if (!responseData.data) {
        throw new Error('Invalid response format');
      }
      return responseData.data;
    },
    onSuccess: (data) => {
      setUser(convertUserResponse(data.user), data.accessToken);
    },
  });

  // Current user query
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        if (response.status === 401) {
          clearUser();
          return null;
        }
        throw new Error('Failed to fetch user');
      }
      const data = await response.json() as ApiResponseWithCookies<{ user: User; accessToken: string }>;
      if (!data.data?.user || !data.data?.accessToken) {
        throw new Error('Invalid response format');
      }
      setUser(convertUserResponse(data.data.user), data.data.accessToken);
      return data.data.user;
    },
    retry: false,
  });

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoadingUser,
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
      isLoggingIn: loginMutation.isPending,
      isRegistering: registerMutation.isPending,
      isLoggingOut: logoutMutation.isPending,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 2. Token Management Standards

#### Setting Cookies
```typescript
// ✅ Use complete security options
cookieStore.set(config.cookie.accessToken, value, {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.sameSite,
  path: config.cookie.path,
  domain: config.cookie.domain,
  maxAge: tokenExpiration
});

// ❌ Don't use minimal options
cookieStore.set('token', value, { httpOnly: true });
```

#### Reading Cookies
```typescript
// ✅ Use configuration
const token = cookies().get(config.cookie.accessToken)?.value;

// ❌ Don't hardcode cookie names
cookies().get('token');
```

#### Token Generation
```typescript
export async function signAccessToken(payload: TokenPayload): Promise<string> {
  try {
    console.log('[signAccessToken] Input payload:', payload);
    
    const jwt = new SignJWT({
      ...payload,
      sub: payload.userId // Set sub claim to userId for JWT standard
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(`${parseInt(config.jwt.accessExpiration) * 60}s`)
      .setIssuedAt();
    
    return await jwt.sign(accessSecret);
  } catch (error) {
    console.error('[signAccessToken] Error:', error);
    throw error;
  }
}
```

## Error Handling

### Type-Safe Error Handling
```typescript
async function handleTokenError(error: unknown): Promise<never> {
  if (error instanceof JWTExpired) {
    console.error('[Token Error] Token expired:', {
      expiredAt: error.expiredAt,
      message: error.message
    });
    throw {
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
      details: { expiredAt: error.expiredAt }
    } as TokenError;
  }

  if (error instanceof JWTInvalid) {
    console.error('[Token Error] Invalid token:', {
      message: error.message
    });
    throw {
      code: 'TOKEN_INVALID',
      message: 'Invalid authentication token',
      details: { invalidReason: error.message }
    } as TokenError;
  }

  console.error('[Token Error] Unknown error:', error);
  throw {
    code: 'TOKEN_INVALID',
    message: 'Authentication error occurred',
    details: { error: String(error) }
  } as TokenError;
}
```

### Error Type Guards
```typescript
function isTokenError(error: unknown): error is TokenError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as TokenError).code === 'string' &&
    typeof (error as TokenError).message === 'string'
  );
}
```

## Testing Guidelines

### 1. Query Testing
```typescript
it('should handle user query', async () => {
  const { result } = renderHook(() => useQuery(['auth', 'me'], fetchUser));
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  
  expect(result.current.data).toMatchObject({
    id: expect.any(String),
    email: expect.any(String),
    role: expect.any(String),
  });
});
```

### 2. Mutation Testing
```typescript
it('should handle login mutation', async () => {
  const { result } = renderHook(() => useMutation(loginUser));
  
  await act(async () => {
    await result.current.mutateAsync({
      email: 'test@example.com',
      password: 'password',
    });
  });
  
  expect(result.current.isSuccess).toBe(true);
  expect(result.current.data).toMatchObject({
    user: expect.any(Object),
    accessToken: expect.any(String),
  });
});
```

## Security Considerations

### Token Storage
- HTTP-only cookies for tokens
- Secure flag in production
- Appropriate cookie expiration

### Token Validation
- Verify signature
- Check expiration
- Validate required claims

### CSRF Protection
- SameSite cookie attribute
- CSRF tokens for sensitive operations

### Permission Checks
- Role-based access control
- Resource-level permissions
- Action-specific authorization

## Common Issues & Solutions

### 1. React Query State Management
**Problem:** Stale data after mutations
**Solution:** 
```typescript
// Invalidate queries after mutations
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: async (data) => {
    // Mutation logic
  },
  onSuccess: () => {
    // Invalidate affected queries
    queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
  },
});
```

### 2. Token Refresh Handling
**Problem:** Race conditions during token refresh
**Solution:**
```typescript
// Implement refresh token queue
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('Refresh failed');
      const data = await response.json();
      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
```

### 3. Route Protection
**Problem:** Redirect loops with route groups
**Solution:**
```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname.replace(/^\/(auth|authenticated)/, '');
  
  if (isPublicRoute(path)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(config.cookie.accessToken)?.value;
  if (!token) {
    return redirectToLogin(req);
  }

  try {
    const decoded = verifyAccessToken(token);
    const hasPermission = checkPermission(decoded, path);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  } catch (error) {
    return redirectToLogin(req);
  }
}
```

## Current Issues and Fixes

### Token Claim Standardization (2025-02-19)

1. **Issue Identified**
   - Token-manager sets userId in 'sub' claim (JWT standard)
   - Auth verification looks for 'userId' directly
   - Need to standardize on JWT claims

2. **Fix Implementation**
   ```typescript
   const { sub, email, role, exp, iat, ...rest } = verified.payload;
   const payload: JWTPayload = {
     userId: sub as string,  // Map 'sub' to 'userId'
     email: email as string,
     role: role as UserRole,
     exp,
     iat,
     ...rest
   };
   ```

### Database Verification Addition (2025-02-19)

1. **Issue Identified**
   - Token verification only checked JWT validity
   - No verification that the user still exists in the database
   - Could lead to access with valid tokens for deleted users

2. **Fix Implementation**
   ```typescript
   const dbUser = await prisma.user.findUnique({
     where: { id: userId },
     select: { id: true, email: true, role: true }
   });

   if (!dbUser) {
     console.log('[Auth] User not found in database:', userId);
     return null;
   }
   ```

### Cookie Name Consistency (2025-02-19)

1. **Issue Identified**
   - Inconsistent cookie names across the application
   - Some parts using hardcoded names

2. **Fix Applied**
   ```typescript
   // New implementation
   cookies().get(config.cookie.accessToken)?.value
   ```

## Future Improvements

### 1. Performance Optimizations
- Implement token caching
- Add request deduplication
- Optimize database queries
- Add response compression

### 2. Security Enhancements
- Add rate limiting
- Implement device fingerprinting
- Enhance token rotation
- Add multi-factor authentication

### 3. Feature Additions
- Add session management
- Implement account recovery
- Add login history
- Add security notifications

## Changelog

### 2025-02-19
1. Documentation Consolidation
   - Merged cookie-token-standards.md into auth-token-architecture.md
   - Updated and merged authentication.md into auth-token-architecture.md
   - Removed redundant documentation files
   - Created single source of truth for auth documentation

2. Content Updates
   - Added comprehensive Token Flow section with detailed diagrams
   - Updated API route structure to include all current endpoints
   - Added React Query implementation details
   - Updated state management documentation
   - Added detailed error handling patterns
   - Added testing guidelines with examples
   - Updated security considerations

3. Implementation Updates
   - Added database verification for refresh tokens
   - Standardized JWT claims using 'sub'
   - Fixed cookie name consistency
   - Added type-safe error handling
   - Added React Query integration
   - Added token refresh queue for race conditions

4. Structure Improvements
   - Reorganized content for better flow
   - Added executive summary
   - Enhanced code examples
   - Added implementation standards
   - Added common issues and solutions
