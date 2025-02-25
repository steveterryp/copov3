# Phase 3: CRM Field Mapping Integration

## Overview

This phase focuses on integrating the template-based POV system with CRM functionality. It enhances the field mapping system, implements template-specific sync rules, updates the CRM sync service, and creates a CRM mapping configuration UI.

## Implementation Details

### 1. Enhanced Field Mapping

#### Extended Schema Definition

```json
// Extended JSON Schema with CRM field mappings
{
  "properties": {
    "fields": {
      "type": "object",
      "additionalProperties": {
        "properties": {
          "crm": {
            "type": "object",
            "description": "CRM integration settings for this field",
            "properties": {
              "field": {
                "type": "string",
                "description": "CRM field name to map to"
              },
              "required": {
                "type": "boolean",
                "description": "Whether this field is required for CRM sync"
              },
              "direction": {
                "type": "string",
                "enum": ["to_crm", "from_crm", "bidirectional"],
                "default": "bidirectional",
                "description": "Direction of data flow between local and CRM"
              },
              "transformer": {
                "type": "string",
                "description": "Name of transformer function to apply"
              }
            },
            "required": ["field"]
          }
        }
      }
    },
    "crmSync": {
      "type": "object",
      "description": "CRM sync configuration for the template",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": true,
          "description": "Whether CRM sync is enabled for this template"
        },
        "autoSync": {
          "type": "boolean",
          "default": false,
          "description": "Whether to automatically sync with CRM"
        },
        "interval": {
          "type": "integer",
          "minimum": 0,
          "description": "Auto-sync interval in minutes (0 = no auto-sync)"
        },
        "direction": {
          "type": "string",
          "enum": ["to_crm", "from_crm", "bidirectional"],
          "default": "bidirectional",
          "description": "Default direction of data flow"
        },
        "triggerEvents": {
          "type": "array",
          "description": "Events that trigger a sync",
          "items": {
            "type": "string",
            "enum": [
              "status.change",
              "milestone.complete",
              "phase.complete",
              "manual"
            ]
          }
        },
        "crmType": {
          "type": "string",
          "description": "CRM record type (e.g., 'Opportunity', 'Account')"
        }
      }
    }
  }
}
```

#### TypeScript Types for CRM Integration

```typescript
// lib/pov/templates/crm-types.ts
import { POVTemplate, FieldDefinition } from './types';

export type SyncDirection = 'to_crm' | 'from_crm' | 'bidirectional';

export type TriggerEvent = 
  | 'status.change'
  | 'milestone.complete'
  | 'phase.complete'
  | 'manual';

export interface CRMFieldConfig {
  field: string;
  required?: boolean;
  direction?: SyncDirection;
  transformer?: string;
}

export interface CRMSyncConfig {
  enabled?: boolean;
  autoSync?: boolean;
  interval?: number;
  direction?: SyncDirection;
  triggerEvents?: TriggerEvent[];
  crmType?: string;
}

export interface CRMTemplateConfig {
  syncConfig: CRMSyncConfig;
  fieldMappings: Record<string, CRMFieldConfig>;
}

export interface TransformerFunction {
  toCRM: (value: any, field: FieldDefinition) => any;
  fromCRM: (value: any, field: FieldDefinition) => any;
}

// Extract CRM configuration from a template
export function extractCRMConfig(template: POVTemplate): CRMTemplateConfig {
  const syncConfig: CRMSyncConfig = template.crmSync || {
    enabled: false,
    direction: 'bidirectional'
  };
  
  const fieldMappings: Record<string, CRMFieldConfig> = {};
  
  // Extract field mappings from template fields
  Object.entries(template.fields).forEach(([fieldId, field]) => {
    if (field.crm) {
      fieldMappings[fieldId] = field.crm;
    }
  });
  
  return {
    syncConfig,
    fieldMappings
  };
}
```

#### Bidirectional Field Transformers

```typescript
// lib/pov/templates/transformers.ts
import { FieldDefinition } from './types';
import { TransformerFunction } from './crm-types';

// Registry of transformer functions
const transformers: Record<string, TransformerFunction> = {};

/**
 * Register a transformer function
 */
export function registerTransformer(name: string, transformer: TransformerFunction): void {
  transformers[name] = transformer;
}

/**
 * Get a transformer by name
 */
export function getTransformer(name: string): TransformerFunction | null {
  return transformers[name] || null;
}

/**
 * Apply a transformer to a value
 */
export function applyTransformer(
  name: string,
  value: any,
  field: FieldDefinition,
  direction: 'toCRM' | 'fromCRM'
): any {
  const transformer = getTransformer(name);
  if (!transformer) {
    return value;
  }
  
  return direction === 'toCRM' 
    ? transformer.toCRM(value, field)
    : transformer.fromCRM(value, field);
}

// Register default transformers
registerTransformer('dateTransformer', {
  toCRM: (value, _field) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  },
  fromCRM: (value, _field) => {
    if (!value) return null;
    return new Date(value);
  }
});

registerTransformer('booleanTransformer', {
  toCRM: (value, _field) => {
    return Boolean(value);
  },
  fromCRM: (value, _field) => {
    return Boolean(value);
  }
});

registerTransformer('numberTransformer', {
  toCRM: (value, _field) => {
    return typeof value === 'number' ? value : parseFloat(value);
  },
  fromCRM: (value, _field) => {
    return typeof value === 'number' ? value : parseFloat(value);
  }
});

registerTransformer('stringTransformer', {
  toCRM: (value, _field) => {
    return value ? String(value) : '';
  },
  fromCRM: (value, _field) => {
    return value ? String(value) : '';
  }
});

registerTransformer('arrayTransformer', {
  toCRM: (value, _field) => {
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  },
  fromCRM: (value, _field) => {
    if (Array.isArray(value)) {
      return value;
    }
    return value ? [value] : [];
  }
});

registerTransformer('picklistTransformer', {
  toCRM: (value, field) => {
    // For select fields, ensure the value is in the options
    if (field.type === 'select' && field.validation?.options) {
      const option = field.validation.options.find(opt => opt.value === value);
      return option ? option.value : null;
    }
    return value;
  },
  fromCRM: (value, field) => {
    // For select fields, ensure the value is in the options
    if (field.type === 'select' && field.validation?.options) {
      const option = field.validation.options.find(opt => opt.value === value);
      return option ? option.value : null;
    }
    return value;
  }
});

registerTransformer('currencyTransformer', {
  toCRM: (value, _field) => {
    if (typeof value === 'string') {
      // Remove currency symbols and commas
      return parseFloat(value.replace(/[^0-9.-]+/g, ''));
    }
    return value;
  },
  fromCRM: (value, _field) => {
    return typeof value === 'number' ? value : parseFloat(value);
  }
});
```

### 2. Template-Specific Sync Rules

#### Template CRM Sync Service

```typescript
// lib/pov/templates/crm-sync.ts
import { POVTemplate, FieldDefinition } from './types';
import { CRMTemplateConfig, extractCRMConfig, SyncDirection } from './crm-types';
import { applyTransformer } from './transformers';
import { crmService } from '../services/crm';
import { ApiError } from '@/lib/errors';

export class TemplateCRMSync {
  private static instance: TemplateCRMSync;

  private constructor() {}

  public static getInstance(): TemplateCRMSync {
    if (!TemplateCRMSync.instance) {
      TemplateCRMSync.instance = new TemplateCRMSync();
    }
    return TemplateCRMSync.instance;
  }

  /**
   * Sync a POV with CRM based on its template
   */
  public async syncPOV(
    povId: string,
    templateId: string,
    formData: Record<string, any>,
    direction: SyncDirection = 'bidirectional'
  ): Promise<any> {
    // Get the template
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new ApiError('NOT_FOUND', `Template with ID ${templateId} not found`);
    }
    
    // Extract CRM config from template
    const crmConfig = extractCRMConfig(template);
    
    // Check if sync is enabled
    if (crmConfig.syncConfig.enabled === false) {
      throw new ApiError('BAD_REQUEST', 'CRM sync is not enabled for this template');
    }
    
    // Override direction if specified
    const syncDirection = direction || crmConfig.syncConfig.direction || 'bidirectional';
    
    // Prepare data for sync
    const crmData = this.prepareCRMData(template, formData, crmConfig, syncDirection);
    
    // Perform sync
    const result = await crmService.syncPoV(povId);
    
    return result;
  }

  /**
   * Prepare data for CRM sync based on template mappings
   */
  private prepareCRMData(
    template: POVTemplate,
    formData: Record<string, any>,
    crmConfig: CRMTemplateConfig,
    direction: SyncDirection
  ): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Apply field mappings
    Object.entries(crmConfig.fieldMappings).forEach(([fieldId, mapping]) => {
      // Skip fields that don't match the sync direction
      if (
        (direction === 'to_crm' && mapping.direction === 'from_crm') ||
        (direction === 'from_crm' && mapping.direction === 'to_crm')
      ) {
        return;
      }
      
      const field = template.fields[fieldId];
      if (!field) return;
      
      const value = formData[fieldId];
      
      // Skip if required field is missing
      if (mapping.required && (value === undefined || value === null || value === '')) {
        return;
      }
      
      // Apply transformer if specified
      const transformedValue = mapping.transformer
        ? applyTransformer(mapping.transformer, value, field, 'toCRM')
        : value;
      
      // Add to result
      result[mapping.field] = transformedValue;
    });
    
    return result;
  }

  /**
   * Get a template by ID
   */
  private async getTemplate(id: string): Promise<POVTemplate | null> {
    try {
      const response = await fetch(`/api/pov-templates/${id}`);
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.template;
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  /**
   * Check if a POV should be synced based on trigger event
   */
  public shouldSync(
    template: POVTemplate,
    triggerEvent: string,
    oldData?: Record<string, any>,
    newData?: Record<string, any>
  ): boolean {
    const crmConfig = extractCRMConfig(template);
    
    // Check if sync is enabled
    if (crmConfig.syncConfig.enabled === false) {
      return false;
    }
    
    // Check if trigger event is in the list
    if (
      crmConfig.syncConfig.triggerEvents &&
      !crmConfig.syncConfig.triggerEvents.includes(triggerEvent as any)
    ) {
      return false;
    }
    
    // For status change events, check if status actually changed
    if (triggerEvent === 'status.change' && oldData && newData) {
      return oldData.status !== newData.status;
    }
    
    return true;
  }
}

export const templateCRMSync = TemplateCRMSync.getInstance();
```

### 3. CRM Sync Service Updates

#### Enhanced CRM Service

```typescript
// lib/pov/services/crm.ts (updated)
import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma';
import { povService } from './pov';
import { templateService } from '../templates/service';
import { templateCRMSync } from '../templates/crm-sync';
import { CRMFieldMapping as PrismaCRMFieldMapping } from '@prisma/client';
import { CRMSyncResult, CRMFieldMappingCreateInput, CRMFieldMappingUpdateInput } from '../types/crm';
import { ApiError } from '@/lib/errors';

export class CRMService {
  private static instance: CRMService;

  private constructor() {}

  static getInstance(): CRMService {
    if (!CRMService.instance) {
      CRMService.instance = new CRMService();
    }
    return CRMService.instance;
  }

  async syncPoV(povId: string): Promise<CRMSyncResult> {
    const mapping = await this.getFieldMapping();
    const syncHistory = await this.createSyncHistory(povId);
    
    try {
      // Get PoV data
      const pov = await povService.get(povId);
      if (!pov) {
        throw new Error('PoV not found');
      }
      
      // Check if POV has a template
      if (pov.templateId) {
        // Use template-based sync if available
        return await this.syncWithTemplate(pov, syncHistory.id);
      } else {
        // Fall back to traditional sync
        return await this.syncTraditional(pov, mapping, syncHistory.id);
      }
    } catch (error) {
      // Log failure
      await this.updateSyncHistory(syncHistory.id, {
        status: 'FAILED',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      // Update PoV sync status
      await povService.update(povId, {
        lastCrmSync: new Date(),
        crmSyncStatus: 'FAILED'
      });

      throw error;
    }
  }
  
  /**
   * Sync a POV using its template
   */
  private async syncWithTemplate(pov: any, syncHistoryId: string): Promise<CRMSyncResult> {
    try {
      // Get the template
      const template = await templateService.getTemplate(pov.templateId);
      if (!template) {
        throw new ApiError('NOT_FOUND', `Template with ID ${pov.templateId} not found`);
      }
      
      // Use template CRM sync
      const formData = pov.formData || {};
      const result = await templateCRMSync.syncPOV(pov.id, pov.templateId, formData);
      
      // Update POV with synced data
      await povService.update(pov.id, {
        lastCrmSync: new Date(),
        crmSyncStatus: 'SUCCESS'
      });
      
      // Update sync history
      await this.updateSyncHistory(syncHistoryId, {
        status: 'SUCCESS',
        details: result
      });
      
      return result;
    } catch (error) {
      // Re-throw to be caught by the outer try/catch
      throw error;
    }
  }
  
  /**
   * Traditional sync method for POVs without templates
   */
  private async syncTraditional(
    pov: any,
    mapping: PrismaCRMFieldMapping[],
    syncHistoryId: string
  ): Promise<CRMSyncResult> {
    try {
      // Perform sync with field mapping
      const result = await this.performSync(pov, mapping);
      
      // Update PoV with synced data
      await povService.update(pov.id, {
        dealId: result.dealId,
        opportunityName: result.opportunityName,
        revenue: result.revenue,
        forecastDate: result.forecastDate,
        customerName: result.customerName,
        customerContact: result.customerContact,
        partnerName: result.partnerName,
        partnerContact: result.partnerContact,
        competitors: result.competitors,
        solution: result.solution,
        lastCrmSync: new Date(),
        crmSyncStatus: 'SUCCESS'
      });

      // Update sync history
      await this.updateSyncHistory(syncHistoryId, {
        status: 'SUCCESS',
        details: result
      });

      return result;
    } catch (error) {
      // Re-throw to be caught by the outer try/catch
      throw error;
    }
  }

  async getFieldMapping(): Promise<PrismaCRMFieldMapping[]> {
    return await prisma.cRMFieldMapping.findMany({
      orderBy: { crmField: 'asc' }
    });
  }

  private async createSyncHistory(povId: string) {
    return await prisma.cRMSyncHistory.create({
      data: {
        povId,
        status: 'IN_PROGRESS',
        details: Prisma.JsonNull
      }
    });
  }

  private async updateSyncHistory(
    id: string,
    data: { status: string; details: any }
  ) {
    return await prisma.cRMSyncHistory.update({
      where: { id },
      data: {
        status: data.status,
        details: data.details || Prisma.JsonNull
      }
    });
  }

  private async performSync(pov: any, mapping: PrismaCRMFieldMapping[]): Promise<any> {
    // This would be replaced with actual CRM API calls
    // For now, return mock data
    return {
      dealId: 'CRM-123',
      opportunityName: pov.title,
      revenue: 100000,
      forecastDate: new Date(),
      customerName: 'ACME Corp',
      customerContact: 'John Doe',
      partnerName: 'Partner Co',
      partnerContact: 'Jane Smith',
      competitors: ['Competitor A', 'Competitor B'],
      solution: 'Enterprise Solution'
    };
  }

  async getLastSync(povId: string) {
    return prisma.cRMSyncHistory.findFirst({
      where: { povId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSyncHistory(povId: string) {
    return prisma.cRMSyncHistory.findMany({
      where: { povId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createFieldMapping(data: CRMFieldMappingCreateInput) {
    return await prisma.cRMFieldMapping.create({
      data: {
        crmField: data.crmField,
        localField: data.localField,
        transformer: data.transformer,
        isRequired: data.isRequired || false
      }
    });
  }

  async updateFieldMapping(id: string, data: CRMFieldMappingUpdateInput) {
    return await prisma.cRMFieldMapping.update({
      where: { id },
      data
    });
  }

  async deleteFieldMapping(id: string) {
    await prisma.cRMFieldMapping.delete({
      where: { id }
    });
  }
}

export const crmService = CRMService.getInstance();
```

#### API Route for Template-Based Sync

```typescript
// app/api/pov/[povId]/crm-sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { povService } from '@/lib/pov/services/pov';
import { crmService } from '@/lib/pov/services/crm';
import { ApiError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { povId } = params;
    
    // Get POV to check permissions
    const pov = await povService.get(povId);
    if (!pov) {
      return NextResponse.json({ error: 'POV not found' }, { status: 404 });
    }
    
    // Check if user has permission to sync this POV
    // (This would be replaced with actual permission check)
    const canSync = pov.ownerId === user.userId || user.role === 'ADMIN';
    if (!canSync) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    
    // Perform sync
    const result = await crmService.syncPoV(povId);
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[CRM Sync Error]:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to sync with CRM' },
      { status: 500 }
    );
  }
}
```

### 4. CRM Mapping Configuration UI

#### CRM Field Mapping Editor Component

```tsx
// components/pov/templates/CRMFieldMappingEditor.tsx
import React, { useState } from 'react';
import { POVTemplate, FieldDefinition } from '@/lib/pov/templates/types';
import { CRMFieldConfig, SyncDirection } from '@/lib/pov/templates/crm-types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ArrowRight, ArrowLeft, ArrowLeftRight } from 'lucide-react';

interface CRMFieldMappingEditorProps {
  template: POVTemplate;
  onChange: (updatedTemplate: POVTemplate) => void;
}

export function CRMFieldMappingEditor({
  template,
  onChange,
}: CRMFieldMappingEditorProps) {
  const [crmType, setCrmType] = useState<string>(
    template.crmSync?.crmType || 'Opportunity'
  );
  
  const [autoSync, setAutoSync] = useState<boolean>(
    template.crmSync?.autoSync || false
  );
  
  const [syncInterval, setSyncInterval] = useState<number>(
    template.crmSync?.interval || 60
  );
  
  const [defaultDirection, setDefaultDirection] = useState<SyncDirection>(
    template.crmSync?.direction || 'bidirectional'
  );
  
  const [triggerEvents, setTriggerEvents] = useState<string[]>(
    template.crmSync?.triggerEvents || ['manual']
  );
  
  // Update template with CRM sync settings
  const updateCRMSync = () => {
    const updatedTemplate = {
      ...template,
      crmSync: {
        ...template.crmSync,
        enabled: true,
        crmType,
        autoSync,
        interval: syncInterval,
        direction: defaultDirection,
        triggerEvents,
      },
    };
    
    onChange(updatedTemplate);
  };
  
  // Update field CRM mapping
  const updateFieldMapping = (fieldId: string, crmConfig: CRMFieldConfig) => {
    const updatedTemplate = {
      ...template,
      fields: {
        ...template.fields,
        [fieldId]: {
          ...template.fields[fieldId],
          crm: crmConfig,
        },
      },
    };
    
    onChange(updatedTemplate);
  };
  
  // Get direction icon
  const getDirectionIcon = (direction: SyncDirection) => {
    switch (direction) {
      case 'to_crm':
        return <ArrowRight className="h-4 w-4" />;
      case 'from_crm':
        return <ArrowLeft className="h-4 w-4" />;
      case 'bidirectional':
        return <ArrowLeftRight className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">CRM Sync Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="crmType">CRM Record Type</Label>
            <Select
              value={crmType}
              onValueChange={setCrmType}
            >
              <SelectTrigger id="crmType">
                <SelectValue placeholder="Select CRM record type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Opportunity">Opportunity</SelectItem>
                <SelectItem value="Account">Account</SelectItem>
                <SelectItem value="Contact">Contact</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="defaultDirection">Default Sync Direction</Label>
            <Select
              value={defaultDirection}
              onValueChange={(value) => setDefaultDirection(value as SyncDirection)}
            >
              <SelectTrigger id="defaultDirection">
                <SelectValue placeholder="Select sync direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bidirectional">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Bidirectional</span>
                  </div>
                </SelectItem>
                <SelectItem value="to_crm">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>To CRM Only</span>
                  </div>
                </SelectItem>
                <SelectItem value="from_crm">
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>From CRM Only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoSync"
              checked={autoSync}
              onCheckedChange={(checked) => setAutoSync(!!checked)}
            />
            <Label htmlFor="autoSync">Enable Auto-Sync</Label>
          </div>
          
          {autoSync && (
            <div>
              <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
              <Input
                id="syncInterval"
                type="number"
                min={5}
                value={syncInterval}
                onChange={(e) => setSyncInterval(parseInt(e.target.value))}
              />
            </div>
          )}
          
          <div className="col-span-1 md:col-span-2">
            <Label className="mb-2 block">Trigger Events</Label>
            <div className="flex flex-wrap gap-4">
              {[
                { id: 'manual', label: 'Manual Sync' },
                { id: 'status.change', label: 'Status Change' },
                { id: 'milestone.complete', label: 'Milestone Complete' },
                { id: 'phase.complete', label: 'Phase Complete' },
              ].map((event) => (
                <div key={event.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`event-${event.id}`}
                    checked={triggerEvents.includes(event.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTriggerEvents([...triggerEvents, event.id]);
                      } else {
                        setTriggerEvents(
                          triggerEvents.filter((e) => e !== event.id)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={`event-${event.id}`}>{event.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <Button className="mt-6" onClick={updateCRMSync}>
          Save CRM Sync Settings
        </Button>
      </Card>
      
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Field Mappings</h3>
        
        <div className="space-y-6">
          {Object.entries(template.fields).map(([fieldId, field]) => (
            <div key={fieldId} className="border-b pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="font-medium">{field.label}</h4>
                  <p className="text-sm text-gray-500">
                    Field ID: {fieldId} | Type: {field.type
