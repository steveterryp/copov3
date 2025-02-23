import { NextRequest, NextResponse } from 'next/server';
import { geographicalService } from '@/lib/services/geographicalService';
import { handleApiError } from '@/lib/api-handler';

interface RouteParams {
  params: {
    regionId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { regionId } = params;
    const countries = await geographicalService.getCountriesByRegion(regionId);
    return NextResponse.json(countries);
  } catch (error) {
    return handleApiError(error);
  }
}
