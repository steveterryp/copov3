# POV Edit Issue Investigation

## Issue Description
When trying to edit a POV, we're getting the error:
```
Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This suggests that instead of receiving a JSON response, we're getting an HTML document, which typically indicates a server-side error or routing issue.

## Investigation Steps Taken

1. **Route File Check**
   - Checked for conflicting route files in `/api/pov/`
   - Found both `[id]` and `[povId]` route files
   - Removed the old `[id]` route file to prevent conflicts

2. **API Handler Investigation**
   - Examined `app/api/pov/[povId]/route.ts`
   - Confirmed proper error handling and response formatting
   - Verified the handler returns NextResponse.json() with proper data structure

3. **PUT Handler Check**
   - Reviewed `lib/pov/handlers/put.ts`
   - Confirmed proper validation and error handling
   - Verified the response format matches POVResponse type

4. **Request Body Analysis**
   - Found metadata field was missing from edit page request
   - Added metadata to request body in `app/(authenticated)/pov/[povId]/edit/page.tsx`
   - Issue persisted after adding metadata

5. **Type Checking**
   - Reviewed `lib/pov/types/core.ts`
   - Confirmed metadata is optional in POV interface
   - Verified all required fields are present in request body

6. **Middleware Configuration**
   - Added `/pov/[povId]` and `/pov/[povId]/edit` to protected routes
   - Updated middleware.ts with new routes
   - Issue persisted after middleware update

7. **Admin Access Issue**
   - Found critical issue: Edit page was trying to fetch users from `/api/admin/users`
   - Non-admin users (like Rika) don't have access to this endpoint
   - This causes the admin access denied error, which returns HTML
   - Removed admin endpoint dependency from edit page

## Current Status
- Root cause identified and fixed:
  1. Edit page was making unauthorized admin API calls to `/api/admin/users`
  2. Non-admin users were getting HTML error pages instead of JSON
  3. Created new endpoint `/api/pov/[povId]/team/available` for team member selection
  4. Updated edit page to use new endpoint instead of admin endpoint
  5. Fixed team member update handling in PUT handler
  6. Added proper type support for team members in request types

## Progress
- [x] Test edit functionality after middleware update
- [x] Add error logging in the PUT handler
- [x] Add error response parsing in the client
- [x] Identify admin access issue
- [x] Implement proper team member selection
- [x] Fix team member update handling
- [ ] Test edit functionality with updated implementation

## Solution Implemented
1. Created new endpoint `/api/pov/[povId]/team/available` that:
   - Requires only POV edit permission, not admin access
   - Returns list of available users for team selection
   - Excludes POV owner (automatically in team)
   - Properly handles permissions and errors

2. Updated edit page to:
   - Use new team member endpoint instead of admin endpoint
   - Fetch POV and team members in parallel
   - Handle errors appropriately
   - Maintain existing team member selection functionality

3. Fixed PUT handler to:
   - Properly handle team member updates through Prisma relations
   - Create new team if needed when adding members
   - Update existing team members correctly
   - Use proper TypeScript types for team member handling

## Next Steps
1. Test edit functionality with the updated implementation
2. Monitor for any permission or error handling issues
3. Consider adding loading states for team member selection

## Related Files
- `app/api/pov/[povId]/route.ts`
- `lib/pov/handlers/put.ts`
- `app/(authenticated)/pov/[povId]/edit/page.tsx`
- `lib/pov/types/core.ts`
- `middleware.ts`

## Technical Notes
- Admin routes return HTML error pages for unauthorized access
- Need to avoid admin endpoints in regular user interfaces
- Consider implementing dedicated endpoints for common operations
- Error handling should account for HTML responses from auth failures
