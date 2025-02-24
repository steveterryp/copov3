import { PrismaClient, SalesTheatre, Region, Country, POV } from '@prisma/client';
import { z } from 'zod';
import { BaseValidator } from '../validation/base';
import { prisma } from '../prisma';

// Define RegionType locally to match schema
type RegionType = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTRAL';

// Types
export interface PoVGeographicalData {
  salesTheatre: SalesTheatre;
  countryId: string;
  regionId?: string;
}

interface RegionResponse {
  id: string;
  name: string;
  type: RegionType;
}

interface CountryWithRegions {
  id: string;
  name: string;
  code: string;
  theatre: SalesTheatre;
  createdAt: Date;
  updatedAt: Date;
  regions: RegionResponse[];
}

// Validation
const povGeographicalSchema = z.object({
  salesTheatre: z.enum(['NORTH_AMERICA', 'LAC', 'EMEA', 'APJ']),
  countryId: z.string(),
  regionId: z.string().optional(),
}) satisfies z.ZodType<PoVGeographicalData>;

export class PoVGeographicalValidator extends BaseValidator<PoVGeographicalData> {
  constructor() {
    super(povGeographicalSchema);
  }

  async validateGeographicalConsistency(data: PoVGeographicalData): Promise<boolean> {
    if (!data.regionId) {
      return true;
    }

    const region = await prisma.$queryRaw<Region[]>`
      SELECT * FROM "Region"
      WHERE id = ${data.regionId}
      AND "countryId" = ${data.countryId}
    `;

    return region.length > 0;
  }
}

// Service Implementation
export class GeographicalService {
  private validator: PoVGeographicalValidator;

  constructor(private prisma: PrismaClient) {
    this.validator = new PoVGeographicalValidator();
  }

  // Region Operations
  async getRegions(): Promise<Region[]> {
    return this.prisma.$queryRaw<Region[]>`
      SELECT r.*, c.name as country_name
      FROM "Region" r
      LEFT JOIN "Country" c ON r."countryId" = c.id
      ORDER BY r.name ASC
    `;
  }

  // Country Operations
  async getCountriesByRegion(regionId: string): Promise<CountryWithRegions[]> {
    return this.prisma.$queryRaw<CountryWithRegions[]>`
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'id', r.id,
            'name', r.name,
            'type', r.type
          )
        ) as regions
      FROM "Country" c
      LEFT JOIN "Region" r ON r."countryId" = c.id
      WHERE r.id = ${regionId}
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
  }

  async getCountriesByTheatre(theatre: SalesTheatre): Promise<CountryWithRegions[]> {
    return this.prisma.$queryRaw<CountryWithRegions[]>`
      SELECT 
        c.*,
        json_agg(
          json_build_object(
            'id', r.id,
            'name', r.name,
            'type', r.type
          )
        ) as regions
      FROM "Country" c
      LEFT JOIN "Region" r ON r."countryId" = c.id
      WHERE c.theatre = ${theatre}::text::"SalesTheatre"
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
  }

  // PoV Geographical Operations
  async updatePoVGeography(
    poVId: string,
    data: PoVGeographicalData
  ): Promise<POV> {
    // Validate data
    await this.validator.validateData(data);

    // Validate geographical consistency
    if (data.regionId) {
      const isValid = await this.validator.validateGeographicalConsistency(data);
      if (!isValid) {
        throw new Error('Invalid geographical combination: region does not belong to specified country');
      }
    }

    return this.prisma.pOV.update({
      where: { id: poVId },
      data,
      include: {
        country: true,
        region: true,
      },
    });
  }

  // Analytics Operations
  async getGeographicalDistribution(): Promise<{
    byTheatre: Record<SalesTheatre, number>;
    byRegion: Record<string, { name: string; count: number }>;
    byCountry: Record<string, { name: string; count: number }>;
  }> {
    const [theatreStats, regionStats, countryStats] = await Promise.all([
      // Get PoV count by theatre
      this.prisma.$queryRaw<{ theatre: SalesTheatre; count: number }[]>`
        SELECT theatre, COUNT(*) as count
        FROM "POV"
        GROUP BY theatre
      `,

      // Get PoV count by region
      this.prisma.$queryRaw<{ id: string; name: string; count: number }[]>`
        SELECT r.id, r.name, COUNT(p.id) as count
        FROM "Region" r
        LEFT JOIN "POV" p ON p."regionId" = r.id
        GROUP BY r.id, r.name
      `,

      // Get PoV count by country
      this.prisma.$queryRaw<{ id: string; name: string; count: number }[]>`
        SELECT c.id, c.name, COUNT(p.id) as count
        FROM "Country" c
        LEFT JOIN "POV" p ON p."countryId" = c.id
        GROUP BY c.id, c.name
      `,
    ]);

    return {
      byTheatre: theatreStats.reduce((acc, stat) => {
        acc[stat.theatre] = Number(stat.count);
        return acc;
      }, {} as Record<SalesTheatre, number>),

      byRegion: regionStats.reduce((acc, region) => {
        acc[region.id] = {
          name: region.name,
          count: Number(region.count),
        };
        return acc;
      }, {} as Record<string, { name: string; count: number }>),

      byCountry: countryStats.reduce((acc, country) => {
        acc[country.id] = {
          name: country.name,
          count: Number(country.count),
        };
        return acc;
      }, {} as Record<string, { name: string; count: number }>),
    };
  }
}

// Export singleton instance
export const geographicalService = new GeographicalService(prisma);
