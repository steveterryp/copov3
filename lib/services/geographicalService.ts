import { PrismaClient, SalesTheatre, Region, Country, POV } from '@prisma/client';
import { z } from 'zod';
import { BaseValidator } from '../validation/base';
import { prisma } from '../prisma';

// Types
export interface PoVGeographicalData {
  salesTheatre?: SalesTheatre;
  countryId?: string;
  regionId?: string;
}

// Validation
export class PoVGeographicalValidator extends BaseValidator<PoVGeographicalData> {
  constructor() {
    super(
      z.object({
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

  async validateGeographicalConsistency(data: PoVGeographicalData): Promise<boolean> {
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

  async getCountryWithRegion(countryId: string): Promise<Country | null> {
    return this.prisma.country.findUnique({
      where: { id: countryId },
      include: { region: true },
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
    if (data.countryId && data.regionId) {
      const isValid = await this.validator.validateGeographicalConsistency(data);
      if (!isValid) {
        throw new Error('Invalid geographical combination: country does not belong to specified region');
      }
    }

    // If country is cleared, also clear region
    if (data.countryId === undefined) {
      data.regionId = undefined;
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
      this.prisma.pOV.groupBy({
        by: ['salesTheatre'],
        _count: true,
      }),

      // Get PoV count by region
      this.prisma.region.findMany({
        include: {
          _count: {
            select: { povs: true },
          },
        },
      }),

      // Get PoV count by country
      this.prisma.country.findMany({
        include: {
          _count: {
            select: { povs: true },
          },
        },
      }),
    ]);

    return {
      byTheatre: theatreStats.reduce((acc, stat) => {
        if (stat.salesTheatre) {
          acc[stat.salesTheatre] = stat._count;
        }
        return acc;
      }, {} as Record<SalesTheatre, number>),

      byRegion: regionStats.reduce((acc, region) => {
        acc[region.id] = {
          name: region.name,
          count: region._count.povs,
        };
        return acc;
      }, {} as Record<string, { name: string; count: number }>),

      byCountry: countryStats.reduce((acc, country) => {
        acc[country.id] = {
          name: country.name,
          count: country._count.povs,
        };
        return acc;
      }, {} as Record<string, { name: string; count: number }>),
    };
  }
}

// Export singleton instance
export const geographicalService = new GeographicalService(prisma);
