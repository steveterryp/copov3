# POV Not Found Issue Analysis

## Problem Description
When accessing a POV details page at `/pov/[povId]`, the system returns a "POV not found" error. From the logs:
```
[POV Get] Fetching POV cm7iizrlo0039cjpojmae44xl for user cm7iizrct0003cjpo44kmcpuu (ADMIN)
[POV Get] POV cm7iizrlo0039cjpojmae44xl not found
```

Key observations:
1. The user (admin@example.com) has ADMIN role and proper authentication
2. The POV ID appears to be valid (follows the expected format)
3. The POV is not found in the database

## Context
Recent changes and system state:
1. Authentication is working correctly (confirmed by logs)
2. Permission checks are properly implemented
3. Database connection is working (confirmed by PgBouncer logs)
4. The POV list endpoint might be using different data or caching

## Investigation Steps Taken
1. Added detailed logging to POV handlers
2. Verified authentication and permissions
3. Checked database connection
4. Reviewed API response formats
5. Examined POV service implementation

## Investigation Results
1. Authentication Mismatch:
   - The middleware sets `x-user-id` from `decoded.userId`
   - But getAuthUser was using `decoded.sub` instead
   - This caused the POV list endpoint (using x-user-id) and POV detail endpoint (using getAuthUser) to use different user IDs

2. Database Verification:
   ```sql
   SELECT id, title FROM "POV" WHERE id = 'cm7iizrlo0039cjpojmae44xl';
   ```
   - POV exists in database with title "Johnson & Johnson IT Modernization"
   - Has team "Digital Transformation" (ID: cm7iizrih0007cjpo96ycvgty)
   - Team members include chris (owner), rika, and sarah

3. Root Cause:
   - The POV exists and is accessible
   - The auth token contains both `userId` and `sub` fields
   - Different endpoints were using different fields for user identification

## Potential Solutions (Rated by Probability)

### 1. Auth Token Field Mismatch (Fixed)
The auth system was using inconsistent fields for user identification.

**Solution:**
```typescript
// Before
const user = {
  userId: decoded.sub,
  email: decoded.email,
  role: decoded.role
};

// After
const user = {
  userId: decoded.userId || decoded.sub, // Support both formats
  email: decoded.email,
  role: decoded.role
};
```

### 2. Inconsistent Auth Approaches (80% probability)
Different parts of the system use different approaches to get user information:
- List endpoint: Uses x-user-id header from middleware
- Detail endpoint: Uses getAuthUser helper
- Other endpoints: Mix of both approaches

**Solution:**
1. Audit all endpoints for consistent auth approach
2. Document preferred auth method
3. Add deprecation warnings for old methods

### 3. Token Format Standardization (60% probability)
JWT tokens contain both `userId` and `sub` fields, which could cause confusion.

**Solution:**
1. Standardize token payload format
2. Update token generation to use consistent field names
3. Add validation for token payload structure

## Recommended Action Plan

1. **Immediate Steps**
   - ✅ Update getAuthUser to support both userId and sub fields
   - Add logging to track which field is being used
   - Monitor for any auth-related errors

2. **Implementation Priority**
   - Document the auth token format and field usage
   - Create plan for standardizing auth approach across endpoints
   - Add validation for token payload structure

3. **Verification Steps**
   - Test POV detail page with updated auth handling
   - Verify POV list and detail endpoints use same user ID
   - Monitor auth logs for any field mismatches
   - Test with different user roles and permissions

## Long-term Improvements

1. **Authentication System Overhaul**
   - **Token Format Standardization**
     ```typescript
     interface TokenPayload {
       userId: string;        // Primary identifier
       email: string;        // User email
       role: UserRole;       // User role enum
       exp: number;         // Expiration timestamp
       iat: number;         // Issued at timestamp
       // Remove sub field to avoid confusion
     }
     ```
   - **Auth Method Consolidation**
     - Create unified AuthService:
       ```typescript
       class AuthService {
         // Single source of truth for user info
         async getCurrentUser(context: RequestContext): Promise<User>;
         // Consistent permission checking
         async checkPermission(context: RequestContext, resource: Resource): Promise<boolean>;
         // Standardized token handling
         async refreshToken(token: string): Promise<TokenResponse>;
       }
       ```
     - Deprecate direct header access
     - Remove duplicate auth implementations

2. **Error Handling and Monitoring**
   - **Structured Error System**
     ```typescript
     class AppError extends Error {
       code: ErrorCode;
       context: Record<string, any>;
       timestamp: Date;
       requestId: string;
     }
     
     // Example usage
     throw new AppError({
       code: 'POV_NOT_FOUND',
       message: 'POV not found',
       context: {
         povId,
         userId,
         attemptedMethod: 'getPoVHandler'
       }
     });
     ```
   - **Enhanced Logging**
     - Add request tracing:
       ```typescript
       interface LogContext {
         requestId: string;
         userId: string;
         action: string;
         resource: string;
         duration: number;
         result: 'success' | 'error';
         errorCode?: string;
       }
       ```
     - Implement log aggregation
     - Add performance metrics
   - **Monitoring Dashboard**
     - Track auth success/failure rates
     - Monitor endpoint performance
     - Alert on error patterns
     - Track user session metrics

3. **Database and Caching Strategy**
   - **Query Optimization**
     ```typescript
     // Add indexes for common queries
     model POV {
       @@index([ownerId, status])
       @@index([teamId, status])
     }
     
     // Implement efficient includes
     const fullPOVInclude = {
       team: {
         include: {
           members: {
             include: {
               user: true
             }
           }
         }
       }
     } as const;
     ```
   - **Caching Layer**
     ```typescript
     interface CacheConfig {
       ttl: number;
       invalidationEvents: string[];
       preload?: boolean;
     }
     
     // Example implementation
     class POVCache {
       async get(id: string): Promise<POV | null>;
       async set(pov: POV): Promise<void>;
       async invalidate(patterns: string[]): Promise<void>;
     }
     ```
   - **Data Consistency**
     - Implement optimistic locking
     - Add data validation layer
     - Track data version history

4. **API Architecture Improvements**
   - **Request/Response Standards**
     ```typescript
     interface APIResponse<T> {
       data?: T;
       error?: {
         code: string;
         message: string;
         details?: unknown;
       };
       meta: {
         requestId: string;
         timestamp: string;
         duration: number;
       };
     }
     ```
   - **Middleware Pipeline**
     ```typescript
     const apiMiddleware = [
       requestLogging,
       authentication,
       authorization,
       validation,
       errorHandling,
       metrics
     ];
     ```
   - **API Documentation**
     - OpenAPI/Swagger specs
     - Integration test suite
     - Performance benchmarks

5. **Development Workflow**
   - **Testing Strategy**
     ```typescript
     describe('POV Access', () => {
       it('handles missing POV gracefully', async () => {
         const response = await getPOV('invalid-id');
         expect(response.error.code).toBe('POV_NOT_FOUND');
       });
     });
     ```
   - **CI/CD Pipeline**
     - Add auth token validation
     - Test different auth scenarios
     - Validate API responses
   - **Development Tools**
     - Add auth debugging tools
     - Create test data generators
     - Implement API mocking

These improvements will:
- Prevent auth-related issues
- Improve error detection
- Enhance system reliability
- Reduce debugging time
- Enable better monitoring
- Streamline development
