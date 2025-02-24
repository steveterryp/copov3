import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { geographicalService } from '@/lib/services/geographicalService';
import { ApiError } from '@/lib/errors';
import { SalesTheatre } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { theatre: string } }
) {
  try {
    // Verify authentication
    const user = await getAuthUser(request);
    if (!user) {
      throw new ApiError('UNAUTHORIZED', 'Unauthorized');
    }

    const { theatre } = params;
    if (!theatre) {
      throw new ApiError('BAD_REQUEST', 'Theatre is required');
    }

    // Validate theatre
    if (!Object.values(SalesTheatre).includes(theatre as SalesTheatre)) {
      throw new ApiError('BAD_REQUEST', 'Invalid theatre');
    }

    // Get countries by theatre
    const countries = await geographicalService.getCountriesByTheatre(theatre as SalesTheatre);

    // Map countries to a simpler format
    const mappedCountries = countries.map(country => ({
      id: country.id,
      name: country.name,
      code: country.code,
      theatre: country.theatre,
      regions: country.regions.map(region => ({
        id: region.id,
        name: region.name,
        type: region.type,
      })),
    }));

    return NextResponse.json(mappedCountries);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    console.error('Error fetching countries by theatre:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
