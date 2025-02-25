# Phase 1: Core Template Types and Factory

## Overview

Phase 1 focuses on establishing the foundation for the template system by implementing core interfaces and a basic factory implementation. This phase will provide immediate value with predefined templates while establishing type safety and structure.

## Implementation Steps

### 1. Define Template Interfaces

Create the core interfaces that will define the structure of templates, stages, and tasks.

```typescript
// lib/pov/templates/types.ts
import { PhaseType, StageStatus } from '@prisma/client';

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  type: PhaseType;
  stages: StageConfig[];
  metadata?: Record<string, any>;
}

export interface StageConfig {
  name: string;
  description?: string;
  status?: StageStatus;
  tasks: TaskConfig[];
  dependencies?: string[]; // Stage names that must be completed first
  metadata?: Record<string, any>;
}

export interface TaskConfig {
  key: string;
  title: string;
  description?: string;
  required: boolean;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  dependencies?: string[]; // Task keys that must be completed first
  metadata?: Record<string, any>;
}

export interface TemplateFactory {
  createTemplate(config: Partial<TemplateConfig>): TemplateConfig;
  getDefaultStages(type: PhaseType): StageConfig[];
  getDefaultTasks(stageName: string, phaseType: PhaseType): TaskConfig[];
}
```

### 2. Implement Basic Template Factory

Create a factory class that can generate templates with default configurations based on phase type.

```typescript
// lib/pov/templates/factory.ts
import { PhaseType, StageStatus } from '@prisma/client';
import { TemplateConfig, StageConfig, TaskConfig, TemplateFactory } from './types';

export class PhaseTemplateFactory implements TemplateFactory {
  private static instance: PhaseTemplateFactory;
  private templates: Map<string, TemplateConfig> = new Map();

  private constructor() {
    // Initialize with built-in templates
    this.registerBuiltInTemplates();
  }

  public static getInstance(): PhaseTemplateFactory {
    if (!PhaseTemplateFactory.instance) {
      PhaseTemplateFactory.instance = new PhaseTemplateFactory();
    }
    return PhaseTemplateFactory.instance;
  }

  private registerBuiltInTemplates(): void {
    // Register planning template
    this.templates.set('planning-default', this.createTemplate({
      id: 'planning-default',
      name: 'Default Planning Template',
      description: 'Standard planning phase template with requirements gathering and planning stages',
      type: PhaseType.PLANNING
    }));

    // Register execution template
    this.templates.set('execution-default', this.createTemplate({
      id: 'execution-default',
      name: 'Default Execution Template',
      description: 'Standard execution phase template with development and testing stages',
      type: PhaseType.EXECUTION
    }));

    // Register review template
    this.templates.set('review-default', this.createTemplate({
      id: 'review-default',
      name: 'Default Review Template',
      description: 'Standard review phase template with evaluation and feedback stages',
      type: PhaseType.REVIEW
    }));
  }

  public createTemplate(config: Partial<TemplateConfig>): TemplateConfig {
    if (!config.type) {
      throw new Error('Template type is required');
    }

    const defaultStages = this.getDefaultStages(config.type);
    
    const template: TemplateConfig = {
      id: config.id || `${config.type.toLowerCase()}-${Date.now()}`,
      name: config.name || `${config.type} Template`,
      description: config.description || `Default ${config.type} template`,
      type: config.type,
      stages: config.stages || defaultStages,
      metadata: config.metadata || {}
    };

    return template;
  }

  public getDefaultStages(type: PhaseType): StageConfig[] {
    switch (type) {
      case PhaseType.PLANNING:
        return [
          {
            name: 'Requirements Gathering',
            description: 'Collect and document project requirements',
            status: StageStatus.PENDING,
            tasks: this.getDefaultTasks('Requirements Gathering', PhaseType.PLANNING)
          },
          {
            name: 'Planning',
            description: 'Create project plan and timeline',
            status: StageStatus.PENDING,
            tasks: this.getDefaultTasks('Planning', PhaseType.PLANNING)
          },
          {
            name: 'Approval',
            description: 'Get stakeholder approval for the plan',
            status: StageStatus.PENDING,
            tasks: this.getDefaultTasks('Approval', PhaseType.PLANNING)
          }
        ];
      
      case PhaseType.EXECUTION:
        return [
          {
            name: 'Development',
            description: 'Implement the solution',
            status: StageStatus.PENDING,
            tasks: this.getDefaultTasks('Development', PhaseType.EXECUTION)
          },
          {
            name: 'Testing',
            description: 'Test the implementation',
            status: StageStatus.PENDING,
            tasks: this.getDefaultTasks('Testing', PhaseType.EXECUTION)
          },
          {
            name: 'Deployment',
            description: 'Deploy the solution',
            status: StageStatus.PENDING,
            tasks: this.getDefaultTasks('Deployment', PhaseType.EXECUTION)
          }
        ];
      
      case PhaseType.REVIEW:
        return [
          {
            name: 'Evaluation',
            description: 'Evaluate the solution against requirements',
            status: StageStatus.PENDING,
            tasks: this.getDefaultTasks('Evaluation', PhaseType.REVIEW)
          },
          {
            name: 'Feedback',
            description: 'Collect stakeholder feedback',
            status: StageStatus.PENDING,
            tasks: this.getDefaultTasks('Feedback', PhaseType.REVIEW)
          },
          {
            name: 'Closure',
            description: 'Close the phase and document lessons learned',
            status: StageStatus.PENDING,
            tasks: this.getDefaultTasks('Closure', PhaseType.REVIEW)
          }
        ];
      
      default:
        return [];
    }
  }

  public getDefaultTasks(stageName: string, phaseType: PhaseType): TaskConfig[] {
    // Planning phase tasks
    if (phaseType === PhaseType.PLANNING) {
      if (stageName === 'Requirements Gathering') {
        return [
          {
            key: 'req-001',
            title: 'Document business requirements',
            description: 'Identify and document key business requirements',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'req-002',
            title: 'Document technical requirements',
            description: 'Identify and document technical requirements and constraints',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'req-003',
            title: 'Stakeholder interviews',
            description: 'Conduct interviews with key stakeholders',
            required: false,
            priority: 'MEDIUM'
          }
        ];
      } else if (stageName === 'Planning') {
        return [
          {
            key: 'plan-001',
            title: 'Create project timeline',
            description: 'Develop a detailed project timeline with milestones',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'plan-002',
            title: 'Resource allocation',
            description: 'Identify and allocate resources needed for the project',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'plan-003',
            title: 'Risk assessment',
            description: 'Identify potential risks and mitigation strategies',
            required: true,
            priority: 'MEDIUM'
          }
        ];
      } else if (stageName === 'Approval') {
        return [
          {
            key: 'appr-001',
            title: 'Stakeholder review',
            description: 'Present plan to stakeholders for review',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'appr-002',
            title: 'Obtain sign-off',
            description: 'Get formal sign-off from key stakeholders',
            required: true,
            priority: 'HIGH'
          }
        ];
      }
    }
    
    // Execution phase tasks
    if (phaseType === PhaseType.EXECUTION) {
      if (stageName === 'Development') {
        return [
          {
            key: 'dev-001',
            title: 'Setup development environment',
            description: 'Prepare development environment and tools',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'dev-002',
            title: 'Implement core features',
            description: 'Develop the core functionality',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'dev-003',
            title: 'Code review',
            description: 'Conduct code reviews for quality assurance',
            required: true,
            priority: 'MEDIUM'
          }
        ];
      } else if (stageName === 'Testing') {
        return [
          {
            key: 'test-001',
            title: 'Unit testing',
            description: 'Develop and run unit tests',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'test-002',
            title: 'Integration testing',
            description: 'Perform integration testing',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'test-003',
            title: 'User acceptance testing',
            description: 'Conduct UAT with stakeholders',
            required: true,
            priority: 'HIGH'
          }
        ];
      } else if (stageName === 'Deployment') {
        return [
          {
            key: 'dep-001',
            title: 'Prepare deployment plan',
            description: 'Create detailed deployment plan and rollback strategy',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'dep-002',
            title: 'Deploy to production',
            description: 'Execute deployment to production environment',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'dep-003',
            title: 'Post-deployment verification',
            description: 'Verify deployment success and system stability',
            required: true,
            priority: 'HIGH'
          }
        ];
      }
    }
    
    // Review phase tasks
    if (phaseType === PhaseType.REVIEW) {
      if (stageName === 'Evaluation') {
        return [
          {
            key: 'eval-001',
            title: 'Requirements validation',
            description: 'Verify that all requirements have been met',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'eval-002',
            title: 'Performance assessment',
            description: 'Evaluate system performance against benchmarks',
            required: true,
            priority: 'MEDIUM'
          },
          {
            key: 'eval-003',
            title: 'Security assessment',
            description: 'Review security measures and identify vulnerabilities',
            required: false,
            priority: 'HIGH'
          }
        ];
      } else if (stageName === 'Feedback') {
        return [
          {
            key: 'feed-001',
            title: 'User feedback collection',
            description: 'Gather feedback from end users',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'feed-002',
            title: 'Stakeholder feedback',
            description: 'Collect feedback from key stakeholders',
            required: true,
            priority: 'HIGH'
          },
          {
            key: 'feed-003',
            title: 'Feedback analysis',
            description: 'Analyze feedback and identify improvement areas',
            required: true,
            priority: 'MEDIUM'
          }
        ];
      } else if (stageName === 'Closure') {
        return [
          {
            key: 'clos-001',
            title: 'Documentation finalization',
            description: 'Finalize all project documentation',
            required: true,
            priority: 'MEDIUM'
          },
          {
            key: 'clos-002',
            title: 'Lessons learned',
            description: 'Document lessons learned for future projects',
            required: true,
            priority: 'MEDIUM'
          },
          {
            key: 'clos-003',
            title: 'Project closure report',
            description: 'Create and distribute final project report',
            required: true,
            priority: 'HIGH'
          }
        ];
      }
    }
    
    // Default empty array if no match
    return [];
  }

  public getTemplate(id: string): TemplateConfig | undefined {
    return this.templates.get(id);
  }

  public getAllTemplates(): TemplateConfig[] {
    return Array.from(this.templates.values());
  }

  public registerTemplate(template: TemplateConfig): void {
    this.templates.set(template.id, template);
  }

  public unregisterTemplate(id: string): boolean {
    return this.templates.delete(id);
  }
}

// Export singleton instance
export const templateFactory = PhaseTemplateFactory.getInstance();
```

### 3. Create Basic Template Service

Implement a service that uses the template factory to create phases from templates.

```typescript
// lib/pov/templates/service.ts
import { PhaseType } from '@prisma/client';
import { TemplateConfig } from './types';
import { templateFactory } from './factory';
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
    // Get the template
    const template = templateFactory.getTemplate(templateId);
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
   * Get default template for a phase type
   */
  public getDefaultTemplate(type: PhaseType): TemplateConfig | null {
    const templates = templateFactory.getAllTemplates();
    
    // Find default template
    const defaultTemplate = templates.find(t => 
      t.id === `${type.toLowerCase()}-default` || 
      t.name.includes('Default')
    );
    
    return defaultTemplate || null;
  }
}

// Export singleton instance
export const templateService = TemplateService.getInstance();
```

### 4. Create Index File for Templates

Create an index file to export all template-related components.

```typescript
// lib/pov/templates/index.ts
export * from './types';
export * from './factory';
export * from './service';
```

## Integration with Existing Code

### 1. Update Phase Service

Modify the existing phase service to use templates when creating phases.

```typescript
// lib/pov/services/phase.ts (partial update)
import { templateService } from '../templates';

// Add this method to the PhaseService class
async createPhaseWithTemplate(
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
  return templateService.createPhaseFromTemplate(povId, templateId, data);
}
```

### 2. Update Phase Creation Handler

Modify the phase creation handler to support template-based creation.

```typescript
// lib/pov/handlers/post.ts (partial update)
import { templateService } from '../templates';

// Add template support to the createPhase handler
export async function createPhase(req: CreatePhaseRequest): Promise<PhaseResponse> {
  const { povId, templateId, ...data } = req;
  
  let phase;
  
  if (templateId) {
    // Create phase from template
    phase = await phaseService.createPhaseWithTemplate(povId, templateId, data);
  } else {
    // Create phase normally
    phase = await phaseService.createPhase({
      povId,
      ...data
    });
  }
  
  // Rest of the handler remains the same
}
```

## Testing

### Unit Tests

```typescript
// __tests__/unit/templates/factory.test.ts
import { PhaseType } from '@prisma/client';
import { templateFactory } from '@/lib/pov/templates';

describe('TemplateFactory', () => {
  it('should create a template with default stages', () => {
    const template = templateFactory.createTemplate({
      type: PhaseType.PLANNING
    });
    
    expect(template).toBeDefined();
    expect(template.type).toBe(PhaseType.PLANNING);
    expect(template.stages.length).toBeGreaterThan(0);
  });
  
  it('should provide default tasks for stages', () => {
    const tasks = templateFactory.getDefaultTasks('Requirements Gathering', PhaseType.PLANNING);
    
    expect(tasks).toBeDefined();
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].key).toBeDefined();
    expect(tasks[0].title).toBeDefined();
  });
  
  it('should register and retrieve templates', () => {
    const template = templateFactory.createTemplate({
      id: 'test-template',
      name: 'Test Template',
      type: PhaseType.EXECUTION
    });
    
    templateFactory.registerTemplate(template);
    const retrieved = templateFactory.getTemplate('test-template');
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('test-template');
    expect(retrieved?.type).toBe(PhaseType.EXECUTION);
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/templates/service.test.ts
import { PhaseType } from '@prisma/client';
import { templateService } from '@/lib/pov/templates';
import { phaseService } from '@/lib/pov/services/phase';

// Mock the phase service
jest.mock('@/lib/pov/services/phase');

describe('TemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should create a phase from a template', async () => {
    // Mock implementation
    (phaseService.createPhase as jest.Mock).mockResolvedValue({
      id: 'phase-1',
      name: 'Test Phase',
      type: PhaseType.PLANNING
    });
    
    (phaseService.createStage as jest.Mock).mockResolvedValue({
      id: 'stage-1',
      name: 'Test Stage'
    });
    
    (phaseService.getPhase as jest.Mock).mockResolvedValue({
      id: 'phase-1',
      name: 'Test Phase',
      type: PhaseType.PLANNING,
      stages: [
        {
          id: 'stage-1',
          name: 'Test Stage',
          tasks: []
        }
      ]
    });
    
    const result = await templateService.createPhaseFromTemplate(
      'pov-1',
      'planning-default',
      {
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // +1 day
        order: 0
      }
    );
    
    expect(result).toBeDefined();
    expect(result.id).toBe('phase-1');
    expect(phaseService.createPhase).toHaveBeenCalled();
    expect(phaseService.createStage).toHaveBeenCalled();
  });
  
  it('should get default template for a phase type', () => {
    const template = templateService.getDefaultTemplate(PhaseType.PLANNING);
    
    expect(template).toBeDefined();
    expect(template?.type).toBe(PhaseType.PLANNING);
  });
});
```

## Next Steps

After completing Phase 1, we will have a functional template system that can create phases with predefined stages and tasks. The next phase will focus on adding persistence and a registry to manage templates.

Key tasks for Phase 2:
- Implement Template Registry to bridge code and database templates
- Add database persistence for templates
- Create API endpoints for template CRUD operations
