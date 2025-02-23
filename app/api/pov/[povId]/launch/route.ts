import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/middleware/auth'
import { ResourceAction, ResourceType, UserRole } from '@/lib/types/auth'
import { launchService } from '@/lib/pov/services/launch'
import { checkPermission } from '@/lib/auth/permissions'
import type { 
  LaunchStatusResponse, 
  LaunchChecklistUpdate,
  LaunchValidation
} from '@/lib/pov/types/launch'
import type { POVLaunch } from '@prisma/client'

const getPoVId = async (req: NextRequest) => {
  const url = new URL(req.url)
  const segments = url.pathname.split('/')
  const povId = segments.find((s, i) => segments[i - 1] === 'pov' && s !== '[povId]')
  if (!povId) throw new Error('PoV ID not found')
  return povId
}

export const GET = requirePermission(
  ResourceAction.VIEW,
  ResourceType.PoV,
  getPoVId
)(async (req: NextRequest) => {
  const poVId = await getPoVId(req)
  const status = await launchService.getLaunchStatus(poVId)
  return NextResponse.json({ data: status })
})

export const POST = requirePermission(
  ResourceAction.EDIT,
  ResourceType.PoV,
  getPoVId
)(async (req: NextRequest) => {
  const poVId = await getPoVId(req)
  const launch = await launchService.initiateLaunch(poVId)
  return NextResponse.json({ data: launch })
})

export const PUT = requirePermission(
  ResourceAction.EDIT,
  ResourceType.PoV,
  getPoVId
)(async (req: NextRequest) => {
  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const launchId = url.searchParams.get('launchId')

  if (!launchId) {
    return NextResponse.json(
      { error: 'Launch ID is required' },
      { status: 400 }
    )
  }

  if (type === 'validate') {
    const validation = await launchService.validateLaunch(launchId)
    return NextResponse.json({ data: validation })
  }

  if (type === 'confirm') {
    // Get user from request headers (set by auth middleware)
    const userId = req.headers.get('x-user-id')
    const userRoleStr = req.headers.get('x-user-role')
    
    if (!userId || !userRoleStr) {
      return NextResponse.json(
        { error: 'User information not found' },
        { status: 401 }
      )
    }

    // Validate user role
    if (!(userRoleStr in UserRole)) {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 401 }
      )
    }

    // Check for approval permission
    const poVId = await getPoVId(req)
    const hasPermission = await checkPermission(
      { id: userId, role: userRoleStr as UserRole },
      { id: poVId, type: ResourceType.PoV },
      ResourceAction.APPROVE
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to confirm launch' },
        { status: 403 }
      )
    }

    const launch = await launchService.confirmLaunch(launchId, userId)
    return NextResponse.json({ data: launch })
  }

  // Default: update checklist
  const updates = await req.json() as LaunchChecklistUpdate[]
  const launch = await launchService.updateLaunchChecklist(launchId, updates)
  return NextResponse.json({ data: launch })
})
