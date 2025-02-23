import { NextRequest, NextResponse } from "next/server"
import { getPhaseHandler } from "@/lib/pov/handlers/get"
import { updatePhaseHandler } from "@/lib/pov/handlers/put"
import { deletePhaseHandler } from "@/lib/pov/handlers/delete"
import { handleApiError } from "@/lib/api-handler"

interface RouteParams {
  params: {
    povId: string
    phaseId: string
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const response = await getPhaseHandler(req, { params })
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Phase Get Error]:', error)
    return handleApiError(error)
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const response = await updatePhaseHandler(req, { params })
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Phase Update Error]:', error)
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const response = await deletePhaseHandler(req, { params })
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Phase Delete Error]:', error)
    return handleApiError(error)
  }
}
