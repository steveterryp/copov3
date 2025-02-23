import { NextRequest, NextResponse } from "next/server"
import { deleteMultiplePhasesHandler } from "@/lib/pov/handlers/delete"
import { handleApiError } from "@/lib/api-handler"

interface RouteParams {
  params: {
    povId: string
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { phaseIds } = await req.json()

    if (!Array.isArray(phaseIds)) {
      return new NextResponse(
        JSON.stringify({
          error: {
            message: "phaseIds must be an array",
            code: "BAD_REQUEST",
          },
        }),
        { status: 400 }
      )
    }

    await deleteMultiplePhasesHandler(req, { params })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[Multiple Phase Delete Error]:', error)
    return handleApiError(error)
  }
}
