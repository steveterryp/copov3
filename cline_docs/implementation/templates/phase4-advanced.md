# Phase 4: Advanced Features and Extensibility

## Overview

Phase 4 focuses on adding advanced features to the template system and preparing it for future extensibility. This phase will enhance the template system with versioning, inheritance, custom fields, and analytics to support more complex template scenarios.

## Implementation Steps

### 1. Implement Template Versioning

Add versioning support to templates to track changes and allow users to select specific versions.

```typescript
// lib/pov/templates/types.ts (additions)
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  createdAt: Date;
  createdBy: string;
  config: TemplateConfig;
}

// Update TemplateConfig to include version information
export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  type: PhaseType;
  stages: StageConfig[];
  metadata?: Record<string, any>;
  version?: string;
  isLatest?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
```

```typescript
// lib/pov/templates/version-service.ts
import { prisma } from '@/lib/prisma';
import { TemplateConfig, TemplateVersion } from './types';
import { templateRegistry } from './registry';

export class TemplateVersionService {
  private static instance: TemplateVersionService;

  private constructor() {}

  public static getInstance(): TemplateVersionService {
    if (!TemplateVersionService.instance) {
      TemplateVersionService.instance = new TemplateVersionService();
    }
    return TemplateVersionService.instance;
  }

  /**
   * Create a new version of a template
   */
  public async createVersion(
    templateId: string,
    config: TemplateConfig,
    userId: string
  ): Promise<TemplateVersion> {
    // Get all versions of the template
    const versions = await this.getVersions(templateId);
    
    // Calculate new version number
    const versionNumber = versions.length + 1;
    const versionString = `v${versionNumber}.0`;
    
    // Create new version record
    const version = await prisma.templateVersion.create({
      data: {
        templateId,
        version: versionString,
        createdBy: userId,
        config: config as any,
      },
    });
    
    // Update template to reference latest version
    await prisma.phaseTemplate.update({
      where: { id: templateId },
      data: {
        currentVersion: versionString,
      },
    });
    
    return version as unknown as TemplateVersion;
  }

  /**
   * Get all versions of a template
   */
  public async getVersions(templateId: string): Promise<TemplateVersion[]> {
    const versions = await prisma.templateVersion.findMany({
      where: { templateId },
      orderBy: { createdAt: 'desc' },
    });
    
    return versions as unknown as TemplateVersion[];
  }

  /**
   * Get a specific version of a template
   */
  public async getVersion(
    templateId: string,
    version: string
  ): Promise<TemplateVersion | null> {
    const templateVersion = await prisma.templateVersion.findFirst({
      where: {
        templateId,
        version,
      },
    });
    
    return templateVersion as unknown as TemplateVersion;
  }

  /**
   * Get the latest version of a template
   */
  public async getLatestVersion(templateId: string): Promise<TemplateVersion | null> {
    const template = await prisma.phaseTemplate.findUnique({
      where: { id: templateId },
      select: { currentVersion: true },
    });
    
    if (!template || !template.currentVersion) {
      return null;
    }
    
    return this.getVersion(templateId, template.currentVersion);
  }

  /**
   * Restore a template to a specific version
   */
  public async restoreVersion(
    templateId: string,
    version: string,
    userId: string
  ): Promise<TemplateConfig> {
    // Get the version to restore
    const templateVersion = await this.getVersion(templateId, version);
    
    if (!templateVersion) {
      throw new Error(`Version ${version} not found for template ${templateId}`);
    }
    
    // Create a new version based on the restored version
    const newVersion = await this.createVersion(
      templateId,
      templateVersion.config,
      userId
    );
    
    // Update the template with the restored config
    const updatedTemplate = await templateRegistry.saveTemplate({
      ...templateVersion.config,
      id: templateId,
    });
    
    return updatedTemplate;
  }
}

export const templateVersionService = TemplateVersionService.getInstance();
```

### 2. Implement Template Inheritance

Add support for template inheritance to allow templates to extend and override other templates.

```typescript
// lib/pov/templates/types.ts (additions)
export interface TemplateInheritance {
  parentId: string;
  overrides: {
    name?: boolean;
    description?: boolean;
    stages?: {
      [stageIndex: number]: {
        name?: boolean;
        description?: boolean;
        status?: boolean;
        tasks?: {
          [taskIndex: number]: {
            title?: boolean;
            description?: boolean;
            required?: boolean;
            priority?: boolean;
          };
        };
      };
    };
  };
}

// Update TemplateConfig to include inheritance information
export interface TemplateConfig {
  // ... existing properties
  extends?: string; // ID of parent template
  inheritance?: TemplateInheritance;
}
```

```typescript
// lib/pov/templates/inheritance-service.ts
import { TemplateConfig, TemplateInheritance } from './types';
import { templateRegistry } from './registry';

export class TemplateInheritanceService {
  private static instance: TemplateInheritanceService;

  private constructor() {}

  public static getInstance(): TemplateInheritanceService {
    if (!TemplateInheritanceService.instance) {
      TemplateInheritanceService.instance = new TemplateInheritanceService();
    }
    return TemplateInheritanceService.instance;
  }

  /**
   * Create a template that extends another template
   */
  public async createExtendedTemplate(
    parentId: string,
    overrides: Partial<TemplateConfig>
  ): Promise<TemplateConfig> {
    // Get the parent template
    const parent = await templateRegistry.getTemplate(parentId);
    
    if (!parent) {
      throw new Error(`Parent template ${parentId} not found`);
    }
    
    // Create inheritance metadata
    const inheritance: TemplateInheritance = {
      parentId,
      overrides: this.calculateOverrides(parent, overrides),
    };
    
    // Merge parent and overrides
    const mergedTemplate: TemplateConfig = {
      ...parent,
      ...overrides,
      id: overrides.id || `${parent.id}-extended-${Date.now()}`,
      extends: parentId,
      inheritance,
    };
    
    // Save the extended template
    return templateRegistry.saveTemplate(mergedTemplate);
  }

  /**
   * Calculate which properties are overridden
   */
  private calculateOverrides(
    parent: TemplateConfig,
    overrides: Partial<TemplateConfig>
  ): TemplateInheritance['overrides'] {
    const result: TemplateInheritance['overrides'] = {};
    
    // Check top-level properties
    if (overrides.name && overrides.name !== parent.name) {
      result.name = true;
    }
    
    if (overrides.description && overrides.description !== parent.description) {
      result.description = true;
    }
    
    // Check stages
    if (overrides.stages) {
      result.stages = {};
      
      overrides.stages.forEach((stage, index) => {
        const parentStage = parent.stages[index];
        
        if (!parentStage) {
          // New stage added
          result.stages![index] = {
            name: true,
            description: true,
            status: true,
            tasks: {},
          };
          return;
        }
        
        result.stages![index] = {};
        
        // Check stage properties
        if (stage.name && stage.name !== parentStage.name) {
          result.stages![index].name = true;
        }
        
        if (stage.description && stage.description !== parentStage.description) {
          result.stages![index].description = true;
        }
        
        if (stage.status && stage.status !== parentStage.status) {
          result.stages![index].status = true;
        }
        
        // Check tasks
        if (stage.tasks) {
          result.stages![index].tasks = {};
          
          stage.tasks.forEach((task, taskIndex) => {
            const parentTask = parentStage.tasks[taskIndex];
            
            if (!parentTask) {
              // New task added
              result.stages![index].tasks![taskIndex] = {
                title: true,
                description: true,
                required: true,
                priority: true,
              };
              return;
            }
            
            result.stages![index].tasks![taskIndex] = {};
            
            // Check task properties
            if (task.title && task.title !== parentTask.title) {
              result.stages![index].tasks![taskIndex].title = true;
            }
            
            if (task.description && task.description !== parentTask.description) {
              result.stages![index].tasks![taskIndex].description = true;
            }
            
            if (task.required !== undefined && task.required !== parentTask.required) {
              result.stages![index].tasks![taskIndex].required = true;
            }
            
            if (task.priority && task.priority !== parentTask.priority) {
              result.stages![index].tasks![taskIndex].priority = true;
            }
          });
        }
      });
    }
    
    return result;
  }

  /**
   * Resolve a template with its inheritance chain
   */
  public async resolveTemplate(templateId: string): Promise<TemplateConfig> {
    const template = await templateRegistry.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // If template doesn't extend another, return as is
    if (!template.extends) {
      return template;
    }
    
    // Get the parent template
    const parent = await this.resolveTemplate(template.extends);
    
    // Merge parent and template
    return this.mergeTemplates(parent, template);
  }

  /**
   * Merge two templates according to inheritance rules
   */
  private mergeTemplates(
    parent: TemplateConfig,
    child: TemplateConfig
  ): TemplateConfig {
    const result: TemplateConfig = { ...parent };
    
    // Apply child properties
    result.id = child.id;
    result.extends = child.extends;
    result.inheritance = child.inheritance;
    
    // Apply overrides based on inheritance metadata
    if (child.inheritance?.overrides.name) {
      result.name = child.name;
    }
    
    if (child.inheritance?.overrides.description) {
      result.description = child.description;
    }
    
    // Apply stage overrides
    if (child.inheritance?.overrides.stages) {
      result.stages = [...parent.stages];
      
      Object.entries(child.inheritance.overrides.stages).forEach(([indexStr, stageOverrides]) => {
        const index = parseInt(indexStr, 10);
        
        // If stage doesn't exist in parent, add it
        if (index >= result.stages.length) {
          result.stages.push(child.stages[index]);
          return;
        }
        
        // Apply stage property overrides
        if (stageOverrides.name) {
          result.stages[index].name = child.stages[index].name;
        }
        
        if (stageOverrides.description) {
          result.stages[index].description = child.stages[index].description;
        }
        
        if (stageOverrides.status) {
          result.stages[index].status = child.stages[index].status;
        }
        
        // Apply task overrides
        if (stageOverrides.tasks) {
          result.stages[index].tasks = [...parent.stages[index].tasks];
          
          Object.entries(stageOverrides.tasks).forEach(([taskIndexStr, taskOverrides]) => {
            const taskIndex = parseInt(taskIndexStr, 10);
            
            // If task doesn't exist in parent, add it
            if (taskIndex >= result.stages[index].tasks.length) {
              result.stages[index].tasks.push(child.stages[index].tasks[taskIndex]);
              return;
            }
            
            // Apply task property overrides
            if (taskOverrides.title) {
              result.stages[index].tasks[taskIndex].title = child.stages[index].tasks[taskIndex].title;
            }
            
            if (taskOverrides.description) {
              result.stages[index].tasks[taskIndex].description = child.stages[index].tasks[taskIndex].description;
            }
            
            if (taskOverrides.required) {
              result.stages[index].tasks[taskIndex].required = child.stages[index].tasks[taskIndex].required;
            }
            
            if (taskOverrides.priority) {
              result.stages[index].tasks[taskIndex].priority = child.stages[index].tasks[taskIndex].priority;
            }
          });
        }
      });
    }
    
    return result;
  }
}

export const templateInheritanceService = TemplateInheritanceService.getInstance();
```

### 3. Implement Custom Fields Support

Add support for custom fields in templates to allow for domain-specific extensions.

```typescript
// lib/pov/templates/types.ts (additions)
export type CustomFieldType = 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'user' | 'team';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For enum type
  metadata?: Record<string, any>;
}

export interface CustomFieldValue {
  fieldId: string;
  value: any;
}

// Update existing interfaces to include custom fields
export interface TemplateConfig {
  // ... existing properties
  customFields?: CustomFieldDefinition[];
}

export interface StageConfig {
  // ... existing properties
  customFields?: CustomFieldDefinition[];
  customFieldValues?: CustomFieldValue[];
}

export interface TaskConfig {
  // ... existing properties
  customFields?: CustomFieldDefinition[];
  customFieldValues?: CustomFieldValue[];
}
```

```typescript
// lib/pov/templates/custom-fields-service.ts
import { CustomFieldDefinition, CustomFieldValue, TemplateConfig } from './types';
import { templateRegistry } from './registry';

export class CustomFieldsService {
  private static instance: CustomFieldsService;

  private constructor() {}

  public static getInstance(): CustomFieldsService {
    if (!CustomFieldsService.instance) {
      CustomFieldsService.instance = new CustomFieldsService();
    }
    return CustomFieldsService.instance;
  }

  /**
   * Add custom fields to a template
   */
  public async addCustomFields(
    templateId: string,
    customFields: CustomFieldDefinition[]
  ): Promise<TemplateConfig> {
    const template = await templateRegistry.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Merge existing and new custom fields
    const existingFields = template.customFields || [];
    const mergedFields = [...existingFields];
    
    // Add new fields, avoiding duplicates
    customFields.forEach(field => {
      const existingIndex = mergedFields.findIndex(f => f.id === field.id);
      
      if (existingIndex >= 0) {
        // Update existing field
        mergedFields[existingIndex] = field;
      } else {
        // Add new field
        mergedFields.push(field);
      }
    });
    
    // Update template
    const updatedTemplate = {
      ...template,
      customFields: mergedFields,
    };
    
    return templateRegistry.saveTemplate(updatedTemplate);
  }

  /**
   * Remove custom fields from a template
   */
  public async removeCustomFields(
    templateId: string,
    fieldIds: string[]
  ): Promise<TemplateConfig> {
    const template = await templateRegistry.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Filter out fields to remove
    const customFields = (template.customFields || []).filter(
      field => !fieldIds.includes(field.id)
    );
    
    // Update template
    const updatedTemplate = {
      ...template,
      customFields,
    };
    
    return templateRegistry.saveTemplate(updatedTemplate);
  }

  /**
   * Set custom field values for a stage
   */
  public async setStageCustomFieldValues(
    templateId: string,
    stageIndex: number,
    values: CustomFieldValue[]
  ): Promise<TemplateConfig> {
    const template = await templateRegistry.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    if (stageIndex >= template.stages.length) {
      throw new Error(`Stage index ${stageIndex} out of bounds`);
    }
    
    // Update stage
    const stages = [...template.stages];
    stages[stageIndex] = {
      ...stages[stageIndex],
      customFieldValues: values,
    };
    
    // Update template
    const updatedTemplate = {
      ...template,
      stages,
    };
    
    return templateRegistry.saveTemplate(updatedTemplate);
  }

  /**
   * Set custom field values for a task
   */
  public async setTaskCustomFieldValues(
    templateId: string,
    stageIndex: number,
    taskIndex: number,
    values: CustomFieldValue[]
  ): Promise<TemplateConfig> {
    const template = await templateRegistry.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    if (stageIndex >= template.stages.length) {
      throw new Error(`Stage index ${stageIndex} out of bounds`);
    }
    
    if (taskIndex >= template.stages[stageIndex].tasks.length) {
      throw new Error(`Task index ${taskIndex} out of bounds`);
    }
    
    // Update task
    const stages = [...template.stages];
    const tasks = [...stages[stageIndex].tasks];
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      customFieldValues: values,
    };
    
    stages[stageIndex] = {
      ...stages[stageIndex],
      tasks,
    };
    
    // Update template
    const updatedTemplate = {
      ...template,
      stages,
    };
    
    return templateRegistry.saveTemplate(updatedTemplate);
  }

  /**
   * Validate custom field values
   */
  public validateCustomFieldValues(
    fields: CustomFieldDefinition[],
    values: CustomFieldValue[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required fields
    fields.forEach(field => {
      if (field.required) {
        const value = values.find(v => v.fieldId === field.id);
        
        if (!value || value.value === undefined || value.value === null || value.value === '') {
          errors.push(`Field "${field.name}" is required`);
        }
      }
    });
    
    // Check field types
    values.forEach(value => {
      const field = fields.find(f => f.id === value.fieldId);
      
      if (!field) {
        errors.push(`Field with ID "${value.fieldId}" not found`);
        return;
      }
      
      // Type validation
      switch (field.type) {
        case 'string':
          if (value.value !== null && typeof value.value !== 'string') {
            errors.push(`Field "${field.name}" must be a string`);
          }
          break;
          
        case 'number':
          if (value.value !== null && typeof value.value !== 'number') {
            errors.push(`Field "${field.name}" must be a number`);
          }
          break;
          
        case 'boolean':
          if (value.value !== null && typeof value.value !== 'boolean') {
            errors.push(`Field "${field.name}" must be a boolean`);
          }
          break;
          
        case 'date':
          if (value.value !== null && !(value.value instanceof Date) && isNaN(Date.parse(value.value))) {
            errors.push(`Field "${field.name}" must be a valid date`);
          }
          break;
          
        case 'enum':
          if (value.value !== null && (!field.options || !field.options.includes(value.value))) {
            errors.push(`Field "${field.name}" must be one of: ${field.options?.join(', ')}`);
          }
          break;
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const customFieldsService = CustomFieldsService.getInstance();
```

### 4. Implement Template Analytics

Add analytics to track template usage and performance.

```typescript
// lib/pov/templates/types.ts (additions)
export interface TemplateUsageStats {
  templateId: string;
  usageCount: number;
  lastUsed: Date;
  averageCompletionTime?: number; // in days
  averageTaskCompletionRate?: number; // percentage
  popularStages?: Array<{ stageId: string; name: string; usageCount: number }>;
  popularTasks?: Array<{ taskId: string; name: string; usageCount: number }>;
}

export interface TemplateUsageEvent {
  id: string;
  templateId: string;
  phaseId: string;
  eventType: 'created' | 'completed' | 'stage_completed' | 'task_completed';
  entityId?: string; // stageId or taskId
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

```typescript
// lib/pov/templates/analytics-service.ts
import { prisma } from '@/lib/prisma';
import { TemplateUsageStats, TemplateUsageEvent } from './types';

export class TemplateAnalyticsService {
  private static instance: TemplateAnalyticsService;

  private constructor() {}

  public static getInstance(): TemplateAnalyticsService {
    if (!TemplateAnalyticsService.instance) {
      TemplateAnalyticsService.instance = new TemplateAnalyticsService();
    }
    return TemplateAnalyticsService.instance;
  }

  /**
   * Track template usage event
   */
  public async trackEvent(event: Omit<TemplateUsageEvent, 'id' | 'timestamp'>): Promise<TemplateUsageEvent> {
    const usageEvent = await prisma.templateUsageEvent.create({
      data: {
        ...event,
        timestamp: new Date(),
      },
    });
    
    return usageEvent as unknown as TemplateUsageEvent;
  }

  /**
   * Get template usage statistics
   */
  public async getTemplateStats(templateId: string): Promise<TemplateUsageStats> {
    // Get usage count
    const usageCount = await prisma.phase.count({
      where: {
        templateId,
      },
    });
    
    // Get last used date
    const lastUsedPhase = await prisma.phase.findFirst({
      where: {
        templateId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    });
    
    // Get completed phases for completion time calculation
    const completedPhases = await prisma.phase.findMany({
      where: {
        templateId,
        status: 'COMPLETED',
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // Calculate average completion time
    let averageCompletionTime;
    if (completedPhases.length > 0) {
      const completionTimes = completedPhases.map(phase => {
        const createdAt = new Date(phase.createdAt);
        const updatedAt = new Date(phase.updatedAt);
        return (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24); // in days
      });
      
      averageCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    }
    
    // Get popular stages
    const stageEvents = await prisma.templateUsageEvent.groupBy({
      by: ['entityId'],
      where: {
        templateId,
        eventType: 'stage_completed',
      },
      _count: {
        id: true,
      },
    });
    
    // Get popular tasks
    const taskEvents = await prisma.templateUsageEvent.groupBy({
      by: ['entityId'],
      where: {
        templateId,
        eventType: 'task_completed',
      },
      _count: {
        id: true,
      },
    });
    
    // Format results
    const stats: TemplateUsageStats = {
      templateId,
      usageCount,
      lastUsed: lastUsedPhase?.createdAt || new Date(),
      averageCompletionTime,
      popularStages: stageEvents.map(event => ({
        stageId: event.entityId!,
        name: '', // Would need to fetch stage names separately
        usageCount: event._count.id,
      })),
      popularTasks: taskEvents.map(event => ({
        taskId: event.entityId!,
        name: '', // Would need to fetch task names separately
        usageCount: event._count.id,
      })),
    };
    
    return stats;
  }

  /**
   * Get usage statistics for all templates
   */
  public async getAllTemplateStats(): Promise<TemplateUsageStats[]> {
    // Get all templates with usage count
    const templates = await prisma.phaseTemplate.findMany({
      select: {
        id: true,
        _count: {
          select: {
            phases: true,
          },
        },
      },
    });
    
    // Get stats for each template
    const stats = await Promise.all(
      templates.map(async template => {
        return this.getTemplateStats(template.id);
      })
    );
    
    return stats;
  }

  /**
   * Get template recommendations based on usage patterns
   */
  public async getRecommendations(phaseType: string): Promise<string[]> {
    // Get most used templates of the specified type
    const popularTemplates = await prisma.phaseTemplate.findMany({
      where: {
        type: phaseType,
      },
      select: {
        id: true,
        _count: {
          select: {
            phases: true,
          },
        },
      },
      orderBy: {
        phases: {
          _count: 'desc',
        },
      },
      take: 3,
    });
    
    return popularTemplates.map(template => template.id);
  }
}

export const templateAnalyticsService = TemplateAnalyticsService.getInstance();
```

### 5. Update Template Service

Update the template service to integrate the new advanced features.

```typescript
// lib/pov/templates/service.ts (additions)
import { templateVersionService } from './version-service';
import { templateInheritanceService } from './inheritance-service';
import { customFieldsService } from './custom-fields-service';
import { templateAnalyticsService } from './analytics-service';

// Add these methods to the TemplateService class

/**
 * Create a new version of a template
 */
public async createVersion(
  templateId: string,
  config: TemplateConfig,
  userId: string
): Promise<TemplateVersion> {
  return templateVersionService.createVersion(templateId, config, userId);
}

/**
 * Get all versions of a template
 */
public async getVersions(templateId: string): Promise<TemplateVersion[]> {
  return templateVersionService.getVersions(templateId);
}

/**
 * Create a template that extends another template
 */
public async createExtendedTemplate(
  parentId: string,
  overrides: Partial<TemplateConfig>
): Promise<TemplateConfig> {
  return templateInheritanceService.createExtendedTemplate(parentId, overrides);
}

/**
 * Resolve a template with its inheritance chain
 */
public async resolveTemplate(templateId: string): Promise<TemplateConfig> {
  return templateInheritanceService.resolveTemplate(templateId);
}

/**
 * Add custom fields to a template
 */
public async addCustomFields(
  templateId: string,
  customFields: CustomFieldDefinition[]
): Promise<TemplateConfig> {
  return customFieldsService.addCustomFields(templateId, customFields);
}

/**
 * Track template usage event
 */
public async trackUsage(
  templateId: string,
  phaseId: string,
  eventType: 'created' | 'completed' | 'stage_completed' | 'task_completed',
  entityId: string | undefined,
  userId: string
): Promise<void> {
  await templateAnalyticsService.trackEvent({
    templateId,
    phaseId,
    eventType,
    entityId,
    userId,
  });
}

/**
 * Get template usage statistics
 */
public async getTemplateStats(templateId: string): Promise<TemplateUsageStats> {
  return templateAnalyticsService.getTemplateStats(templateId);
}

/**
 * Get template recommendations
 */
public async getRecommendations(phaseType: string): Promise<string[]> {
  return templateAnalyticsService.getRecommendations(phaseType);
}
```

### 6. Create API Routes for Advanced Features

Implement API routes for the advanced template features.

```typescript
// app/api/templates/[id]/versions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { templateService } from '@/lib/pov/templates/service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const versions = await templateService.getVersions(id);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('[Template Versions API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template versions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(
