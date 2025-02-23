# Geographical Implementation Patterns

## Overview

This document provides patterns and approaches for implementing geographical features in the POV system, specifically focusing on sales theatre, country, and region management.

## Data Management Patterns

### Geographical Entity Pattern

```typescript
// Base Geographical Interface
interface GeographicalEntity {
  id: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Region Implementation
interface Region extends GeographicalEntity {
  countries: Country[];
  povs: POV[];
}

// Country Implementation
interface Country extends GeographicalEntity {
  code: string; // Required for countries
  regionId: string;
  region: Region;
  povs: POV[];
}
```

### Validation Pattern

```typescript
// Geographical Validation
class GeographicalValidator extends BaseValidator<POV> {
  constructor() {
    super(
      z.object({
        // Existing POV fields...
        salesTheatre: z.enum(['NORTH_AMERICA', 'LAC', 'EMEA', 'APJ']).optional(),
        countryId: z.string().optional(),
        regionId: z.string().optional(),
      }).refine(
        (data) => {
          // If country is specified, region must be specified
          if (data.countryId && !data.regionId) {
            return false;
          }
          return true;
        },
        {
          message: 'Region must be specified when country is provided',
        }
      )
    );
  }

  async validateGeographicalConsistency(data: {
    countryId?: string;
    regionId?: string;
  }): Promise<boolean> {
    if (!data.countryId || !data.regionId) {
      return true;
    }

    const country = await prisma.country.findUnique({
      where: { id: data.countryId },
      include: { region: true },
    });

    return country?.regionId === data.regionId;
  }
}
```

## Service Patterns

### Geographical Service Pattern

```typescript
class GeographicalService {
  constructor(private prisma: PrismaClient) {}

  // Region Operations
  async getRegions(): Promise<Region[]> {
    return this.prisma.region.findMany({
      include: {
        countries: true,
        _count: {
          select: { povs: true },
        },
      },
    });
  }

  async getRegionWithCountries(regionId: string): Promise<Region | null> {
    return this.prisma.region.findUnique({
      where: { id: regionId },
      include: {
        countries: {
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  // Country Operations
  async getCountriesByRegion(regionId: string): Promise<Country[]> {
    return this.prisma.country.findMany({
      where: { regionId },
      orderBy: { name: 'asc' },
    });
  }

  // POV Geographical Operations
  async updatePOVGeography(
    povId: string,
    data: {
      salesTheatre?: SalesTheatre;
      countryId?: string;
      regionId?: string;
    }
  ): Promise<POV> {
    // Validate geographical consistency
    if (data.countryId && data.regionId) {
      const isValid = await this.validateGeographicalConsistency(data);
      if (!isValid) {
        throw new Error('Invalid geographical combination');
      }
    }

    return this.prisma.pOV.update({
      where: { id: povId },
      data,
      include: {
        country: true,
        region: true,
      },
    });
  }
}
```

## UI Patterns

### Geographical Form Pattern

```typescript
// Cascading Select Pattern
interface GeographicalSelectProps {
  selectedTheatre?: SalesTheatre;
  selectedRegion?: string;
  selectedCountry?: string;
  onChange: (data: {
    theatre?: SalesTheatre;
    regionId?: string;
    countryId?: string;
  }) => void;
}

const GeographicalSelect: React.FC<GeographicalSelectProps> = ({
  selectedTheatre,
  selectedRegion,
  selectedCountry,
  onChange,
}) => {
  // Fetch data
  const { data: regions } = useRegions();
  const { data: countries } = useCountries(selectedRegion);

  // Handle changes
  const handleTheatreChange = (theatre: SalesTheatre) => {
    onChange({ theatre, regionId: undefined, countryId: undefined });
  };

  const handleRegionChange = (regionId: string) => {
    onChange({ 
      theatre: selectedTheatre,
      regionId,
      countryId: undefined
    });
  };

  const handleCountryChange = (countryId: string) => {
    onChange({
      theatre: selectedTheatre,
      regionId: selectedRegion,
      countryId
    });
  };

  return (
    <div className="geographical-select">
      <Select
        label="Sales Theatre"
        value={selectedTheatre}
        onChange={handleTheatreChange}
        options={Object.values(SalesTheatre)}
      />
      
      <Select
        label="Region"
        value={selectedRegion}
        onChange={handleRegionChange}
        options={regions?.map(r => ({
          value: r.id,
          label: r.name
        }))}
      />
      
      <Select
        label="Country"
        value={selectedCountry}
        onChange={handleCountryChange}
        options={countries?.map(c => ({
          value: c.id,
          label: c.name
        }))}
        disabled={!selectedRegion}
      />
    </div>
  );
};
```

### Geographical Display Pattern

```typescript
// Geographical Info Display
interface GeographicalInfoProps {
  pov: POV;
  showDetails?: boolean;
}

const GeographicalInfo: React.FC<GeographicalInfoProps> = ({
  pov,
  showDetails = false,
}) => {
  const location = useMemo(() => {
    const parts = [];
    if (pov.salesTheatre) parts.push(formatTheatre(pov.salesTheatre));
    if (pov.country?.name) parts.push(pov.country.name);
    if (pov.region?.name) parts.push(pov.region.name);
    return parts.join(' • ');
  }, [pov]);

  if (!showDetails) {
    return <div className="geographical-info">{location}</div>;
  }

  return (
    <div className="geographical-info-detailed">
      {pov.salesTheatre && (
        <div className="info-row">
          <span className="label">Theatre:</span>
          <span className="value">{formatTheatre(pov.salesTheatre)}</span>
        </div>
      )}
      {pov.region && (
        <div className="info-row">
          <span className="label">Region:</span>
          <span className="value">{pov.region.name}</span>
        </div>
      )}
      {pov.country && (
        <div className="info-row">
          <span className="label">Country:</span>
          <span className="value">{pov.country.name}</span>
        </div>
      )}
    </div>
  );
};
```

## Testing Patterns

### Geographical Service Tests

```typescript
describe('GeographicalService', () => {
  let service: GeographicalService;
  let prisma: MockPrismaClient;

  beforeEach(() => {
    prisma = createMockPrismaClient();
    service = new GeographicalService(prisma);
  });

  describe('updatePOVGeography', () => {
    it('should update POV with valid geographical data', async () => {
      const data = {
        salesTheatre: 'EMEA' as SalesTheatre,
        regionId: 'region-1',
        countryId: 'country-1',
      };

      prisma.country.findUnique.mockResolvedValue({
        id: 'country-1',
        regionId: 'region-1',
      });

      const result = await service.updatePOVGeography('pov-1', data);
      expect(result).toBeDefined();
    });

    it('should validate geographical consistency', async () => {
      const data = {
        countryId: 'country-1',
        regionId: 'region-2', // Mismatched region
      };

      prisma.country.findUnique.mockResolvedValue({
        id: 'country-1',
        regionId: 'region-1',
      });

      await expect(
        service.updatePOVGeography('pov-1', data)
      ).rejects.toThrow('Invalid geographical combination');
    });
  });
});
```

### Geographical Component Tests

```typescript
describe('GeographicalSelect', () => {
  const mockRegions = [
    { id: 'r1', name: 'EMEA' },
    { id: 'r2', name: 'APJ' },
  ];

  const mockCountries = [
    { id: 'c1', name: 'Germany', regionId: 'r1' },
    { id: 'c2', name: 'France', regionId: 'r1' },
  ];

  it('should handle theatre selection', async () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <GeographicalSelect onChange={onChange} />
    );

    await userEvent.selectOptions(
      getByLabelText('Sales Theatre'),
      'EMEA'
    );

    expect(onChange).toHaveBeenCalledWith({
      theatre: 'EMEA',
      regionId: undefined,
      countryId: undefined,
    });
  });

  it('should disable country select when no region selected', () => {
    const { getByLabelText } = render(
      <GeographicalSelect onChange={() => {}} />
    );

    expect(getByLabelText('Country')).toBeDisabled();
  });
});
```

## Best Practices

1. **Data Consistency**
   - Always validate geographical relationships
   - Maintain referential integrity
   - Handle cascading updates properly

2. **User Experience**
   - Use cascading selects for geographical data
   - Provide clear validation feedback
   - Show geographical information consistently

3. **Performance**
   - Cache geographical data where appropriate
   - Use efficient queries for geographical lookups
   - Implement proper indexing strategies

4. **Testing**
   - Test geographical validation thoroughly
   - Verify cascading updates work correctly
   - Test UI components with various data combinations
