# Phase 2: Template Registry and Persistence

## Overview

Phase 2 builds on the foundation established in Phase 1 by adding persistence and a registry to manage templates. This phase will enable templates to be stored in the database, retrieved, and managed through a unified interface.

## Implementation Steps

### 1. Implement Template Registry

Create a registry service that bridges code-based templates and database templates.

```typescript
// lib/pov/templates/registry.ts
import { PhaseType } from '@prisma/client';
import { TemplateConfig } from './types';
import { templateFactory } from './factory';
import { prisma } from '@/lib/prisma';

export class TemplateRegistry {
  private static instance: TemplateRegistry;

  private constructor() {}

  public static getInstance(): TemplateRegistry {
    if (!TemplateRegistry.instance) {
      TemplateRegistry.instance = new TemplateRegistry();
    }
    return TemplateRegistry.instance;
  }

  /**
   * Get all available templates (both code-based and database)
   */
  public async getAllTemplates(): Promise<TemplateConfig[]> {
    // Get code-based templates
    const codeTemplates = templateFactory.getAllTemplates();
    
    // Get database templates
    const dbTemplates = await this.getDatabaseTemplates();
    
    // Combine and return
    return [...codeTemplates, ...dbTemplates];
  }

  /**
   * Get templates by phase type
   */
  public async getTemplatesByType(type: PhaseType): Promise<TemplateConfig[]> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.filter(template => template.type === type);
  }

  /**
   * Get a specific template by ID
   */
  public async getTemplate(id: string): Promise<TemplateConfig | null> {
    // Check code-based templates first
    const codeTemplate = templateFactory.getTemplate(id);
    if (codeTemplate) {
      return codeTemplate;
    }
    
    // Check database templates
    const dbTemplate = await prisma.phaseTemplate.findUnique({
      where: { id }
    });
    
    if (!dbTemplate) {
      return null;
    }
    
    // Convert database template to TemplateConfig
    return this.convertDbTemplateToConfig(dbTemplate);
  }

  /**
   * Save a template to the database
   */
  public async saveTemplate(template: TemplateConfig): Promise<TemplateConfig> {
    const { id, ...templateData } = template;
    
    // Check if template exists
    const existingTemplate = await prisma.phaseTemplate.findUnique({
      where: { id }
    });
    
    if (existingTemplate) {
      // Update existing template
      const updated = await prisma.phaseTemplate.update({
        where: { id },
        data: {
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          workflow: {
            stages: templateData.stages,
            metadata: templateData.metadata
          }
        }
      });
      
      return this.convertDbTemplateToConfig(updated);
    } else {
      // Create new template
      const created = await prisma.phaseTemplate.create({
        data: {
          id,
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          workflow: {
            stages: templateData.stages,
            metadata: templateData.metadata
          }
        }
      });
      
      return this.convertDbTemplateToConfig(created);
    }
  }

  /**
   * Delete a template from the database
   */
  public async deleteTemplate(id: string): Promise<boolean> {
    try {
      await prisma.phaseTemplate.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Failed to delete template:', error);
      return false;
    }
  }

  /**
   * Get all templates from the database
   */
  private async getDatabaseTemplates(): Promise<TemplateConfig[]> {
    const dbTemplates = await prisma.phaseTemplate.findMany();
    return dbTemplates.map(this.convertDbTemplateToConfig);
  }

  /**
   * Convert a database template to a TemplateConfig
   */
  private convertDbTemplateToConfig(dbTemplate: any): TemplateConfig {
    const workflow = dbTemplate.workflow as any;
    
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description || '',
      type: dbTemplate.type,
      stages: workflow.stages || [],
      metadata: workflow.metadata || {}
    };
  }
}

// Export singleton instance
export const templateRegistry = TemplateRegistry.getInstance();
```

### 2. Update Template Service

Enhance the template service to use the registry for template operations.

```typescript
// lib/pov/templates/service.ts
import { PhaseType } from '@prisma/client';
import { TemplateConfig } from './types';
import { templateFactory } from './factory';
import { templateRegistry } from './registry';
import { phaseService } from '../services/phase';

export class TemplateService {
  private static instance: TemplateService;

  private constructor() {}

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  /**
   * Create a phase from a template
   */
  public async createPhaseFromTemplate(
    povId: string,
    templateId: string,
    data: {
      name?: string;
      description?: string;
      startDate: Date;
      endDate: Date;
      order: number;
    }
  ) {
    // Get the template from registry
    const template = await templateRegistry.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    // Create the phase
    const phase = await phaseService.createPhase({
      povId,
      templateId,
      name: data.name || template.name,
      description: data.description || template.description,
      startDate: data.startDate,
      endDate: data.endDate,
      order: data.order,
      type: template.type,
      details: {
        tasks: [],
        metadata: template.metadata
      }
    });

    // Create stages from template
    for (let i = 0; i < template.stages.length; i++) {
      const stageConfig = template.stages[i];
      
      // Create the stage
      const stage = await phaseService.createStage(phase.id, {
        name: stageConfig.name,
        description: stageConfig.description,
        order: i,
        status: stageConfig.status,
        metadata: stageConfig.metadata
      });

      // Create tasks for the stage
      for (let j = 0; j < stageConfig.tasks.length; j++) {
        const taskConfig = stageConfig.tasks[j];
        
        await phaseService.createTask(stage.id, {
          title: taskConfig.title,
          description: taskConfig.description,
          priority: taskConfig.priority,
          metadata: {
            ...taskConfig.metadata,
            required: taskConfig.required,
            key: taskConfig.key,
            dependencies: taskConfig.dependencies
          }
        });
      }
    }

    // Return the created phase with stages and tasks
    return phaseService.getPhase(phase.id);
  }

  /**
   * Create a custom template
   */
  public async createCustomTemplate(config: Partial<TemplateConfig>): Promise<TemplateConfig> {
    // Create template using factory
    const template = templateFactory.createTemplate(config);
    
    // Save to database
    return templateRegistry.saveTemplate(template);
  }

  /**
   * Get default template for a phase type
   */
  public async getDefaultTemplate(type: PhaseType): Promise<TemplateConfig | null> {
    const templates = await templateRegistry.getTemplatesByType(type);
    
    // Find default template (code-based ones are considered default)
    const defaultTemplate = templates.find(t => 
      t.id === `${type.toLowerCase()}-default` || 
      t.name.includes('Default')
    );
    
    return defaultTemplate || null;
  }

  /**
   * Get all templates
   */
  public async getAllTemplates(): Promise<TemplateConfig[]> {
    return templateRegistry.getAllTemplates();
  }

  /**
   * Get templates by type
   */
  public async getTemplatesByType(type: PhaseType): Promise<TemplateConfig[]> {
    return templateRegistry.getTemplatesByType(type);
  }

  /**
   * Get a template by ID
   */
  public async getTemplate(id: string): Promise<TemplateConfig | null> {
    return templateRegistry.getTemplate(id);
  }

  /**
   * Save a template
   */
  public async saveTemplate(template: TemplateConfig): Promise<TemplateConfig> {
    return templateRegistry.saveTemplate(template);
  }

  /**
   * Delete a template
   */
  public async deleteTemplate(id: string): Promise<boolean> {
    return templateRegistry.deleteTemplate(id);
  }
}

// Export singleton instance
export const templateService = TemplateService.getInstance();
```

### 3. Create API Routes for Template Management

Implement API routes for template CRUD operations.

```typescript
// app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { templateService } from '@/lib/pov/templates/service';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    let templates;
    if (type) {
      templates = await templateService.getTemplatesByType(type as any);
    } else {
      templates = await templateService.getAllTemplates();
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[Templates API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const template = await templateService.saveTemplate(data);

    return NextResponse.json({ template });
  } catch (error) {
    console.error('[Templates API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/templates/[id]/route.ts
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
    const template = await templateService.getTemplate(id);

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('[Template API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const data = await request.json();
    
    // Ensure ID in body matches URL parameter
    data.id = id;
    
    const template = await templateService.saveTemplate(data);

    return NextResponse.json({ template });
  } catch (error) {
    console.error('[Template API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = params;
    const success = await templateService.deleteTemplate(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Template API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
```

### 4. Update Index File

Update the index file to export the registry.

```typescript
// lib/pov/templates/index.ts
export * from './types';
export * from './factory';
export * from './registry';
export * from './service';
```

## Testing

### Unit Tests

```typescript
// __tests__/unit/templates/registry.test.ts
import { PhaseType } from '@prisma/client';
import { templateRegistry } from '@/lib/pov/templates';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    phaseTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
  }
}));

describe('TemplateRegistry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should get templates from both code and database', async () => {
    // Mock database templates
    (prisma.phaseTemplate.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'db-template-1',
        name: 'DB Template 1',
        type: PhaseType.PLANNING,
        workflow: {
          stages: []
        }
      }
    ]);
    
    const templates = await templateRegistry.getAllTemplates();
    
    // Should include both code-based and database templates
    expect(templates.length).toBeGreaterThan(1);
    expect(templates.some(t => t.id === 'db-template-1')).toBe(true);
    expect(templates.some(t => t.id === 'planning-default')).toBe(true);
  });
  
  it('should save a template to the database', async () => {
    // Mock create
    (prisma.phaseTemplate.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.phaseTemplate.create as jest.Mock).mockResolvedValue({
      id: 'new-template',
      name: 'New Template',
      type: PhaseType.EXECUTION,
      workflow: {
        stages: []
      }
    });
    
    const template = {
      id: 'new-template',
      name: 'New Template',
      description: 'A new template',
      type: PhaseType.EXECUTION,
      stages: []
    };
    
    const result = await templateRegistry.saveTemplate(template);
    
    expect(result).toBeDefined();
    expect(result.id).toBe('new-template');
    expect(prisma.phaseTemplate.create).toHaveBeenCalled();
  });
  
  it('should update an existing template', async () => {
    // Mock update
    (prisma.phaseTemplate.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-template'
    });
    (prisma.phaseTemplate.update as jest.Mock).mockResolvedValue({
      id: 'existing-template',
      name: 'Updated Template',
      type: PhaseType.REVIEW,
      workflow: {
        stages: []
      }
    });
    
    const template = {
      id: 'existing-template',
      name: 'Updated Template',
      description: 'An updated template',
      type: PhaseType.REVIEW,
      stages: []
    };
    
    const result = await templateRegistry.saveTemplate(template);
    
    expect(result).toBeDefined();
    expect(result.name).toBe('Updated Template');
    expect(prisma.phaseTemplate.update).toHaveBeenCalled();
  });
  
  it('should delete a template', async () => {
    // Mock delete
    (prisma.phaseTemplate.delete as jest.Mock).mockResolvedValue({});
    
    const result = await templateRegistry.deleteTemplate('template-to-delete');
    
    expect(result).toBe(true);
    expect(prisma.phaseTemplate.delete).toHaveBeenCalledWith({
      where: { id: 'template-to-delete' }
    });
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/templates/api.test.ts
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/templates/route';
import { GET as getTemplate, PUT, DELETE } from '@/app/api/templates/[id]/route';
import { templateService } from '@/lib/pov/templates';
import { getAuthUser } from '@/lib/auth/get-auth-user';

// Mock dependencies
jest.mock('@/lib/auth/get-auth-user');
jest.mock('@/lib/pov/templates/service');

describe('Templates API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated admin user
    (getAuthUser as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      role: 'ADMIN'
    });
  });
  
  it('should get all templates', async () => {
    // Mock service
    (templateService.getAllTemplates as jest.Mock).mockResolvedValue([
      { id: 'template-1', name: 'Template 1' },
      { id: 'template-2', name: 'Template 2' }
    ]);
    
    const request = new NextRequest('http://localhost/api/templates');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.templates).toHaveLength(2);
    expect(templateService.getAllTemplates).toHaveBeenCalled();
  });
  
  it('should get templates by type', async () => {
    // Mock service
    (templateService.getTemplatesByType as jest.Mock).mockResolvedValue([
      { id: 'template-1', name: 'Template 1', type: 'PLANNING' }
    ]);
    
    const request = new NextRequest('http://localhost/api/templates?type=PLANNING');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.templates).toHaveLength(1);
    expect(templateService.getTemplatesByType).toHaveBeenCalledWith('PLANNING');
  });
  
  it('should create a template', async () => {
    // Mock service
    (templateService.saveTemplate as jest.Mock).mockResolvedValue({
      id: 'new-template',
      name: 'New Template'
    });
    
    const request = new NextRequest('http://localhost/api/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Template',
        type: 'EXECUTION',
        stages: []
      })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.template.id).toBe('new-template');
    expect(templateService.saveTemplate).toHaveBeenCalled();
  });
  
  it('should get a template by ID', async () => {
    // Mock service
    (templateService.getTemplate as jest.Mock).mockResolvedValue({
      id: 'template-1',
      name: 'Template 1'
    });
    
    const request = new NextRequest('http://localhost/api/templates/template-1');
    const response = await getTemplate(request, { params: { id: 'template-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.template.id).toBe('template-1');
    expect(templateService.getTemplate).toHaveBeenCalledWith('template-1');
  });
  
  it('should update a template', async () => {
    // Mock service
    (templateService.saveTemplate as jest.Mock).mockResolvedValue({
      id: 'template-1',
      name: 'Updated Template'
    });
    
    const request = new NextRequest('http://localhost/api/templates/template-1', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Template',
        type: 'PLANNING',
        stages: []
      })
    });
    
    const response = await PUT(request, { params: { id: 'template-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.template.name).toBe('Updated Template');
    expect(templateService.saveTemplate).toHaveBeenCalled();
  });
  
  it('should delete a template', async () => {
    // Mock service
    (templateService.deleteTemplate as jest.Mock).mockResolvedValue(true);
    
    const request = new NextRequest('http://localhost/api/templates/template-1', {
      method: 'DELETE'
    });
    
    const response = await DELETE(request, { params: { id: 'template-1' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(templateService.deleteTemplate).toHaveBeenCalledWith('template-1');
  });
});
```

## Next Steps

After completing Phase 2, we will have a fully functional template system with persistence and API endpoints for template management. The next phase will focus on creating the user interface for template selection and management.

Key tasks for Phase 3:
- Create template selector component
- Implement template preview component
- Build template editor for admins
- Integrate with phase creation flow
