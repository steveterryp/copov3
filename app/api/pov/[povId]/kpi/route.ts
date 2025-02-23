import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/middleware/auth'
import { ResourceAction, ResourceType } from '@/lib/types/auth'
import { kpiService } from '@/lib/pov/services/kpi'
import type { 
  KPITemplateCreateInput, 
  KPITemplateUpdateInput,
  KPICreateInput,
  KPIUpdateInput,
  KPIResponse,
  KPICalculationResult
} from '@/lib/pov/types/kpi'
import type { KPITemplate } from '@prisma/client'

const getPovId = async (req: NextRequest) => {
  const url = new URL(req.url)
  const segments = url.pathname.split('/')
  const povId = segments.find((s, i) => segments[i - 1] === 'pov' && s !== '[povId]')
  if (!povId) throw new Error('PoV ID not found')
  return povId
}

export const GET = requirePermission(
  ResourceAction.VIEW,
  ResourceType.PoV,
  getPovId
)(async (req: NextRequest) => {
  const url = new URL(req.url)
  const povId = await getPovId(req)
  const type = url.searchParams.get('type')
  const kpiId = url.searchParams.get('kpiId')

  if (type === 'templates') {
    const templates = await kpiService.getTemplates()
    return NextResponse.json({ data: templates })
  }

  if (kpiId) {
    const kpi = await kpiService.getKPI(kpiId)
    if (!kpi) {
      return NextResponse.json(
        { error: 'KPI not found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: kpi })
  }

  const kpis = await kpiService.getPOVKPIs(povId)
  return NextResponse.json({ data: kpis })
})

export const POST = requirePermission(
  ResourceAction.EDIT,
  ResourceType.PoV,
  getPovId
)(async (req: NextRequest) => {
  const url = new URL(req.url)
  const povId = await getPovId(req)
  const type = url.searchParams.get('type')
  const body = await req.json()

  if (type === 'template') {
    const data = body as KPITemplateCreateInput
    const template = await kpiService.createTemplate(data)
    return NextResponse.json({ data: template })
  }

  // Default: create KPI
  const { templateId, ...kpiData } = body
  const kpi = await kpiService.createKPI(povId, templateId, kpiData as KPICreateInput)
  return NextResponse.json({ data: kpi })
})

export const PUT = requirePermission(
  ResourceAction.EDIT,
  ResourceType.PoV,
  getPovId
)(async (req: NextRequest) => {
  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const id = url.searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'ID is required' },
      { status: 400 }
    )
  }

  if (type === 'template') {
    const data = await req.json() as KPITemplateUpdateInput
    const template = await kpiService.updateTemplate(id, data)
    return NextResponse.json({ data: template })
  }

  if (type === 'calculate') {
    const result = await kpiService.calculateKPI(id)
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to calculate KPI' },
        { status: 400 }
      )
    }
    return NextResponse.json({ data: result })
  }

  // Default: update KPI
  const data = await req.json() as KPIUpdateInput
  const kpi = await kpiService.updateKPI(id, data)
  return NextResponse.json({ data: kpi })
})

export const DELETE = requirePermission(
  ResourceAction.DELETE,
  ResourceType.PoV,
  getPovId
)(async (req: NextRequest) => {
  const url = new URL(req.url)
  const type = url.searchParams.get('type')
  const id = url.searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'ID is required' },
      { status: 400 }
    )
  }

  if (type === 'template') {
    await kpiService.deleteTemplate(id)
  } else {
    await kpiService.deleteKPI(id)
  }

  return NextResponse.json({ data: { success: true } })
})
