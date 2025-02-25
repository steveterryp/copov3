# Phase 1: JSON Schema Foundation for POV Templates

## Overview

This phase establishes the core JSON Schema infrastructure for POV templates. It focuses on defining the schema structure, implementing validation, extending the database model, and creating basic template services.

## Implementation Details

### 1. Schema Definition

#### Core POV Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "POV Template Schema",
  "description": "Schema for defining POV templates",
  "required": ["id", "name", "description", "fields", "sections"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the template"
    },
    "name": {
      "type": "string",
      "description": "Display name for the template"
    },
    "description": {
      "type": "string",
      "description": "Detailed description of the template"
    },
    "version": {
      "type": "string",
      "description": "Version of the template (semver format)",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "status": {
      "type": "string",
      "enum": ["draft", "published", "deprecated"],
      "default": "draft",
      "description": "Status of the template"
    },
    "sections": {
      "type": "array",
      "description": "Sections of the POV form",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "title", "fields"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Unique identifier for the section"
          },
          "title": {
            "type": "string",
            "description": "Display title for the section"
          },
          "description": {
            "type": "string",
            "description": "Optional description for the section"
          },
          "order": {
            "type": "integer",
            "minimum": 0,
            "description": "Display order of the section"
          },
          "fields": {
            "type": "array",
            "description": "Fields in this section",
            "items": {
              "type": "string",
              "description": "Field ID reference"
            }
          },
          "conditional": {
            "type": "object",
            "description": "Conditions for displaying this section",
            "properties": {
              "field": {
                "type": "string",
                "description": "Field ID to check"
              },
              "operator": {
                "type": "string",
                "enum": ["equals", "notEquals", "contains", "greaterThan", "lessThan"],
                "description": "Comparison operator"
              },
              "value": {
                "description": "Value to compare against"
              }
            },
            "required": ["field", "operator", "value"]
          }
        }
      }
    },
    "fields": {
      "type": "object",
      "description": "Field definitions for the POV",
      "additionalProperties": {
        "type": "object",
        "required": ["type", "label"],
        "properties": {
          "type": {
            "type": "string",
            "enum": ["text", "textarea", "select", "multiselect", "date", "number", "boolean", "email", "phone", "url", "currency"],
            "description": "Type of field"
          },
          "label": {
            "type": "string",
            "description": "Display label for the field"
          },
          "description": {
            "type": "string",
            "description": "Help text for the field"
          },
          "placeholder": {
            "type": "string",
            "description": "Placeholder text for the field"
          },
          "defaultValue": {
            "description": "Default value for the field"
          },
          "required": {
            "type": "boolean",
            "default": false,
            "description": "Whether the field is required"
          },
          "validation": {
            "type": "object",
            "description": "Validation rules for the field",
            "properties": {
              "pattern": {
                "type": "string",
                "description": "Regex pattern for validation"
              },
              "min": {
                "type": "number",
                "description": "Minimum value for numbers or minimum length for strings"
              },
              "max": {
                "type": "number",
                "description": "Maximum value for numbers or maximum length for strings"
              },
              "options": {
                "type": "array",
                "description": "Options for select/multiselect fields",
                "items": {
                  "type": "object",
                  "required": ["value", "label"],
                  "properties": {
                    "value": {
                      "description": "Option value"
                    },
                    "label": {
                      "type": "string",
                      "description": "Display label for the option"
                    }
                  }
                }
              },
              "customValidator": {
                "type": "string",
                "description": "Name of custom validator function"
              }
            }
          },
          "ui": {
            "type": "object",
            "description": "UI rendering hints",
            "properties": {
              "width": {
                "type": "string",
                "enum": ["full", "half", "third", "quarter"],
                "default": "full",
                "description": "Width of the field in the form"
              },
              "hidden": {
                "type": "boolean",
                "default": false,
                "description": "Whether the field is hidden by default"
              },
              "component": {
                "type": "string",
                "description": "Custom component to use for rendering"
              }
            }
          },
          "conditional": {
            "type": "object",
            "description": "Conditions for displaying this field",
            "properties": {
              "field": {
                "type": "string",
                "description": "Field ID to check"
              },
              "operator": {
                "type": "string",
                "enum": ["equals", "notEquals", "contains", "greaterThan", "lessThan"],
                "description": "Comparison operator"
              },
              "value": {
                "description": "Value to compare against"
              }
            },
            "required": ["field", "operator", "value"]
          },
          "metadata": {
            "type": "object",
            "description": "Additional metadata for the field"
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "description": "Additional metadata for the template"
    }
  }
}
```

#### TypeScript Interfaces

```typescript
// lib/pov/templates/types.ts
export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'multiselect' 
  | 'date' 
  | 'number' 
  | 'boolean' 
  | 'email' 
  | 'phone' 
  | 'url' 
  | 'currency';

export type ComparisonOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'greaterThan' 
  | 'lessThan';

export type TemplateStatus = 'draft' | 'published' | 'deprecated';

export type FieldWidth = 'full' | 'half' | 'third' | 'quarter';

export interface ConditionalRule {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

export interface FieldOption {
  value: any;
  label: string;
}

export interface FieldValidation {
  pattern?: string;
  min?: number;
  max?: number;
  options?: FieldOption[];
  customValidator?: string;
}

export interface FieldUI {
  width?: FieldWidth;
  hidden?: boolean;
  component?: string;
}

export interface FieldDefinition {
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  validation?: FieldValidation;
  ui?: FieldUI;
  conditional?: ConditionalRule;
  metadata?: Record<string, any>;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  order?: number;
  fields: string[];
  conditional?: ConditionalRule;
}

export interface POVTemplate {
  id: string;
  name: string;
  description: string;
  version?: string;
  status?: TemplateStatus;
  sections: TemplateSection[];
  fields: Record<string, FieldDefinition>;
  metadata?: Record<string, any>;
}
```

### 2. Schema Validation Service

```typescript
// lib/pov/templates/validator.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { POVTemplate, FieldDefinition } from './types';
import { templateSchema } from './schema';

export class TemplateValidator {
  private static instance: TemplateValidator;
  private ajv: Ajv;
  private validator: ReturnType<Ajv['compile']>;
  private customValidators: Map<string, (value: any, field: FieldDefinition) => boolean>;

  private constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    
    this.validator = this.ajv.compile(templateSchema);
    this.customValidators = new Map();
    
    // Register default custom validators
    this.registerCustomValidator('isValidEmail', this.isValidEmail);
    this.registerCustomValidator('isValidPhone', this.isValidPhone);
    this.registerCustomValidator('isValidUrl', this.isValidUrl);
  }

  public static getInstance(): TemplateValidator {
    if (!TemplateValidator.instance) {
      TemplateValidator.instance = new TemplateValidator();
    }
    return TemplateValidator.instance;
  }

  /**
   * Validate a template against the schema
   */
  public validateTemplate(template: POVTemplate): { valid: boolean; errors: any[] } {
    const valid = this.validator(template);
    return {
      valid: !!valid,
      errors: this.validator.errors || []
    };
  }

  /**
   * Validate POV data against a template
   */
  public validatePOVData(data: Record<string, any>, template: POVTemplate): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    // Check each field in the template
    Object.entries(template.fields).forEach(([fieldId, fieldDef]) => {
      const value = data[fieldId];
      
      // Check required fields
      if (fieldDef.required && (value === undefined || value === null || value === '')) {
        errors[fieldId] = `${fieldDef.label} is required`;
        return;
      }
      
      // Skip validation for empty optional fields
      if (value === undefined || value === null || value === '') {
        return;
      }
      
      // Validate based on field type
      switch (fieldDef.type) {
        case 'number':
        case 'currency':
          if (typeof value !== 'number') {
            errors[fieldId] = `${fieldDef.label} must be a number`;
          } else if (fieldDef.validation?.min !== undefined && value < fieldDef.validation.min) {
            errors[fieldId] = `${fieldDef.label} must be at least ${fieldDef.validation.min}`;
          } else if (fieldDef.validation?.max !== undefined && value > fieldDef.validation.max) {
            errors[fieldId] = `${fieldDef.label} must be at most ${fieldDef.validation.max}`;
          }
          break;
          
        case 'text':
        case 'textarea':
        case 'email':
        case 'phone':
        case 'url':
          if (typeof value !== 'string') {
            errors[fieldId] = `${fieldDef.label} must be a string`;
          } else {
            if (fieldDef.validation?.min !== undefined && value.length < fieldDef.validation.min) {
              errors[fieldId] = `${fieldDef.label} must be at least ${fieldDef.validation.min} characters`;
            }
            if (fieldDef.validation?.max !== undefined && value.length > fieldDef.validation.max) {
              errors[fieldId] = `${fieldDef.label} must be at most ${fieldDef.validation.max} characters`;
            }
            if (fieldDef.validation?.pattern && !new RegExp(fieldDef.validation.pattern).test(value)) {
              errors[fieldId] = `${fieldDef.label} is not in the correct format`;
            }
            
            // Apply custom validators
            if (fieldDef.validation?.customValidator) {
              const validator = this.customValidators.get(fieldDef.validation.customValidator);
              if (validator && !validator(value, fieldDef)) {
                errors[fieldId] = `${fieldDef.label} is invalid`;
              }
            }
            
            // Type-specific validation
            if (fieldDef.type === 'email' && !this.isValidEmail(value, fieldDef)) {
              errors[fieldId] = `${fieldDef.label} must be a valid email address`;
            }
            if (fieldDef.type === 'phone' && !this.isValidPhone(value, fieldDef)) {
              errors[fieldId] = `${fieldDef.label} must be a valid phone number`;
            }
            if (fieldDef.type === 'url' && !this.isValidUrl(value, fieldDef)) {
              errors[fieldId] = `${fieldDef.label} must be a valid URL`;
            }
          }
          break;
          
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            errors[fieldId] = `${fieldDef.label} must be a valid date`;
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors[fieldId] = `${fieldDef.label} must be a boolean`;
          }
          break;
          
        case 'select':
          if (fieldDef.validation?.options && !fieldDef.validation.options.some(opt => opt.value === value)) {
            errors[fieldId] = `${fieldDef.label} must be one of the available options`;
          }
          break;
          
        case 'multiselect':
          if (!Array.isArray(value)) {
            errors[fieldId] = `${fieldDef.label} must be an array`;
          } else if (fieldDef.validation?.options) {
            const validValues = fieldDef.validation.options.map(opt => opt.value);
            if (!value.every(v => validValues.includes(v))) {
              errors[fieldId] = `${fieldDef.label} contains invalid options`;
            }
          }
          break;
      }
    });
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Register a custom validator function
   */
  public registerCustomValidator(
    name: string,
    validator: (value: any, field: FieldDefinition) => boolean
  ): void {
    this.customValidators.set(name, validator);
  }

  /**
   * Format validation errors into human-readable messages
   */
  public formatSchemaErrors(errors: any[]): string[] {
    return errors.map(error => {
      const path = error.instancePath || '';
      const property = error.params.missingProperty ? 
        `/${error.params.missingProperty}` : '';
      
      switch (error.keyword) {
        case 'required':
          return `Missing required property: ${error.params.missingProperty}`;
        case 'enum':
          return `${path}${property} must be one of: ${error.params.allowedValues.join(', ')}`;
        case 'type':
          return `${path}${property} must be a ${error.params.type}`;
        default:
          return `${path}${property} ${error.message}`;
      }
    });
  }

  // Default custom validators
  private isValidEmail(value: string, _field: FieldDefinition): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private isValidPhone(value: string, _field: FieldDefinition): boolean {
    return /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(value);
  }

  private isValidUrl(value: string, _field: FieldDefinition): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
}

export const templateValidator = TemplateValidator.getInstance();
```

### 3. Database Model Extensions

#### Prisma Schema Extension

```prisma
// prisma/schema.prisma (additions)

model POVTemplate {
  id          String    @id @default(cuid())
  name        String
  description String
  version     String?
  status      String    @default("draft")
  schema      Json
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String?
  povs        POV[]     @relation("POVFromTemplate")
}

// Update POV model to include template reference
model POV {
  // ... existing fields
  templateId  String?
  template    POVTemplate? @relation("POVFromTemplate", fields: [templateId], references: [id])
  formData    Json?        // Store the form data based on the template
  
  // ... existing relations
  @@index([templateId])
}
```

#### Migration Script

```typescript
// prisma/migrations/[timestamp]_add_pov_templates/migration.sql
-- CreateTable
CREATE TABLE "POVTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "version" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "schema" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT,

  CONSTRAINT "POVTemplate_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "POV" ADD COLUMN "templateId" TEXT;
ALTER TABLE "POV" ADD COLUMN "formData" JSONB;

-- AddForeignKey
ALTER TABLE "POV" ADD CONSTRAINT "POV_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "POVTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "POV_templateId_idx" ON "POV"("templateId");
```

### 4. Basic Template Service

```typescript
// lib/pov/templates/service.ts
import { prisma } from '@/lib/prisma';
import { POVTemplate } from './types';
import { templateValidator } from './validator';
import { ApiError } from '@/lib/errors';

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
   * Create a new template
   */
  public async createTemplate(template: POVTemplate, userId: string): Promise<POVTemplate> {
    // Validate template against schema
    const validation = templateValidator.validateTemplate(template);
    if (!validation.valid) {
      const errors = templateValidator.formatSchemaErrors(validation.errors);
      throw new ApiError('BAD_REQUEST', `Invalid template: ${errors.join(', ')}`);
    }
    
    // Set default values
    if (!template.version) {
      template.version = '1.0.0';
    }
    if (!template.status) {
      template.status = 'draft';
    }
    
    // Create template in database
    const created = await prisma.pOVTemplate.create({
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        version: template.version,
        status: template.status,
        schema: template as any,
        createdBy: userId
      }
    });
    
    return created.schema as unknown as POVTemplate;
  }

  /**
   * Get a template by ID
   */
  public async getTemplate(id: string): Promise<POVTemplate | null> {
    const template = await prisma.pOVTemplate.findUnique({
      where: { id }
    });
    
    if (!template) {
      return null;
    }
    
    return template.schema as unknown as POVTemplate;
  }

  /**
   * Get all templates
   */
  public async getAllTemplates(): Promise<POVTemplate[]> {
    const templates = await prisma.pOVTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    
    return templates.map(t => t.schema as unknown as POVTemplate);
  }

  /**
   * Update a template
   */
  public async updateTemplate(id: string, template: POVTemplate): Promise<POVTemplate> {
    // Validate template against schema
    const validation = templateValidator.validateTemplate(template);
    if (!validation.valid) {
      const errors = templateValidator.formatSchemaErrors(validation.errors);
      throw new ApiError('BAD_REQUEST', `Invalid template: ${errors.join(', ')}`);
    }
    
    // Ensure ID matches
    template.id = id;
    
    // Get existing template to check version
    const existing = await prisma.pOVTemplate.findUnique({
      where: { id }
    });
    
    if (!existing) {
      throw new ApiError('NOT_FOUND', `Template with ID ${id} not found`);
    }
    
    // Increment version if not specified
    if (!template.version) {
      const existingVersion = (existing.schema as any).version || '1.0.0';
      const versionParts = existingVersion.split('.');
      versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
      template.version = versionParts.join('.');
    }
    
    // Update template in database
    const updated = await prisma.pOVTemplate.update({
      where: { id },
      data: {
        name: template.name,
        description: template.description,
        version: template.version,
        status: template.status,
        schema: template as any,
        updatedAt: new Date()
      }
    });
    
    return updated.schema as unknown as POVTemplate;
  }

  /**
   * Delete a template
   */
  public async deleteTemplate(id: string): Promise<void> {
    // Check if template is in use
    const povsUsingTemplate = await prisma.pOV.count({
      where: { templateId: id }
    });
    
    if (povsUsingTemplate > 0) {
      throw new ApiError('BAD_REQUEST', `Cannot delete template that is in use by ${povsUsingTemplate} POVs`);
    }
    
    await prisma.pOVTemplate.delete({
      where: { id }
    });
  }

  /**
   * Create a POV from a template
   */
  public async createPOVFromTemplate(
    templateId: string,
    formData: Record<string, any>,
    userId: string
  ): Promise<any> {
    // Get the template
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new ApiError('NOT_FOUND', `Template with ID ${templateId} not found`);
    }
    
    // Validate form data against template
    const validation = templateValidator.validatePOVData(formData, template);
    if (!validation.valid) {
      throw new ApiError('BAD_REQUEST', 'Invalid form data', validation.errors);
    }
    
    // Extract core POV fields from form data
    const povData = this.extractPOVData(formData, template);
    
    // Create POV
    const pov = await prisma.pOV.create({
      data: {
        ...povData,
        templateId,
        formData: formData as any,
        owner: {
          connect: { id: userId }
        }
      }
    });
    
    return pov;
  }

  /**
   * Extract core POV fields from form data
   */
  private extractPOVData(formData: Record<string, any>, template: POVTemplate): any {
    // Map form fields to POV fields based on metadata
    const povData: any = {
      title: '',
      description: '',
      status: 'PROJECTED',
      priority: 'MEDIUM',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };
    
    // Look for field mappings in template metadata
    const fieldMappings = template.metadata?.fieldMappings || {};
    
    // Apply mappings
    Object.entries(fieldMappings).forEach(([povField, formField]) => {
      if (formData[formField] !== undefined) {
        povData[povField] = formData[formField];
      }
    });
    
    // Ensure required fields have values
    if (!povData.title && formData.title) {
      povData.title = formData.title;
    } else if (!povData.title && formData.name) {
      povData.title = formData.name;
    }
    
    if (!povData.description && formData.description) {
      povData.description = formData.description;
    }
    
    return povData;
  }
}

export const templateService = TemplateService.getInstance();
```

### 5. API Routes

```typescript
// app/api/pov-templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { templateService } from '@/lib/pov/templates/service';
import { ApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await templateService.getAllTemplates();
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
    
    // Generate ID if not provided
    if (!data.id) {
      data.id = `template-${Date.now()}`;
    }
    
    const template = await templateService.createTemplate(data, user.userId);

    return NextResponse.json({ template });
  } catch (error) {
    console.error('[Templates API Error]:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/pov-templates/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { templateService } from '@/lib/pov/templates/service';
import { ApiError } from '@/lib/errors';

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
    
    const template = await templateService.updateTemplate(id, data);

    return NextResponse.json({ template });
  } catch (error) {
    console.error('[Template API Error]:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    
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
    await templateService.deleteTemplate(i
