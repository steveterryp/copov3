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

    const region = await prisma.region.findFirst({
      where: {
        id: data.regionId,
        countryId: data.countryId
      }
    });

    return region !== null;
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
    return this.prisma.region.findMany({
      include: {
        country: true
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  // Country Operations
  async getCountriesByRegion(regionId: string): Promise<CountryWithRegions[]> {
    const region = await this.prisma.region.findUnique({
      where: { id: regionId },
      include: {
        country: {
          include: {
            regions: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    });

    return region ? [region.country] : [];
  }

  async getCountriesByTheatre(theatre: SalesTheatre): Promise<CountryWithRegions[]> {
    return this.prisma.country.findMany({
      where: { theatre },
      include: {
        regions: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
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
    const [povs, regions, countries] = await Promise.all([
      this.prisma.pOV.groupBy({
        by: ['salesTheatre'],
        _count: true
      }),
      this.prisma.region.findMany({
        include: {
          _count: {
            select: {
              povs: true
            }
          }
        }
      }),
      this.prisma.country.findMany({
        include: {
          _count: {
            select: {
              povs: true
            }
          }
        }
      })
    ]);

    return {
      byTheatre: povs.reduce((acc, stat) => {
        acc[stat.salesTheatre] = stat._count;
        return acc;
      }, {} as Record<SalesTheatre, number>),

      byRegion: regions.reduce((acc, region) => {
        acc[region.id] = {
          name: region.name,
          count: region._count.povs
        };
        return acc;
      }, {} as Record<string, { name: string; count: number }>),

      byCountry: countries.reduce((acc, country) => {
        acc[country.id] = {
          name: country.name,
          count: country._count.povs
        };
        return acc;
      }, {} as Record<string, { name: string; count: number }>)
    };
  }
}

// Export singleton instance
export const geographicalService = new GeographicalService(prisma);
