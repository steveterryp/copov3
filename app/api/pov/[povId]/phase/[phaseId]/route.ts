import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth/get-auth-user"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { povId: string; phaseId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { povId, phaseId } = params

    // Check if the POV exists
    const pov = await prisma.pOV.findUnique({
      where: { id: povId },
    })

    if (!pov) {
      return NextResponse.json({ error: "POV not found" }, { status: 404 })
    }

    // Check if the user has access to the POV
    if (pov.ownerId !== user.userId && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the phase
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        template: true,
      },
    })

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 })
    }

    // Check if the phase belongs to the POV
    if (phase.povId !== povId) {
      return NextResponse.json({ error: "Phase not found in this POV" }, { status: 404 })
    }

    return NextResponse.json({ phase })
  } catch (error) {
    console.error("[Phase API Error]:", error)
    return NextResponse.json(
      { error: "Failed to fetch phase" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { povId: string; phaseId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { povId, phaseId } = params
    const data = await request.json()

    // Check if the POV exists
    const pov = await prisma.pOV.findUnique({
      where: { id: povId },
    })

    if (!pov) {
      return NextResponse.json({ error: "POV not found" }, { status: 404 })
    }

    // Check if the user has access to the POV
    if (pov.ownerId !== user.userId && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the phase exists
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
    })

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 })
    }

    // Check if the phase belongs to the POV
    if (phase.povId !== povId) {
      return NextResponse.json({ error: "Phase not found in this POV" }, { status: 404 })
    }

    // Update the phase
    const updatedPhase = await prisma.phase.update({
      where: { id: phaseId },
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        type: data.type,
        details: data.details,
      },
      include: {
        template: true,
      },
    })

    return NextResponse.json({ phase: updatedPhase })
  } catch (error) {
    console.error("[Phase API Error]:", error)
    return NextResponse.json(
      { error: "Failed to update phase" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { povId: string; phaseId: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { povId, phaseId } = params

    // Check if the POV exists
    const pov = await prisma.pOV.findUnique({
      where: { id: povId },
    })

    if (!pov) {
      return NextResponse.json({ error: "POV not found" }, { status: 404 })
    }

    // Check if the user has access to the POV
    if (pov.ownerId !== user.userId && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the phase exists
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
    })

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 })
    }

    // Check if the phase belongs to the POV
    if (phase.povId !== povId) {
      return NextResponse.json({ error: "Phase not found in this POV" }, { status: 404 })
    }

    // Delete the phase
    await prisma.phase.delete({
      where: { id: phaseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Phase API Error]:", error)
    return NextResponse.json(
      { error: "Failed to delete phase" },
      { status: 500 }
    )
  }
}
