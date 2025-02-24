import { prisma } from '../../../lib/prisma';
import { 
  KPITemplateCreateInput, 
  KPITemplateUpdateInput, 
  KPICalculationContext, 
  KPICalculationResult,
  KPITarget,
  KPIHistoryEntry,
  KPICreateInput,
  KPIUpdateInput,
  KPIVisualization,
  SerializedKPITarget
} from '../types/kpi';
import { povService } from './pov';
import { kpiWithTemplate, fullKPI } from '../prisma/select';
import { mapKPIToDomain } from '../prisma/mappers';
import { Prisma } from '@prisma/client';

class KPIService {
  private static instance: KPIService;

  private constructor() {}

  static getInstance(): KPIService {
    if (!KPIService.instance) {
      KPIService.instance = new KPIService();
    }
    return KPIService.instance;
  }

  async createTemplate(data: KPITemplateCreateInput) {
    return await prisma.kPITemplate.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isCustom: data.isCustom || false,
        defaultTarget: data.defaultTarget ? data.defaultTarget : {},
        calculation: data.calculation,
        visualization: data.visualization
      }
    });
  }

  async updateTemplate(id: string, data: KPITemplateUpdateInput) {
    const updateData: Prisma.KPITemplateUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type && { type: data.type }),
      ...(data.isCustom !== undefined && { isCustom: data.isCustom }),
      ...(data.defaultTarget !== undefined && { defaultTarget: data.defaultTarget || {} }),
      ...(data.calculation !== undefined && { calculation: data.calculation }),
      ...(data.visualization !== undefined && { visualization: data.visualization })
    };

    return await prisma.kPITemplate.update({
      where: { id },
      data: updateData
    });
  }

  async getTemplates() {
    return await prisma.kPITemplate.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async createKPI(povId: string, templateId: string | null, data: KPICreateInput) {
    const kpi = await prisma.pOVKPI.create({
      data: {
        povId,
        templateId,
        name: data.name,
        target: this.serializeKPITarget(data.target),
        current: data.current,
        weight: data.weight,
        history: []
      }
    });

    return mapKPIToDomain(kpi);
  }

  async updateKPI(id: string, data: KPIUpdateInput) {
    const updateData: Prisma.POVKPIUpdateInput = {
      ...(data.name && { name: data.name }),
      ...(data.target !== undefined && { target: this.serializeKPITarget(data.target) }),
      ...(data.current !== undefined && { current: data.current }),
      ...(data.weight !== undefined && { weight: data.weight })
    };

    const kpi = await prisma.pOVKPI.update({
      where: { id },
      data: updateData
    });

    return mapKPIToDomain(kpi);
  }

  private serializeKPITarget(target: KPITarget | undefined): Prisma.InputJsonValue {
    if (!target) return {};
    const serialized: SerializedKPITarget = {
      value: target.value,
      threshold: target.threshold ? {
        warning: target.threshold.warning,
        critical: target.threshold.critical
      } : undefined
    };
    return serialized;
  }

  async getKPIHistory(id: string): Promise<KPIHistoryEntry[]> {
    const kpi = await prisma.pOVKPI.findUnique({
      where: { id },
      select: { history: true }
    });

    const history = kpi?.history;
    if (!history || !Array.isArray(history)) {
      return [];
    }

    // Filter out invalid entries and map valid ones
    return history
      .filter(entry => 
        typeof entry === 'object' && 
        entry !== null && 
        'value' in entry && 
        'timestamp' in entry &&
        typeof entry.value === 'number' &&
        typeof entry.timestamp === 'string'
      )
      .map(entry => {
        const typedEntry = entry as { value: number; timestamp: string; metadata?: Record<string, any> };
        return {
          value: typedEntry.value,
          timestamp: typedEntry.timestamp,
          metadata: typedEntry.metadata
        };
      });
  }

  private async updateKPIHistory(id: string, historyEntry: KPIHistoryEntry) {
    // Use a transaction to handle concurrent updates
    await prisma.$transaction(async (tx) => {
      // Get current history within transaction
      const kpi = await tx.pOVKPI.findUnique({
        where: { id },
        select: { history: true }
      });

      const history = kpi?.history;
      const currentHistory = Array.isArray(history) ? history : [];

      // Add new entry
      const newEntry = {
        value: historyEntry.value,
        timestamp: historyEntry.timestamp,
        metadata: historyEntry.metadata || {}
      };
      currentHistory.push(newEntry);

      // Update within transaction
      await tx.pOVKPI.update({
        where: { id },
        data: {
          history: currentHistory
        }
      });
    });
  }

  async getKPI(id: string) {
    const kpi = await prisma.pOVKPI.findUnique({
      where: { id },
      include: {
        template: true,
        pov: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    if (!kpi) return null;

    const history = await this.getKPIHistory(id);
    return mapKPIToDomain({ ...kpi, history });
  }

  async getPOVKPIs(povId: string) {
    const kpis = await prisma.pOVKPI.findMany({
      where: { povId },
      include: {
        template: true,
        pov: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    const kpisWithHistory = await Promise.all(
      kpis.map(async (kpi: { id: string } & Record<string, any>) => ({
        ...kpi,
        history: await this.getKPIHistory(kpi.id)
      }))
    );

    return kpisWithHistory.map(mapKPIToDomain);
  }

  async calculateKPI(kpiId: string): Promise<KPICalculationResult | null> {
    const kpi = await this.getKPI(kpiId);
    if (!kpi || !kpi.template?.calculation) return null;

    try {
      // Get POV context
      const pov = await povService.get(kpi.povId);
      if (!pov) return null;

      // Create calculation context
      const context: KPICalculationContext = {
        pov: {
          id: pov.id,
          status: pov.status,
          startDate: pov.startDate,
          endDate: pov.endDate
        },
        current: kpi.current,
        target: kpi.target,
        history: kpi.history || []
      };

      // Execute calculation
      const calculateFn = new Function('context', kpi.template.calculation)();
      const value = calculateFn(context);

      // Create history entry
      const historyEntry: KPIHistoryEntry = {
        value,
        timestamp: new Date().toISOString(),
        metadata: { calculationContext: context }
      };

      // Update KPI with new value and history in a single transaction
      await prisma.$transaction(async (tx) => {
        // Update current value
        await tx.pOVKPI.update({
          where: { id: kpiId },
          data: {
            current: value
          }
        });

        // Get current history within transaction
        const kpi = await tx.pOVKPI.findUnique({
          where: { id: kpiId },
          select: { history: true }
        });

        const history = kpi?.history;
        const currentHistory = Array.isArray(history) ? history : [];

        // Add new entry
        const newEntry = {
          value: historyEntry.value,
          timestamp: historyEntry.timestamp,
          metadata: historyEntry.metadata || {}
        };
        currentHistory.push(newEntry);

        // Update history within transaction
        await tx.pOVKPI.update({
          where: { id: kpiId },
          data: {
            history: currentHistory
          }
        });
      });

      // Determine status based on thresholds
      const target = kpi.target as SerializedKPITarget;
      const status = this.determineKPIStatus(value, target);

      return {
        value,
        status,
        metadata: {
          calculatedAt: new Date().toISOString(),
          context
        }
      };

    } catch (error) {
      console.error('Error calculating KPI:', error);
      return null;
    }
  }

  private determineKPIStatus(
    value: number,
    target: SerializedKPITarget
  ): KPICalculationResult['status'] {
    const { threshold } = target;
    if (!threshold) return value >= target.value ? 'success' : 'warning';

    if (value <= threshold.critical) return 'critical';
    if (value <= threshold.warning) return 'warning';
    return 'success';
  }

  async parseVisualization(visualization: string): Promise<KPIVisualization | null> {
    try {
      return JSON.parse(visualization);
    } catch {
      return null;
    }
  }

  async deleteTemplate(id: string) {
    await prisma.kPITemplate.delete({
      where: { id }
    });
  }

  async deleteKPI(id: string) {
    await prisma.pOVKPI.delete({
      where: { id }
    });
  }
}

export const kpiService = KPIService.getInstance();
