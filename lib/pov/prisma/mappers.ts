import { PoVResponse, PoVDetails } from '../types/core';
import { Phase, PhaseTemplate } from '@prisma/client';
import { PhaseWithTemplate, PhaseDetails } from '../types/phase';
import { KPIResponse } from '../types/kpi';

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
  salesTheatre: pov.salesTheatre,
  countryId: pov.countryId,
  regionId: pov.regionId,
  metadata: pov.metadata,
  createdAt: pov.createdAt,
  updatedAt: pov.updatedAt,
  team: pov.team ? {
    id: pov.team.id,
    name: pov.team.name,
  } : null,
  owner: pov.owner ? {
    id: pov.owner.id,
    name: pov.owner.name,
    email: pov.owner.email,
  } : undefined,
  country: pov.country ? {
    id: pov.country.id,
    name: pov.country.name,
    code: pov.country.code,
  } : undefined,
  region: pov.region ? {
    id: pov.region.id,
    name: pov.region.name,
    type: pov.region.type,
  } : null,
  phases: pov.phases,
});

export const mapPhaseToResponse = (
  phase: Phase & { 
    template?: PhaseTemplate;
    details: PhaseDetails;
  }
): PhaseWithTemplate => ({
  ...phase,
  template: phase.template,
  details: phase.details || { tasks: [], metadata: {} },
});

export const mapKPIToDomain = (kpi: any): KPIResponse => ({
  id: kpi.id,
  povId: kpi.povId,
  templateId: kpi.templateId,
  name: kpi.name,
  target: kpi.target as any,
  current: kpi.current as any,
  weight: kpi.weight,
  createdAt: kpi.createdAt,
  updatedAt: kpi.updatedAt,
  template: kpi.template ? {
    id: kpi.template.id,
    name: kpi.template.name,
    type: kpi.template.type,
    calculation: kpi.template.calculation,
    visualization: kpi.template.visualization,
  } : null,
  history: kpi.history || [],
});
