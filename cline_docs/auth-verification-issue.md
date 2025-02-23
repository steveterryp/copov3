# User Registration Verification Issue

## Purpose of User Registration Verification

The user registration verification system serves to:
1. Ensure email addresses are valid and owned by registering users
2. Prevent unauthorized account creation
3. Maintain security by requiring email verification before login
4. Allow users to set their password securely after email verification

## Current Implementation

### Database Schema (prisma/schema.prisma)
```prisma
model User {
  // ... other fields ...
  verificationToken String?         @map("verification_token")
  isVerified       Boolean          @default(false) @map("is_verified")
  verifiedAt       DateTime?        @map("verified_at")
}
```

### Registration Flow (app/api/auth/register/route.ts)
1. User submits registration with email and name
2. System generates verification token
3. Creates unverified user record
4. Sends verification email

### Verification Flow (app/api/auth/verify/[token]/route.ts)
1. User clicks email link with verification token
2. System validates token and sets password
3. Updates user record: marks as verified, clears token

### Login Flow (app/api/auth/login/route.ts)
1. Checks if user exists and is verified
2. Only allows login for verified users
3. Validates password and issues tokens

## Current Issues

1. Type Mismatches:
   - Schema uses camelCase with @map attributes
   - Code inconsistently uses both camelCase and snake_case
   - TypeScript errors due to missing properties in generated types

2. Specific Errors:
   ```typescript
   - Property 'isVerified' does not exist on type UserSelect<DefaultArgs>
   - Property 'verificationToken' does not exist on type UserWhereInput
   - Missing properties: verificationToken, isVerified, verifiedAt
   ```

3. Attempted Fixes:
   - Updated schema to use @map attributes
   - Regenerated Prisma client
   - Updated mappers to use Prisma-generated types
   - Updated routes to use camelCase

## Root Cause Analysis

The core issue appears to be a mismatch between:
1. Database column names (snake_case)
2. Prisma schema field names (camelCase with @map)
3. Generated Prisma types
4. Our application code

## Recommended Fix Steps

1. Schema Consistency:
   - Keep database columns in snake_case
   - Use camelCase in Prisma schema with @map
   - Ensure all verification fields are properly mapped

2. Type Definitions:
   - Update User interface in auth.ts to match Prisma schema
   - Use Prisma-generated types in mappers
   - Ensure consistent casing in all type references

3. Code Updates:
   - Update all routes to use camelCase field names
   - Update mappers to handle verification fields
   - Update queries to use correct Prisma-generated types

4. Testing:
   - Test complete registration flow
   - Verify email verification process
   - Test login with verified/unverified accounts

## Next Steps

1. Verify schema mapping:
   ```prisma
   verificationToken String?         @map("verification_token")
   isVerified       Boolean          @default(false) @map("is_verified")
   verifiedAt       DateTime?        @map("verified_at")
   ```

2. Update Prisma client:
   ```bash
   npx prisma generate
   ```

3. Update route handlers to use camelCase consistently:
   - register/route.ts
   - verify/[token]/route.ts
   - login/route.ts

4. Update mappers to use correct types:
   - admin/prisma/mappers.ts
   - pov/prisma/user-mappers.ts

5. Test full registration flow to verify changes

This systematic approach should resolve the type mismatches while maintaining database compatibility.
