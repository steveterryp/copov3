import { NextRequest, NextResponse } from "next/server"
import { getPoVHandler, getPoVListHandler } from "@/lib/pov/handlers/get"
import { deletePoVHandler } from "@/lib/pov/handlers/delete"
import { updatePoVHandler } from "@/lib/pov/handlers/put"
import { handleApiError } from "@/lib/api-handler"

interface RouteParams {
  params: {
    povId: string
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // getPoVHandler now returns the POV data directly
    const pov = await getPoVHandler(req, { params });
    
    // Use NextResponse.json to create a proper JSON response
    return NextResponse.json(pov, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('[PoV Get Error]:', error)
    return handleApiError(error)
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const response = await updatePoVHandler(req, { params })
    return NextResponse.json(response)
  } catch (error) {
    console.error('[PoV Update Error]:', error)
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await deletePoVHandler(req, { params })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[PoV Delete Error]:', error)
    return handleApiError(error)
  }
}
