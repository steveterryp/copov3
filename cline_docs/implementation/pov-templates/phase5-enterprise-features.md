# Phase 5: Enterprise Features and Optimization

## Overview

This phase focuses on adding enterprise-grade features and optimizing performance for the template-based POV system. It implements template inheritance and composition, advanced validation rules, performance optimizations, and enterprise controls.

## Implementation Details

### 1. Template Inheritance and Composition

#### Template Inheritance System

```typescript
// lib/pov/templates/inheritance.ts
import { POVTemplate, FieldDefinition, TemplateSection } from './types';
import { templateService } from './service';
import { ApiError } from '@/lib/errors';

export interface InheritanceConfig {
  extends: string; // Parent template ID
  overrides?: {
    fields?: Record<string, Partial<FieldDefinition>>;
    sections?: Record<string, Partial<TemplateSection>>;
    metadata?: Record<string, any>;
  };
}

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
   * Create a template that inherits from another template
   */
  public async createInheritedTemplate(
    templateData: Partial<POVTemplate>,
    inheritanceConfig: InheritanceConfig
  ): Promise<POVTemplate> {
    // Get parent template
    const parentTemplate = await templateService.getTemplate(inheritanceConfig.extends);
    if (!parentTemplate) {
      throw new ApiError('NOT_FOUND', `Parent template with ID ${inheritanceConfig.extends} not found`);
    }
    
    // Create base template from parent
    const baseTemplate: POVTemplate = {
      ...parentTemplate,
      id: templateData.id || `template-${Date.now()}`,
      name: templateData.name || `${parentTemplate.name} (Inherited)`,
      description: templateData.description || parentTemplate.description,
      version: templateData.version || '1.0.0',
      status: templateData.status || 'draft',
      fields: { ...parentTemplate.fields },
      sections: [...parentTemplate.sections],
      metadata: {
        ...parentTemplate.metadata,
        inheritance: {
          parent: inheritanceConfig.extends,
          timestamp: new Date().toISOString(),
        },
      },
    };
    
    // Apply overrides
    if (inheritanceConfig.overrides) {
      // Override fields
      if (inheritanceConfig.overrides.fields) {
        Object.entries(inheritanceConfig.overrides.fields).forEach(([fieldId, fieldOverrides]) => {
          if (baseTemplate.fields[fieldId]) {
            // Update existing field
            baseTemplate.fields[fieldId] = {
              ...baseTemplate.fields[fieldId],
              ...fieldOverrides,
            };
          } else {
            // Field must exist in parent template
            throw new ApiError('BAD_REQUEST', `Field ${fieldId} does not exist in parent template`);
          }
        });
      }
      
      // Override sections
      if (inheritanceConfig.overrides.sections) {
        Object.entries(inheritanceConfig.overrides.sections).forEach(([sectionId, sectionOverrides]) => {
          const sectionIndex = baseTemplate.sections.findIndex(s => s.id === sectionId);
          if (sectionIndex >= 0) {
            // Update existing section
            baseTemplate.sections[sectionIndex] = {
              ...baseTemplate.sections[sectionIndex],
              ...sectionOverrides,
            };
          } else {
            // Section must exist in parent template
            throw new ApiError('BAD_REQUEST', `Section ${sectionId} does not exist in parent template`);
          }
        });
      }
      
      // Override metadata
      if (inheritanceConfig.overrides.metadata) {
        baseTemplate.metadata = {
          ...baseTemplate.metadata,
          ...inheritanceConfig.overrides.metadata,
          inheritance: baseTemplate.metadata.inheritance, // Preserve inheritance info
        };
      }
    }
    
    // Create the new template
    return await templateService.createTemplate(baseTemplate, 'system');
  }

  /**
   * Get the inheritance chain for a template
   */
  public async getInheritanceChain(templateId: string): Promise<POVTemplate[]> {
    const chain: POVTemplate[] = [];
    let currentId = templateId;
    
    // Prevent infinite loops
    const maxDepth = 10;
    let depth = 0;
    
    while (currentId && depth < maxDepth) {
      const template = await templateService.getTemplate(currentId);
      if (!template) {
        break;
      }
      
      chain.push(template);
      
      // Get parent ID
      const parentId = template.metadata?.inheritance?.parent;
      if (!parentId) {
        break;
      }
      
      currentId = parentId;
      depth++;
    }
    
    return chain;
  }
}

export const templateInheritanceService = TemplateInheritanceService.getInstance();
```

#### Template Fragments

```typescript
// lib/pov/templates/fragments.ts
import { POVTemplate, FieldDefinition, TemplateSection } from './types';
import { ApiError } from '@/lib/errors';

export interface TemplateFragment {
  id: string;
  name: string;
  description: string;
  type: 'fields' | 'section';
  content: any;
}

export class TemplateFragmentService {
  private static instance: TemplateFragmentService;
  private fragments: Map<string, TemplateFragment> = new Map();

  private constructor() {
    // Register some default fragments
    this.registerDefaultFragments();
  }

  public static getInstance(): TemplateFragmentService {
    if (!TemplateFragmentService.instance) {
      TemplateFragmentService.instance = new TemplateFragmentService();
    }
    return TemplateFragmentService.instance;
  }

  /**
   * Register a new fragment
   */
  public registerFragment(fragment: TemplateFragment): void {
    this.fragments.set(fragment.id, fragment);
  }

  /**
   * Get a fragment by ID
   */
  public getFragment(id: string): TemplateFragment | undefined {
    return this.fragments.get(id);
  }

  /**
   * Get all fragments
   */
  public getAllFragments(): TemplateFragment[] {
    return Array.from(this.fragments.values());
  }

  /**
   * Apply a fragment to a template
   */
  public applyFragment(
    template: POVTemplate,
    fragmentId: string,
    options: {
      targetSectionId?: string;
      fieldPrefix?: string;
    } = {}
  ): POVTemplate {
    const fragment = this.getFragment(fragmentId);
    if (!fragment) {
      throw new ApiError('NOT_FOUND', `Fragment with ID ${fragmentId} not found`);
    }
    
    const result = { ...template };
    
    if (fragment.type === 'fields') {
      // Add fields to template
      const fields = fragment.content as Record<string, FieldDefinition>;
      const prefix = options.fieldPrefix || '';
      
      Object.entries(fields).forEach(([fieldId, field]) => {
        const newFieldId = `${prefix}${fieldId}`;
        result.fields[newFieldId] = { ...field };
      });
    } else if (fragment.type === 'section') {
      // Add section to template
      const section = fragment.content as TemplateSection;
      
      if (options.targetSectionId) {
        // Add fields to existing section
        const targetSectionIndex = result.sections.findIndex(s => s.id === options.targetSectionId);
        if (targetSectionIndex >= 0) {
          // Add fields to target section
          result.sections[targetSectionIndex].fields = [
            ...result.sections[targetSectionIndex].fields,
            ...section.fields,
          ];
        } else {
          throw new ApiError('BAD_REQUEST', `Target section ${options.targetSectionId} not found`);
        }
      } else {
        // Add as new section
        result.sections.push({ ...section });
      }
    }
    
    return result;
  }

  /**
   * Register default fragments
   */
  private registerDefaultFragments(): void {
    // Contact information fragment
    this.registerFragment({
      id: 'contact-info',
      name: 'Contact Information',
      description: 'Common contact information fields',
      type: 'fields',
      content: {
        'contactName': {
          type: 'text',
          label: 'Contact Name',
          required: true,
          validation: {
            min: 2,
            max: 100,
          },
        },
        'contactEmail': {
          type: 'email',
          label: 'Contact Email',
          required: true,
          validation: {
            customValidator: 'isValidEmail',
          },
        },
        'contactPhone': {
          type: 'phone',
          label: 'Contact Phone',
          required: false,
          validation: {
            customValidator: 'isValidPhone',
          },
        },
      },
    });
    
    // Business requirements section fragment
    this.registerFragment({
      id: 'business-requirements',
      name: 'Business Requirements',
      description: 'Section for capturing business requirements',
      type: 'section',
      content: {
        id: 'business-requirements',
        title: 'Business Requirements',
        description: 'Capture the business requirements for this POV',
        order: 2,
        fields: [
          'businessGoals',
          'successCriteria',
          'stakeholders',
          'timeline',
        ],
      },
    });
  }
}

export const templateFragmentService = TemplateFragmentService.getInstance();
```

#### Template Versioning and Migration

```typescript
// lib/pov/templates/versioning.ts
import { POVTemplate } from './types';
import { templateService } from './service';
import { ApiError } from '@/lib/errors';

export interface VersionInfo {
  id: string;
  version: string;
  timestamp: Date;
  changes: string[];
}

export interface MigrationStep {
  fieldId: string;
  action: 'add' | 'remove' | 'rename' | 'modify';
  details: any;
}

export interface Migration {
  fromVersion: string;
  toVersion: string;
  steps: MigrationStep[];
}

export class TemplateVersioningService {
  private static instance: TemplateVersioningService;
  private versions: Map<string, VersionInfo[]> = new Map();
  private migrations: Map<string, Migration[]> = new Map();

  private constructor() {}

  public static getInstance(): TemplateVersioningService {
    if (!TemplateVersioningService.instance) {
      TemplateVersioningService.instance = new TemplateVersioningService();
    }
    return TemplateVersioningService.instance;
  }

  /**
   * Create a new version of a template
   */
  public async createNewVersion(
    templateId: string,
    changes: string[],
    templateUpdates: Partial<POVTemplate>
  ): Promise<POVTemplate> {
    // Get current template
    const currentTemplate = await templateService.getTemplate(templateId);
    if (!currentTemplate) {
      throw new ApiError('NOT_FOUND', `Template with ID ${templateId} not found`);
    }
    
    // Parse current version
    const currentVersion = currentTemplate.version || '1.0.0';
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    // Increment version
    // For simplicity, we're just incrementing the minor version
    const newVersion = `${major}.${minor + 1}.0`;
    
    // Create new template version
    const newTemplate: POVTemplate = {
      ...currentTemplate,
      ...templateUpdates,
      version: newVersion,
      metadata: {
        ...currentTemplate.metadata,
        previousVersion: currentVersion,
      },
    };
    
    // Update template
    const updatedTemplate = await templateService.updateTemplate(templateId, newTemplate);
    
    // Record version info
    this.recordVersion(templateId, {
      id: templateId,
      version: newVersion,
      timestamp: new Date(),
      changes,
    });
    
    return updatedTemplate;
  }

  /**
   * Record version information
   */
  private recordVersion(templateId: string, versionInfo: VersionInfo): void {
    if (!this.versions.has(templateId)) {
      this.versions.set(templateId, []);
    }
    
    this.versions.get(templateId)!.push(versionInfo);
  }

  /**
   * Get version history for a template
   */
  public getVersionHistory(templateId: string): VersionInfo[] {
    return this.versions.get(templateId) || [];
  }

  /**
   * Register a migration between versions
   */
  public registerMigration(templateId: string, migration: Migration): void {
    if (!this.migrations.has(templateId)) {
      this.migrations.set(templateId, []);
    }
    
    this.migrations.get(templateId)!.push(migration);
  }

  /**
   * Get migrations for a template
   */
  public getMigrations(templateId: string): Migration[] {
    return this.migrations.get(templateId) || [];
  }

  /**
   * Migrate form data from one version to another
   */
  public migrateFormData(
    templateId: string,
    formData: Record<string, any>,
    fromVersion: string,
    toVersion: string
  ): Record<string, any> {
    const migrations = this.getMigrations(templateId);
    const result = { ...formData };
    
    // Find applicable migrations
    const applicableMigrations = migrations.filter(
      m => this.compareVersions(m.fromVersion, fromVersion) >= 0 && 
           this.compareVersions(m.toVersion, toVersion) <= 0
    );
    
    // Apply migrations in order
    applicableMigrations.forEach(migration => {
      migration.steps.forEach(step => {
        switch (step.action) {
          case 'add':
            // Add new field with default value
            result[step.fieldId] = step.details.defaultValue;
            break;
            
          case 'remove':
            // Remove field
            delete result[step.fieldId];
            break;
            
          case 'rename':
            // Rename field
            if (result[step.fieldId] !== undefined) {
              result[step.details.newFieldId] = result[step.fieldId];
              delete result[step.fieldId];
            }
            break;
            
          case 'modify':
            // Modify field value
            if (result[step.fieldId] !== undefined) {
              // Apply transformer function if provided
              if (step.details.transformer) {
                result[step.fieldId] = step.details.transformer(result[step.fieldId]);
              }
            }
            break;
        }
      });
    });
    
    return result;
  }

  /**
   * Compare two version strings
   * Returns:
   * - negative if v1 < v2
   * - 0 if v1 === v2
   * - positive if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 !== part2) {
        return part1 - part2;
      }
    }
    
    return 0;
  }
}

export const templateVersioningService = TemplateVersioningService.getInstance();
```

### 2. Advanced Validation Rules

#### Cross-Field Validation

```typescript
// lib/pov/templates/validation.ts
import { POVTemplate, FieldDefinition } from './types';
import { templateValidator } from './validator';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (data: Record<string, any>, template: POVTemplate) => boolean | string;
}

export class AdvancedValidationService {
  private static instance: AdvancedValidationService;
  private rules: Map<string, ValidationRule> = new Map();

  private constructor() {
    // Register default rules
    this.registerDefaultRules();
  }

  public static getInstance(): AdvancedValidationService {
    if (!AdvancedValidationService.instance) {
      AdvancedValidationService.instance = new AdvancedValidationService();
    }
    return AdvancedValidationService.instance;
  }

  /**
   * Register a validation rule
   */
  public registerRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Get a rule by ID
   */
  public getRule(id: string): ValidationRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get all rules
   */
  public getAllRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Validate form data against all rules
   */
  public validateFormData(
    data: Record<string, any>,
    template: POVTemplate
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    
    // First, validate against basic field validation
    const basicValidation = templateValidator.validatePOVData(data, template);
    if (!basicValidation.valid) {
      return basicValidation;
    }
    
    // Get rules from template metadata
    const ruleIds = template.metadata?.validationRules || [];
    
    // Apply each rule
    ruleIds.forEach(ruleId => {
      const rule = this.getRule(ruleId);
      if (!rule) return;
      
      const result = rule.validate(data, template);
      if (result !== true) {
        errors[rule.id] = typeof result === 'string' ? result : rule.description;
      }
    });
    
    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Register default validation rules
   */
  private registerDefaultRules(): void {
    // Date range validation
    this.registerRule({
      id: 'date-range',
      name: 'Date Range',
      description: 'End date must be after start date',
      validate: (data, template) => {
        const startDateField = Object.entries(template.fields).find(
          ([_, field]) => field.metadata?.isStartDate
        );
        
        const endDateField = Object.entries(template.fields).find(
          ([_, field]) => field.metadata?.isEndDate
        );
        
        if (!startDateField || !endDateField) {
          return true;
        }
        
        const [startFieldId, _] = startDateField;
        const [endFieldId, __] = endDateField;
        
        const startDate = new Date(data[startFieldId]);
        const endDate = new Date(data[endFieldId]);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return true;
        }
        
        return startDate <= endDate || 'End date must be after start date';
      },
    });
    
    // Conditional required fields
    this.registerRule({
      id: 'conditional-required',
      name: 'Conditional Required Fields',
      description: 'Some fields are required based on other field values',
      validate: (data, template) => {
        let valid = true;
        let message = '';
        
        // Check each field for conditional requirements
        Object.entries(template.fields).forEach(([fieldId, field]) => {
          if (field.metadata?.requiredIf) {
            const condition = field.metadata.requiredIf;
            const targetField = condition.field;
            const targetValue = condition.value;
            
            // Check if condition is met
            if (data[targetField] === targetValue) {
              // Field is required
              if (!data[fieldId]) {
                valid = false;
                message = `${field.label} is required when ${template.fields[targetField]?.label} is ${targetValue}`;
              }
            }
          }
        });
        
        return valid || message;
      },
    });
    
    // Numeric range validation
    this.registerRule({
      id: 'numeric-range',
      name: 'Numeric Range',
      description: 'Numeric fields must be within specified ranges',
      validate: (data, template) => {
        let valid = true;
        let message = '';
        
        // Check each numeric field with range metadata
        Object.entries(template.fields).forEach(([fieldId, field]) => {
          if (field.type === 'number' && field.metadata?.range) {
            const value = parseFloat(data[fieldId]);
            const range = field.metadata.range;
            
            if (!isNaN(value)) {
              if (range.min !== undefined && value < range.min) {
                valid = false;
                message = `${field.label} must be at least ${range.min}`;
              } else if (range.max !== undefined && value > range.max) {
                valid = false;
                message = `${field.label} must be at most ${range.max}`;
              }
            }
          }
        });
        
        return valid || message;
      },
    });
  }
}

export const advancedValidationService = AdvancedValidationService.getInstance();
```

#### Business Rule Enforcement

```typescript
// lib/pov/templates/business-rules.ts
import { POVTemplate } from './types';

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  evaluate: (data: Record<string, any>, template: POVTemplate) => boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface BusinessRuleResult {
  ruleId: string;
  name: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export class BusinessRuleService {
  private static instance: BusinessRuleService;
  private rules: Map<string, BusinessRule> = new Map();

  private constructor() {
    // Register default rules
    this.registerDefaultRules();
  }

  public static getInstance(): BusinessRuleService {
    if (!BusinessRuleService.instance) {
      BusinessRuleService.instance = new BusinessRuleService();
    }
    return BusinessRuleService.instance;
  }

  /**
   * Register a business rule
   */
  public registerRule(rule: BusinessRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Get a rule by ID
   */
  public getRule(id: string): BusinessRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get all rules
   */
  public getAllRules(): BusinessRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Evaluate form data against business rules
   */
  public evaluateRules(
    data: Record<string, any>,
    template: POVTemplate
  ): BusinessRuleResult[] {
    const results: BusinessRuleResult[] = [];
    
    // Get rules from template metadata
    const ruleIds = template.metadata?.businessRules || [];
    
    // Apply each rule
    ruleIds.forEach(ruleId => {
      const rule = this.getRule(ruleId);
      if (!rule) return;
      
      const passed = rule.evaluate(data, template);
      
      results.push({
        ruleId: rule.id,
        name: rule.name,
        passed,
        message: rule.message,
        severity: rule.severity,
      });
    });
    
    return results;
  }

  /**
   * Register default business rules
   */
  private registerDefaultRules(): void {
    // High value opportunity rule
    this.registerRule({
      id: 'high-value-opportunity',
      name: 'High Value Opportunity',
      description: 'Opportunities over $100,000 should have executive sponsor',
      evaluate: (data, template) => {
        const valueField = Object.entries(template.fields).find(
          ([_, field]) => field.metadata?.isOpportunityValue
        );
        
        const sponsorField = Object.entries(template.fields).find(
          ([_, field]) => field.metadata?.isExecutiveSponsor
        );
        
        if (!valueField || !sponsorField) {
          return true;
        }
        
        const [valueFieldId, _] = valueField;
        const [sponsorFieldId, __] = sponsorField;
        
        const value = parseFloat(data[valueFieldId]);
        const sponsor = data[sponsorFieldId];
        
        if (isNaN(value)) {
          return true;
        }
        
        return value <= 100000 || !!sponsor;
      },
      message: 'High value opportunities ($100,000+) should have an executive sponsor',
      severity: 'warning',
    });
    
    // Short timeline rule
    this.registerRule({
      id: 'short-timeline',
      name: 'Short Timeline',
      description: 'POVs with less than 30 days should have expedited approval',
      evaluate: (data, template) => {
        const startDateField = Object.entries(template.fields).find(
          ([_, field]) => field.metadata?.isStartDate
        );
        
        const endDateField = Object.entries(template.fields).find(
          ([_, field]) => field.metadata?.isEndDate
        );
        
        const expeditedField = Object.entries(template.fields).find(
          ([_, field]) => field.metadata?.isExpedited
        );
        
        if (!startDateField || !endDateField || !expeditedField) {
          return true;
        }
        
        const [startFieldId, _] = startDateField;
        const [endFieldId, __] = endDateField;
        const [expeditedFieldId, ___] = expeditedField;
        
        const startDate = new Date(data[startFieldId]);
        const endDate = new Date(data[endFieldId]);
        const expedited = data[expeditedFieldId];
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return true;
        }
        
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return days >= 30 || !!expedited;
      },
      message: 'POVs with less than 30 days should have expedited approval',
      severity: 'warning',
    });
  }
}

export const businessRuleService = BusinessRuleService.getInstance();
```

### 3. Performance Optimization

#### Schema Caching

```typescript
// lib/pov/templates/cache.ts
import { POVTemplate } from './types';

export class TemplateCacheService {
  private static instance: TemplateCacheService;
  private cache: Map<string, { template: POVTemplate; timestamp: number }> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): TemplateCacheService {
    if (!TemplateCacheService.instance) {
      TemplateCacheService.instance = new TemplateCacheService();
    }
    return TemplateCacheService.instance;
  }

  /**
   * Set cache TTL (time to live) in milliseconds
   */
  public setTTL(ttl: number): void {
    this.ttl = ttl;
  }

  /**
   * Get template from cache
   */
  public getTemplate(id: string): POVTemplate | null {
    const cached = this.cache.get(id);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(id);
      return null;
    }
    
    return cached.template;
  }

  /**
   * Set template in cache
   */
  public setTemplate(template: POVTemplate): void {
    this.cache.set(template.id, {
      template,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache for a template
   */
  public clearTemplate(id: string): void {
    this.cache.delete(id);
  }

  /**
   * Clear all cache
   */
  public clearAll(): void {
    this.cache.clear();
  }
}

export const templateCacheService = TemplateCacheService.getInstance();
```

#### Optimized Validation

```typescript
// lib/pov/templates/optimized-validator.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { POVTemplate, FieldDefinition } from './types';
import { templateCacheService } from './cache';

export class OptimizedValidator {
  private static instance: OptimizedValidator;
  private ajv: Ajv;
  private validators: Map<string, ReturnType<Ajv['compile']>> = new Map();

  private constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  public static getInstance(): OptimizedValidator {
    if (!OptimizedValidator.instance) {
      OptimizedValidator.instance = new OptimizedValidator();
    }
    return OptimizedValidator.instance;
  }

  /**
   * Validate form data against a template
   */
  public validateFormData(
    data: Record<string, any>,
    template: POVTemplate
  ): { valid: boolean; errors: Record<string, string> } {
    // Get or create validator for this template
    const validator = this.getValidator(template);
    
    // Validate data
    const valid = validator(data);
    
    if (valid) {
      return { valid: true, errors: {} };
    }
    
    // Format errors
    const errors: Record<string, string> = {};
    
    if (validator.errors) {
      validator.errors.forEach(error => {
        const path = error.instancePath.replace(/^\//, '');
        const field = template.fields[path];
        
        if (field) {
          errors[path] = this.formatError(error, field);
        } else {
          errors[path || 'general'] = error.message || 'Invalid value';
        }
      });
    }
    
    return { valid: false, errors };
  }

  /**
   * Get or create validator for a template
   */
  private getValidator(template: POVTemplate): ReturnType<Ajv['compile']> {
    // Check if validator exists in cache
    if (this.validators.has(template.id)) {
      return this.validators.get(template.id)!;
    }
    
    // Create JSON Schema from template
    const schema = this.createJsonSchema(template);
    
    //
