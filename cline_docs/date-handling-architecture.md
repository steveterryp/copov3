# Date Handling Architecture

## Overview

The application uses a consistent approach to handle dates throughout the system, ensuring proper timezone support and consistent formatting. This document outlines how dates are handled at different layers of the application.

## Data Flow

1. **Database Layer (Prisma)**
   - Dates are stored in UTC format in the database
   - Prisma automatically handles the conversion between JavaScript Date objects and database timestamps

2. **API Layer**
   - **Input**: Dates are received as ISO strings from the frontend
   - **Output**: Dates are converted to ISO strings before sending to the frontend
   - Example (POV creation):
     ```typescript
     // app/api/pov/route.ts
     export async function POST(req: NextRequest) {
       const data = await req.json();
       const startDate = new Date(data.startDate);
       const endDate = new Date(data.endDate);
       // Validate dates are valid
       if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
         throw new Error('Invalid date format');
       }
     }
     ```

3. **Domain Layer**
   - **Types**: All date fields in interfaces are defined as strings
   - Example:
     ```typescript
     // lib/pov/types/core.ts
     export interface POV {
       startDate: string;
       endDate: string;
     }
     ```

4. **Mapping Layer**
   - Converts Prisma Date objects to ISO strings when mapping to domain types
   - Example:
     ```typescript
     // lib/pov/prisma/mappers.ts
     export function mapPOVFromPrisma(pov: PrismaPOV): POV {
       return {
         startDate: pov.startDate.toISOString(),
         endDate: pov.endDate.toISOString(),
       };
     }
     ```

5. **Frontend Layer**
   - **Creation**: Dates are created in UTC and converted to ISO strings
     ```typescript
     // app/(authenticated)/pov/create/page.tsx
     const startDate = new Date(Date.UTC(
       now.getUTCFullYear(),
       now.getUTCMonth(),
       now.getUTCDate()
     ));
     ```
   - **Display**: Uses the useDateFormat hook for consistent formatting
     ```typescript
     // components/pov/POVList.tsx
     const { formatDate } = useDateFormat();
     // ...
     {formatDate(pov.startDate)}
     ```

## Date Formatting

1. **Format Hook**
   ```typescript
   // lib/hooks/useDateFormat.ts
   export function useDateFormat() {
     const { settings } = useSettings();
     return {
       formatDate: (date: string | Date, format?: string) => 
         formatDate(date, settings.timezone, format),
     };
   }
   ```

2. **Formatting Utility**
   ```typescript
   // lib/utils/date-format.ts
   export function formatDate(date: Date | string, timezone: string = 'UTC'): string {
     try {
       const d = typeof date === 'string' ? new Date(date) : date;
       return new Intl.DateTimeFormat('en-AU', {
         timeZone: timezone,
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
       }).format(d);
     } catch (error) {
       console.error('Date formatting error:', error);
       return 'Invalid date';
     }
   }
   ```

## User Settings

- Timezone preferences are stored in user settings
- Default timezone is UTC
- Format preferences (12h/24h) can be configured
- Example:
  ```typescript
  // lib/types/settings.ts
  export const defaultUserSettings: UserSettings = {
    timezone: 'Australia/Sydney',
    display: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
    }
  };
  ```

## Best Practices

1. **Storage**
   - Always store dates in UTC in the database
   - Use ISO string format for API communication

2. **Validation**
   - Always validate dates before storing
   - Handle invalid dates gracefully with user-friendly error messages

3. **Display**
   - Use the useDateFormat hook for consistent formatting
   - Respect user timezone preferences
   - Provide fallback for invalid dates

4. **Type Safety**
   - Use string type for dates in interfaces
   - Convert dates at system boundaries (API, database)
   - Validate dates when converting between formats
