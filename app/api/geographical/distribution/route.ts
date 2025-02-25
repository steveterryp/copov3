import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { geographicalService } from '@/lib/services/geographicalService';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const distribution = await geographicalService.getGeographicalDistribution();
    return NextResponse.json(distribution);
  } catch (error) {
    console.error('[Geographical Distribution API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geographical distribution' },
      { status: 500 }
    );
  }
}
