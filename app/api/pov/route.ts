import { NextRequest, NextResponse } from 'next/server';
import { createPoVHandler } from '@/lib/pov/handlers/post';
import { getPoVListHandler } from '@/lib/pov/handlers/get';
import { handleApiError } from '@/lib/api-handler';

export async function GET(request: NextRequest) {
  try {
    const result = await getPoVListHandler(request);
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('[POV List Error]:', error);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await createPoVHandler(request, { params: {} });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('[POV Create Error]:', error);
    return handleApiError(error);
  }
}
