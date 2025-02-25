# Phase 2: Template-Based POV Creation

## Overview

This phase builds on the JSON Schema foundation to enable the creation of POVs using templates. It focuses on implementing dynamic form generation, template selection UI, updating the POV creation flow, and creating a template management interface.

## Implementation Details

### 1. Dynamic Form Generation

#### Form Generator Component

```tsx
// components/pov/templates/DynamicForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { POVTemplate, FieldDefinition, TemplateSection } from '@/lib/pov/templates/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { DatePicker } from '@/components/ui/DatePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/Form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface DynamicFormProps {
  template: POVTemplate;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  isSubmitting?: boolean;
}

export function DynamicForm({
  template,
  initialData = {},
  onSubmit,
  isSubmitting = false,
}: DynamicFormProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  
  // Generate Zod schema from template
  const generateZodSchema = (template: POVTemplate) => {
    const schemaObj: Record<string, any> = {};
    
    Object.entries(template.fields).forEach(([fieldId, field]) => {
      let fieldSchema: any = z.any();
      
      // Create field schema based on type
      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'phone':
        case 'url':
          fieldSchema = z.string();
          if (field.validation?.min) {
            fieldSchema = fieldSchema.min(field.validation.min);
          }
          if (field.validation?.max) {
            fieldSchema = fieldSchema.max(field.validation.max);
          }
          if (field.validation?.pattern) {
            fieldSchema = fieldSchema.regex(new RegExp(field.validation.pattern));
          }
          if (field.type === 'email') {
            fieldSchema = fieldSchema.email();
          }
          if (field.type === 'url') {
            fieldSchema = fieldSchema.url();
          }
          break;
          
        case 'number':
        case 'currency':
          fieldSchema = z.number();
          if (field.validation?.min) {
            fieldSchema = fieldSchema.min(field.validation.min);
          }
          if (field.validation?.max) {
            fieldSchema = fieldSchema.max(field.validation.max);
          }
          break;
          
        case 'date':
          fieldSchema = z.date();
          break;
          
        case 'boolean':
          fieldSchema = z.boolean();
          break;
          
        case 'select':
          if (field.validation?.options) {
            const values = field.validation.options.map(opt => opt.value);
            fieldSchema = z.enum(values as [string, ...string[]]);
          } else {
            fieldSchema = z.string();
          }
          break;
          
        case 'multiselect':
          fieldSchema = z.array(z.string());
          break;
      }
      
      // Make field optional if not required
      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaObj[fieldId] = fieldSchema;
    });
    
    return z.object(schemaObj);
  };
  
  const formSchema = generateZodSchema(template);
  
  // Set up form with validation
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });
  
  // Set active tab to first section on load
  useEffect(() => {
    if (template.sections.length > 0 && !activeTab) {
      setActiveTab(template.sections[0].id);
    }
  }, [template, activeTab]);
  
  // Check if a section should be shown based on conditional logic
  const shouldShowSection = (section: TemplateSection): boolean => {
    if (!section.conditional) return true;
    
    const { field, operator, value } = section.conditional;
    const fieldValue = form.watch(field);
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(value) : String(fieldValue).includes(String(value));
      case 'greaterThan':
        return Number(fieldValue) > Number(value);
      case 'lessThan':
        return Number(fieldValue) < Number(value);
      default:
        return true;
    }
  };
  
  // Check if a field should be shown based on conditional logic
  const shouldShowField = (field: FieldDefinition): boolean => {
    if (!field.conditional) return true;
    
    const { field: condField, operator, value } = field.conditional;
    const fieldValue = form.watch(condField);
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(value) : String(fieldValue).includes(String(value));
      case 'greaterThan':
        return Number(fieldValue) > Number(value);
      case 'lessThan':
        return Number(fieldValue) < Number(value);
      default:
        return true;
    }
  };
  
  // Render a field based on its type
  const renderField = (fieldId: string, field: FieldDefinition) => {
    if (!shouldShowField(field)) return null;
    
    const fieldWidth = field.ui?.width || 'full';
    const widthClasses = {
      full: 'w-full',
      half: 'w-full sm:w-1/2',
      third: 'w-full sm:w-1/3',
      quarter: 'w-full sm:w-1/4',
    };
    
    return (
      <div key={fieldId} className={`${widthClasses[fieldWidth]} px-2 mb-4`}>
        <FormField
          control={form.control}
          name={fieldId}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                {renderFieldInput(field, formField)}
              </FormControl>
              {field.description && (
                <FormDescription>{field.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };
  
  // Render the appropriate input component for a field
  const renderFieldInput = (field: FieldDefinition, formField: any) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            {...formField}
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            placeholder={field.placeholder || ''}
          />
        );
        
      case 'textarea':
        return (
          <Textarea
            {...formField}
            placeholder={field.placeholder || ''}
          />
        );
        
      case 'number':
      case 'currency':
        return (
          <Input
            {...formField}
            type="number"
            placeholder={field.placeholder || ''}
            onChange={(e) => formField.onChange(parseFloat(e.target.value))}
          />
        );
        
      case 'date':
        return (
          <DatePicker
            date={formField.value}
            setDate={formField.onChange}
            placeholder={field.placeholder || 'Select date'}
          />
        );
        
      case 'boolean':
        return (
          <Checkbox
            checked={formField.value}
            onCheckedChange={formField.onChange}
          />
        );
        
      case 'select':
        return (
          <Select
            value={formField.value}
            onValueChange={formField.onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.validation?.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'multiselect':
        // This is a simplified implementation - a real multiselect would need more complex UI
        return (
          <Select
            value={formField.value?.[0] || ''}
            onValueChange={(value) => formField.onChange([value])}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select options'} />
            </SelectTrigger>
            <SelectContent>
              {field.validation?.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      default:
        return <Input {...formField} />;
    }
  };
  
  // Sort sections by order if specified
  const sortedSections = [...template.sections].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return 0;
  });
  
  // Filter sections based on conditional logic
  const visibleSections = sortedSections.filter(shouldShowSection);
  
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {visibleSections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {visibleSections.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              <Card className="p-6">
                {section.description && (
                  <p className="text-sm text-gray-500 mb-4">{section.description}</p>
                )}
                
                <div className="flex flex-wrap -mx-2">
                  {section.fields.map((fieldId) => 
                    renderField(fieldId, template.fields[fieldId])
                  )}
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex justify-end mt-6 space-x-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
```

#### Form Utilities

```typescript
// lib/pov/templates/form-utils.ts
import { POVTemplate, FieldDefinition } from './types';

/**
 * Generate default values for a template
 */
export function generateDefaultValues(template: POVTemplate): Record<string, any> {
  const defaultValues: Record<string, any> = {};
  
  Object.entries(template.fields).forEach(([fieldId, field]) => {
    if (field.defaultValue !== undefined) {
      defaultValues[fieldId] = field.defaultValue;
    } else {
      // Set type-specific defaults
      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'phone':
        case 'url':
          defaultValues[fieldId] = '';
          break;
          
        case 'number':
        case 'currency':
          defaultValues[fieldId] = 0;
          break;
          
        case 'date':
          defaultValues[fieldId] = null;
          break;
          
        case 'boolean':
          defaultValues[fieldId] = false;
          break;
          
        case 'select':
          if (field.validation?.options && field.validation.options.length > 0) {
            defaultValues[fieldId] = field.validation.options[0].value;
          } else {
            defaultValues[fieldId] = '';
          }
          break;
          
        case 'multiselect':
          defaultValues[fieldId] = [];
          break;
      }
    }
  });
  
  return defaultValues;
}

/**
 * Format form data for display
 */
export function formatFieldValue(value: any, field: FieldDefinition): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  switch (field.type) {
    case 'date':
      return value instanceof Date 
        ? value.toLocaleDateString() 
        : new Date(value).toLocaleDateString();
      
    case 'boolean':
      return value ? 'Yes' : 'No';
      
    case 'select':
      if (field.validation?.options) {
        const option = field.validation.options.find(opt => opt.value === value);
        return option ? option.label : String(value);
      }
      return String(value);
      
    case 'multiselect':
      if (Array.isArray(value) && field.validation?.options) {
        return value
          .map(v => {
            const option = field.validation.options?.find(opt => opt.value === v);
            return option ? option.label : v;
          })
          .join(', ');
      }
      return Array.isArray(value) ? value.join(', ') : String(value);
      
    case 'currency':
      return typeof value === 'number' 
        ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        : String(value);
      
    default:
      return String(value);
  }
}
```

### 2. Template Selection UI

#### Template Browser Component

```tsx
// components/pov/templates/TemplateBrowser.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { POVTemplate } from '@/lib/pov/templates/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter, Calendar, Tag, Users, CheckCircle } from 'lucide-react';

interface TemplateBrowserProps {
  templates: POVTemplate[];
  onSelectTemplate: (template: POVTemplate) => void;
}

export function TemplateBrowser({ templates, onSelectTemplate }: TemplateBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState<POVTemplate[]>(templates);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Extract categories from template metadata
  const categories = Array.from(
    new Set(
      templates
        .map(t => t.metadata?.category)
        .filter(Boolean) as string[]
    )
  );
  
  // Filter templates based on search term and category
  useEffect(() => {
    let filtered = templates;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t => 
          t.name.toLowerCase().includes(term) || 
          t.description.toLowerCase().includes(term)
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(
        t => t.metadata?.category === selectedCategory
      );
    }
    
    setFilteredTemplates(filtered);
  }, [searchTerm, selectedCategory, templates]);
  
  // Get template icon based on metadata or default
  const getTemplateIcon = (template: POVTemplate) => {
    const iconType = template.metadata?.icon || 'default';
    
    switch (iconType) {
      case 'calendar':
        return <Calendar className="h-8 w-8 text-blue-500" />;
      case 'users':
        return <Users className="h-8 w-8 text-green-500" />;
      case 'tag':
        return <Tag className="h-8 w-8 text-purple-500" />;
      case 'check':
        return <CheckCircle className="h-8 w-8 text-emerald-500" />;
      default:
        return <Filter className="h-8 w-8 text-gray-500" />;
    }
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'deprecated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            All
          </Button>
          
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No templates found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {getTemplateIcon(template)}
                </div>
                
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-lg">{template.name}</h3>
                    <Badge className={getStatusColor(template.status || 'draft')}>
                      {template.status || 'draft'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {template.metadata?.tags && Array.isArray(template.metadata.tags) && 
                      template.metadata.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Template Preview Component

```tsx
// components/pov/templates/TemplatePreview.tsx
import React from 'react';
import { POVTemplate, TemplateSection } from '@/lib/pov/templates/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Eye, FileText, List, CheckSquare } from 'lucide-react';

interface TemplatePreviewProps {
  template: POVTemplate;
  onBack: () => void;
  onUseTemplate: () => void;
}

export function TemplatePreview({ template, onBack, onUseTemplate }: TemplatePreviewProps) {
  // Sort sections by order if specified
  const sortedSections = [...template.sections].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return 0;
  });
  
  // Get field type icon
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
      case 'textarea':
        return <FileText className="h-4 w-4" />;
      case 'select':
      case 'multiselect':
        return <List className="h-4 w-4" />;
      case 'boolean':
        return <CheckSquare className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to templates
        </Button>
      </div>
      
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{template.name}</h2>
            <p className="text-gray-500 mt-1">{template.description}</p>
          </div>
          
          <Badge className="bg-blue-100 text-blue-800">
            v{template.version || '1.0.0'}
          </Badge>
        </div>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-3">Template Sections</h3>
            <div className="space-y-4">
              {sortedSections.map((section, index) => (
                <Card key={section.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    <h4 className="font-medium">{section.title}</h4>
                  </div>
                  
                  {section.description && (
                    <p className="text-sm text-gray-500 mb-3">{section.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {section.fields.map(fieldId => {
                      const field = template.fields[fieldId];
                      if (!field) return null;
                      
                      return (
                        <div key={fieldId} className="flex items-center gap-2 text-sm">
                          {getFieldTypeIcon(field.type)}
                          <span className="font-medium">{field.label}</span>
                          {field.required && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {template.metadata && (
            <div>
              <h3 className="text-lg font-medium mb-3">Additional Information</h3>
              <Card className="p-4">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {Object.entries(template.metadata)
                    .filter(([key]) => !['tags', 'icon', 'category'].includes(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <dt className="text-sm font-medium text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </dt>
                        <dd className="text-sm">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </dd>
                      </div>
                    ))
                  }
                </dl>
              </Card>
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-end">
          <Button onClick={onUseTemplate}>
            Use This Template
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 3. POV Creation Flow

#### Template Selection Page

```tsx
// app/(authenticated)/pov/create/template/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { POVTemplate } from '@/lib/pov/templates/types';
import { TemplateBrowser } from '@/components/pov/templates/TemplateBrowser';
import { TemplatePreview } from '@/components/pov/templates/TemplatePreview';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2 } from 'lucide-react';

export default function SelectTemplatePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<POVTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<POVTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/pov-templates');
        
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        
        const data = await response.json();
        setTemplates(data.templates || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Handle template selection
  const handleSelectTemplate = (template: POVTemplate) => {
    setSelectedTemplate(template);
  };
  
  // Handle back button click
  const handleBack = () => {
    setSelectedTemplate(null);
  };
  
  // Handle use template button click
  const handleUseTemplate = () => {
    if (selectedTemplate) {
      router.push(`/pov/create/form?templateId=${selectedTemplate.id}`);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {selectedTemplate ? 'Template Preview' : 'Select a Template'}
      </h1>
      
      {selectedTemplate ? (
        <TemplatePreview
          template={selectedTemplate}
          onBack={handleBack}
          onUseTemplate={handleUseTemplate}
        />
      ) : (
        <TemplateBrowser
          templates={templates}
          onSelectTemplate={handleSelectTemplate}
        />
      )}
    </div>
  );
}
```

#### Template Form Page

```tsx
// app/(authenticated)/pov/create/form/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { POVTemplate } from '@/lib/pov/templates/types';
import { DynamicForm } from '@/components/pov/templates/DynamicForm';
import { generateDefaultValues } from '@/lib/pov/templates/form-utils';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2 } from 'lucide-react';

export default function TemplateFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  
  const [template, setTemplate] = useState<POVTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch template on component mount
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) {
        setError('No template ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/pov-templates/${templateId}`
