import { Prisma } from '@prisma/client';
import { PoVResponse, KPIResponse } from '../types/core';
import { PhaseWithTemplate } from '../types/phase';

export const mapPoVToResponse = (pov: any): PoVResponse => ({
  id: pov.id,
  title: pov.title,
  description: pov.description,
  status: pov.status,
  priority: pov.priority,
  startDate: pov.startDate,
  endDate: pov.endDate,
  ownerId: pov.ownerId,
  teamId: pov.teamId,
  metadata: pov.metadata,
  createdAt: pov.createdAt,
  updatedAt: pov.updatedAt,
  team: pov.team ? { id: pov.team.id, name: pov.team.name } : null,
  owner: pov.owner ? { id: pov.owner.id, name: pov.owner.name, email: pov.owner.email } : undefined,
  phases: pov.phases?.map(mapPhaseToResponse) || []
});

export const mapKPIToDomain = (kpi: any): KPIResponse => ({
  id: kpi.id,
  povId: kpi.povId,
  templateId: kpi.templateId,
  name: kpi.name,
  target: kpi.target,
  current: kpi.current,
  history: kpi.history || [],
  weight: kpi.weight,
  createdAt: kpi.createdAt,
  updatedAt: kpi.updatedAt,
  template: kpi.template ? {
    id: kpi.template.id,
    name: kpi.template.name,
    type: kpi.template.type,
    calculation: kpi.template.calculation,
    visualization: kpi.template.visualization
  } : null
});

export const mapPhaseToResponse = (phase: any): PhaseWithTemplate => ({
  id: phase.id,
  name: phase.name,
  description: phase.description,
  type: phase.type,
  startDate: phase.startDate,
  endDate: phase.endDate,
  order: phase.order,
  povId: phase.povId,
  templateId: phase.templateId,
  details: {
    ...phase.details,
    tasks: phase.tasks || []
  },
  createdAt: phase.createdAt,
  updatedAt: phase.updatedAt,
  template: phase.template || null
});
