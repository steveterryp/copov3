# Geographical Fields Migration Guide

## Overview

This migration adds support for sales theatre designation and geographical information (country/region) to POVs. This enhancement allows for better organization and filtering of POVs based on geographical data.

## Schema Changes

### New Enums and Models

```prisma
enum SalesTheatre {
  NORTH_AMERICA
  LAC
  EMEA
  APJ
}

model Region {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  countries   Country[]
  povs        POV[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Country {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  regionId    String
  region      Region   @relation(fields: [regionId], references: [id])
  povs        POV[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([regionId])
}
```

### POV Model Updates

New fields added to the POV model:
- `salesTheatre`: Optional SalesTheatre enum
- `countryId`: Optional reference to Country
- `regionId`: Optional reference to Region

New indexes:
- `@@index([countryId])`
- `@@index([regionId])`
- `@@index([salesTheatre])`

## Migration Steps

1. Create Migration
```bash
npx prisma migrate dev --name add_geographical_fields
```

2. Seed Initial Data
```typescript
// prisma/seed/regions.ts
const regions = [
  {
    name: 'North America',
    description: 'United States and Canada',
    countries: [
      { name: 'United States', code: 'US' },
      { name: 'Canada', code: 'CA' }
    ]
  },
  {
    name: 'Latin America & Caribbean',
    description: 'Central and South America',
    countries: [
      { name: 'Brazil', code: 'BR' },
      { name: 'Mexico', code: 'MX' }
      // Add more as needed
    ]
  },
  {
    name: 'EMEA',
    description: 'Europe, Middle East, and Africa',
    countries: [
      { name: 'United Kingdom', code: 'GB' },
      { name: 'Germany', code: 'DE' },
      { name: 'France', code: 'FR' }
      // Add more as needed
    ]
  },
  {
    name: 'APJ',
    description: 'Asia Pacific and Japan',
    countries: [
      { name: 'Japan', code: 'JP' },
      { name: 'Australia', code: 'AU' },
      { name: 'Singapore', code: 'SG' }
      // Add more as needed
    ]
  }
];
```

3. Update Existing POVs (Optional)
```typescript
// scripts/update-pov-regions.ts
async function updatePOVRegions() {
  const povs = await prisma.pOV.findMany();
  
  for (const pov of povs) {
    // Update based on existing data or business rules
    // Example: Use customer location data if available
    if (pov.customerName) {
      // Implement logic to determine theatre/region
    }
  }
}
```

## API Updates

### New Endpoints

1. Region Management
```typescript
interface RegionRoutes {
  'GET /api/regions': {
    response: Region[];
  };
  'GET /api/regions/[id]/countries': {
    response: Country[];
  };
}
```

2. POV Geographical Queries
```typescript
interface POVGeographicalRoutes {
  'GET /api/pov': {
    query: {
      // Existing query params ...
      salesTheatre?: SalesTheatre;
      countryId?: string;
      regionId?: string;
    };
    response: {
      items: POV[];
      total: number;
    };
  };
}
```

## UI Updates

1. POV Creation/Edit Form
- Add SalesTheatre dropdown
- Add Region selector
- Add Country selector (filtered by selected region)

2. POV List View
- Add geographical filters
- Add columns for theatre/region/country
- Update sorting options

3. Dashboard
- Add geographical distribution charts
- Add theatre-based metrics

## Testing

1. Unit Tests
```typescript
describe('POV Geographical Features', () => {
  it('should create POV with geographical data', async () => {
    // Test implementation
  });

  it('should filter POVs by theatre', async () => {
    // Test implementation
  });

  it('should handle region-country relationships', async () => {
    // Test implementation
  });
});
```

2. Integration Tests
```typescript
describe('POV Geographical Integration', () => {
  it('should maintain data consistency', async () => {
    // Test implementation
  });

  it('should handle cascading updates', async () => {
    // Test implementation
  });
});
```

## Rollback Plan

If issues are encountered:

1. Revert Schema Changes
```bash
npx prisma migrate reset
git checkout HEAD^ prisma/schema.prisma
npx prisma migrate dev
```

2. Remove UI Components
- Remove geographical fields from forms
- Remove geographical filters
- Revert dashboard changes

## Post-Migration Verification

1. Data Integrity
- Verify existing POVs are unchanged
- Confirm new POVs can be created with geographical data
- Validate region-country relationships

2. Performance
- Monitor query performance with new indexes
- Check impact on POV listing with geographical filters
- Verify dashboard performance with new metrics

3. UI/UX
- Verify form validation
- Check filter functionality
- Confirm proper display of geographical data

## Support Notes

1. The geographical fields are optional to maintain backward compatibility
2. Existing POVs can be gradually updated with geographical data
3. Bulk update tools are available in the admin interface
4. New validation rules ensure data consistency
