import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/middleware/auth'
import { ResourceAction, ResourceType } from '@/lib/types/auth'
import { crmService } from '@/lib/pov/services/crm'
import type { 
  CRMFieldMappingCreateInput, 
  CRMFieldMappingUpdateInput,
  CRMSyncResult 
} from '@/lib/pov/types/crm'
import type { CRMFieldMapping, CRMSyncHistory } from '@prisma/client'

const getPoVId = async (req: NextRequest) => {
  const url = new URL(req.url)
  const segments = url.pathname.split('/')
  const poVId = segments.find((s, i) => segments[i - 1] === 'pov' && s !== '[povId]')
  if (!poVId) throw new Error('PoV ID not found')
  return poVId
}

export const GET = requirePermission(
  ResourceAction.VIEW,
  ResourceType.PoV,
  getPoVId
)(async (req: NextRequest) => {
  const url = new URL(req.url)
  const poVId = await getPoVId(req)
  const type = url.searchParams.get('type')

  if (type === 'history') {
    const history = await crmService.getSyncHistory(poVId)
    return NextResponse.json({ data: history })
  }

  const lastSync = await crmService.getLastSync(poVId)
  const fieldMappings = await crmService.getFieldMapping()

  return NextResponse.json({
    data: {
      lastSync,
      fieldMappings
    }
  })
})

export const POST = requirePermission(
  ResourceAction.EDIT,
  ResourceType.PoV,
  getPoVId
)(async (req: NextRequest) => {
  const url = new URL(req.url)
  const poVId = await getPoVId(req)
  const type = url.searchParams.get('type')

  if (type === 'mapping') {
    const data = await req.json() as CRMFieldMappingCreateInput
    const mapping = await crmService.createFieldMapping(data)
    return NextResponse.json({ data: mapping })
  }

  // Default: trigger sync
  const result = await crmService.syncPoV(poVId)
  return NextResponse.json({ data: result })
})

export const PUT = requirePermission(
  ResourceAction.EDIT,
  ResourceType.PoV,
  getPoVId
)(async (req: NextRequest) => {
  const url = new URL(req.url)
  const mappingId = url.searchParams.get('mappingId')

  if (!mappingId) {
    return NextResponse.json(
      { error: 'Mapping ID is required' },
      { status: 400 }
    )
  }

  const data = await req.json() as CRMFieldMappingUpdateInput
  const mapping = await crmService.updateFieldMapping(mappingId, data)
  return NextResponse.json({ data: mapping })
})

export const DELETE = requirePermission(
  ResourceAction.DELETE,
  ResourceType.PoV,
  getPoVId
)(async (req: NextRequest) => {
  const url = new URL(req.url)
  const mappingId = url.searchParams.get('mappingId')

  if (!mappingId) {
    return NextResponse.json(
      { error: 'Mapping ID is required' },
      { status: 400 }
    )
  }

  await crmService.deleteFieldMapping(mappingId)
  return NextResponse.json({ data: { success: true } })
})
