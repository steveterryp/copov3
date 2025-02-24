import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SalesTheatre } from '@prisma/client';

// Define RegionType locally to match schema
type RegionType = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' | 'CENTRAL';

// Define response types
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

export async function GET(
  request: Request,
  { params }: { params: { theatre: string } }
) {
  console.log('[Geographical API] Getting countries by theatre:', params.theatre);
  try {
    const theatre = params.theatre as SalesTheatre;
    console.log('[Geographical API] Parsed theatre:', theatre);
    if (!Object.values(SalesTheatre).includes(theatre)) {
      return NextResponse.json(
        { error: 'Invalid theatre' },
        { status: 400 }
      );
    }

    const countries = await prisma.$queryRaw<CountryWithRegions[]>`
      SELECT 
        c.*,
        COALESCE(
          json_agg(
            CASE WHEN r.id IS NOT NULL THEN
              json_build_object(
                'id', r.id,
                'name', r.name,
                'type', r.type
              )
            END
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) as regions
      FROM "Country" c
      LEFT JOIN "Region" r ON r."countryId" = c.id
      WHERE c.theatre = ${theatre}::text::"SalesTheatre"
      GROUP BY c.id
      ORDER BY c.name ASC
    `;

    console.log('[Geographical API] Found countries:', countries);
    return NextResponse.json(countries);
  } catch (error) {
    console.error('[Geographical API] Error fetching countries by theatre:', error, {
      params,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
