# Technical Learnings

## Authentication System

### Cookie and JWT Token Management

#### Issues Identified
1. Inconsistent cookie names across different parts of the application
   - Different files were using hardcoded cookie names ('token', 'accessToken', etc.)
   - This caused authentication failures as cookies couldn't be found

2. JWT token verification issues
   - Token payload structure wasn't consistent
   - Some parts expected 'sub' field while others used 'userId'

3. Cookie settings inconsistency
   - Different security settings (secure, sameSite, path) in different routes
   - Some routes didn't respect environment-specific settings

#### Solutions Implemented
1. Centralized Cookie Configuration
   - Added cookie configuration to central config.ts
   - Standardized cookie names: 'token' for access token, 'refresh_token' for refresh token
   - All cookie-related settings now pulled from config

2. Standardized JWT Handling
   - Updated JWT payload to consistently use 'userId' instead of 'sub'
   - Added proper expiration time handling in token generation
   - Improved error handling and logging in token verification

3. Enhanced Security Settings
   - Made cookie security settings environment-aware
   - Added domain and path settings to cookie configuration
   - Standardized sameSite and httpOnly settings

4. Improved Debug Logging
   - Added comprehensive logging throughout the auth flow
   - Token generation and verification now log detailed information
   - Better error messages for authentication failures

### Best Practices Established

1. Configuration Management
   - Keep all configuration in a central location (config.ts)
   - Use environment variables with sensible defaults
   - Type all configuration values for better type safety

2. Cookie Security
   - Always use httpOnly for sensitive cookies
   - Make secure flag environment-dependent
   - Use appropriate sameSite setting
   - Set specific paths and domains when needed

3. JWT Token Handling
   - Use consistent payload structure
   - Properly handle token expiration
   - Include necessary user information in payload
   - Implement proper refresh token rotation

4. Error Handling and Logging
   - Add detailed error logging for authentication issues
   - Include context in log messages
   - Log important operations (token generation, verification)
   - Don't log sensitive information

5. Code Organization
   - Keep authentication logic in dedicated files
   - Use middleware for auth checks
   - Centralize common authentication functions
   - Maintain clear separation of concerns

### Implementation Tips

1. Cookie Management
```typescript
// In config.ts
cookie: {
  accessToken: 'token',
  refreshToken: 'refresh_token',
  secure: false, // Set to false for local development
  sameSite: 'lax' as const,
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
}
```

2. Token Generation
```typescript
// Use consistent expiration time format
.setExpirationTime(`${parseInt(config.jwt.accessExpiration) * 60}s`) // Convert minutes to seconds
```

3. Error Handling
```typescript
try {
  const token = cookies().get(config.cookie.accessToken)?.value;
  if (!token) {
    console.log('[verifyAuth] No token found');
    return null;
  }
} catch (error) {
  console.error('[Auth Verification Error]:', error);
  return null;
}
```

### Future Improvements

1. Token Security
   - Implement token blacklisting for logged out tokens
   - Add fingerprint or device ID to tokens
   - Consider implementing token rotation

2. Error Handling
   - Add more granular error types
   - Implement proper error reporting
   - Add metrics for auth failures

3. Monitoring
   - Add authentication metrics
   - Monitor token usage and expiration
   - Track auth failures and patterns

4. Testing
   - Add comprehensive auth flow tests
   - Test token expiration and refresh
   - Test error conditions and edge cases
