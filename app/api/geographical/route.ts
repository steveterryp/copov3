import { NextRequest, NextResponse } from 'next/server';
import { geographicalService } from '@/lib/services/geographicalService';
import { handleApiError } from '@/lib/api-handler';

export async function GET(req: NextRequest) {
  try {
    const regions = await geographicalService.getRegions();
    return NextResponse.json(regions);
  } catch (error) {
    return handleApiError(error);
  }
}
