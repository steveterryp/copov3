import { NextRequest, NextResponse } from "next/server"
import { reorderPhasesHandler } from "@/lib/pov/handlers/put"
import { handleApiError } from "@/lib/api-handler"

interface RouteParams {
  params: {
    povId: string
  }
}

interface ReorderRequest {
  phases: {
    id: string
    order: number
  }[]
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const data = (await req.json()) as ReorderRequest

    if (!Array.isArray(data.phases)) {
      return new NextResponse(
        JSON.stringify({
          error: {
            message: "phases must be an array",
            code: "BAD_REQUEST",
          },
        }),
        { status: 400 }
      )
    }

    await reorderPhasesHandler(req, { params })
    return NextResponse.json({ message: 'Phases reordered successfully' })
  } catch (error) {
    console.error('[Phase Reorder Error]:', error)
    return handleApiError(error)
  }
}
