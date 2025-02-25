import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { geographicalService } from '@/lib/services/geographicalService';
import { ApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAuthUser(request);
    if (!user) {
      throw new ApiError('UNAUTHORIZED', 'Unauthorized');
    }

    // Get all countries
    const countries = await geographicalService.getAllCountries();

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
    
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
