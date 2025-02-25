# Phase 3: UI Components and User Experience

## Overview

Phase 3 focuses on creating the user interface for template selection and management. This phase will provide an intuitive experience for users to select templates when creating phases and for administrators to manage templates.

## Implementation Steps

### 1. Create Template Selector Component

Implement a component that allows users to select a template when creating a phase.

```typescript
// components/phase/TemplateSelector.tsx
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PhaseType } from "@prisma/client";
import { TemplateConfig } from "@/lib/pov/templates/types";
import { Skeleton } from "@/components/ui/Skeleton";

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
  defaultType?: PhaseType;
}

export default function TemplateSelector({ onSelect, defaultType = PhaseType.PLANNING }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PhaseType>(defaultType);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setTemplates(data.templates || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter(template => template.type === activeTab);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">Error: {error}</div>;
  }

  return (
    <div className="w-full">
      <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as PhaseType)}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value={PhaseType.PLANNING}>Planning</TabsTrigger>
          <TabsTrigger value={PhaseType.EXECUTION}>Execution</TabsTrigger>
          <TabsTrigger value={PhaseType.REVIEW}>Review</TabsTrigger>
        </TabsList>

        {Object.values(PhaseType).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            {filteredTemplates.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground">
                No {type.toLowerCase()} templates available
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:bg-accent/10 transition-colors">
                    <CardHeader>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="text-sm text-muted-foreground mb-2">
                          {template.stages.length} stages, {template.stages.reduce((acc, stage) => acc + stage.tasks.length, 0)} tasks
                        </div>
                        <div className="text-sm">
                          {template.stages.map(stage => stage.name).join(', ')}
                        </div>
                      </div>
                      <Button onClick={() => onSelect(template.id)} className="w-full">
                        Select Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

### 2. Create Template Preview Component

Implement a component that displays a preview of a template.

```typescript
// components/phase/TemplatePreview.tsx
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { TemplateConfig, StageConfig, TaskConfig } from "@/lib/pov/templates/types";
import { Skeleton } from "@/components/ui/Skeleton";

interface TemplatePreviewProps {
  templateId: string;
}

export default function TemplatePreview({ templateId }: TemplatePreviewProps) {
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/templates/${templateId}`);
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setTemplate(data.template);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setLoading(false);
      }
    };
    
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">Error: {error}</div>;
  }

  if (!template) {
    return <div className="text-muted-foreground p-4">No template selected</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Badge variant="outline" className="mr-2">{template.type}</Badge>
          <Badge variant="outline">{template.stages.length} Stages</Badge>
        </div>
        
        <Accordion type="multiple" className="w-full">
          {template.stages.map((stage, index) => (
            <AccordionItem key={index} value={`stage-${index}`}>
              <AccordionTrigger>
                <div className="flex items-center">
                  <span className="mr-2">{stage.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stage.tasks.length} Tasks
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 border-l-2 border-muted space-y-2">
                  {stage.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {stage.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    {stage.tasks.map((task, taskIndex) => (
                      <Card key={taskIndex} className="p-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground">
                                {task.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {task.required && (
                              <Badge variant="default" className="text-xs">Required</Badge>
                            )}
                            {task.priority && (
                              <Badge variant="outline" className="text-xs">{task.priority}</Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
```

### 3. Create Template Editor Component

Implement a component that allows administrators to create and edit templates.

```typescript
// components/admin/TemplateEditor.tsx
'use client';

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PhaseType, StageStatus } from "@prisma/client";
import { TemplateConfig, StageConfig, TaskConfig } from "@/lib/pov/templates/types";
import { PlusCircle, Trash2, MoveUp, MoveDown } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/ui/useToast";

// Define schema for form validation
const templateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  type: z.nativeEnum(PhaseType),
  stages: z.array(z.object({
    name: z.string().min(2, { message: "Stage name is required" }),
    description: z.string().optional(),
    status: z.nativeEnum(StageStatus).optional(),
    tasks: z.array(z.object({
      key: z.string().min(1, { message: "Task key is required" }),
      title: z.string().min(2, { message: "Task title is required" }),
      description: z.string().optional(),
      required: z.boolean().default(false),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
      dependencies: z.array(z.string()).optional(),
    })),
    dependencies: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
  })),
  metadata: z.record(z.any()).optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateEditorProps {
  templateId?: string;
  onSave?: (template: TemplateConfig) => void;
  onCancel?: () => void;
}

export default function TemplateEditor({ templateId, onSave, onCancel }: TemplateEditorProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Initialize form
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      type: PhaseType.PLANNING,
      stages: [],
    },
  });
  
  // Setup field arrays for stages and tasks
  const { fields: stageFields, append: appendStage, remove: removeStage, move: moveStage } = 
    useFieldArray({ control: form.control, name: "stages" });
  
  // Load template data if editing
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/templates/${templateId}`);
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Reset form with template data
        form.reset(data.template);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [templateId, form]);
  
  // Handle form submission
  const onSubmit = async (values: TemplateFormValues) => {
    try {
      setLoading(true);
      
      // Generate ID if not provided
      if (!values.id) {
        values.id = `${values.type.toLowerCase()}-${Date.now()}`;
      }
      
      const response = await fetch(templateId ? `/api/templates/${templateId}` : '/api/templates', {
        method: templateId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: "Success",
        description: `Template ${templateId ? 'updated' : 'created'} successfully`,
      });
      
      if (onSave) {
        onSave(data.template);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to ${templateId ? 'update' : 'create'} template`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new stage
  const handleAddStage = () => {
    appendStage({
      name: `Stage ${stageFields.length + 1}`,
      description: "",
      status: StageStatus.PENDING,
      tasks: [],
    });
  };
  
  // Add a new task to a stage
  const handleAddTask = (stageIndex: number) => {
    const tasks = form.getValues(`stages.${stageIndex}.tasks`) || [];
    
    form.setValue(`stages.${stageIndex}.tasks`, [
      ...tasks,
      {
        key: `task-${Date.now()}`,
        title: `Task ${tasks.length + 1}`,
        description: "",
        required: false,
        priority: 'MEDIUM',
      }
    ]);
  };
  
  // Remove a task from a stage
  const handleRemoveTask = (stageIndex: number, taskIndex: number) => {
    const tasks = form.getValues(`stages.${stageIndex}.tasks`) || [];
    tasks.splice(taskIndex, 1);
    form.setValue(`stages.${stageIndex}.tasks`, tasks);
  };
  
  // Move a stage up or down
  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      moveStage(index, index - 1);
    } else if (direction === 'down' && index < stageFields.length - 1) {
      moveStage(index, index + 1);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{templateId ? 'Edit' : 'Create'} Template</CardTitle>
        <CardDescription>
          {templateId 
            ? 'Update an existing template' 
            : 'Create a new template for phases'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="stages">Stages</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Template name" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for the template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Template description" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of the template's purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phase Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select phase type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PhaseType.PLANNING}>Planning</SelectItem>
                          <SelectItem value={PhaseType.EXECUTION}>Execution</SelectItem>
                          <SelectItem value={PhaseType.REVIEW}>Review</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of phase this template is for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="stages" className="space-y-6">
                {stageFields.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">No stages added yet</p>
                    <Button type="button" onClick={handleAddStage}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add First Stage
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {stageFields.map((field, stageIndex) => (
                      <Card key={field.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <FormField
                                control={form.control}
                                name={`stages.${stageIndex}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Stage Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveStage(stageIndex, 'up')}
                                disabled={stageIndex === 0}
                              >
                                <MoveUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveStage(stageIndex, 'down')}
                                disabled={stageIndex === stageFields.length - 1}
                              >
                                <MoveDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStage(stageIndex)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`stages.${stageIndex}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`stages.${stageIndex}.status`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Initial Status</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={StageStatus.PENDING}>Pending</SelectItem>
                                    <SelectItem value={StageStatus.ACTIVE}>Active</SelectItem>
                                    <SelectItem value={StageStatus.COMPLETED}>Completed</SelectItem>
                                    <SelectItem value={StageStatus.BLOCKED}>Blocked</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium">Tasks</h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddTask(stageIndex)}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Task
                              </Button>
                            </div>
                            
                            {form.watch(`stages.${stageIndex}.tasks`)?.length === 0 ? (
                              <div className="text-center p-4 border border-dashed rounded-lg">
                                <p className="text-sm text-muted-foreground">No tasks added yet</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {form.watch(`stages.${stageIndex}.tasks`)?.map((task, taskIndex) => (
                                  <Card key={taskIndex} className="p-3">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex-1 space-y-2">
                                        <FormField
                                          control={form.control}
                                          name={`stages.${stageIndex}.tasks.${taskIndex}.title`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Title</FormLabel>
                                              <FormControl>
                                                <Input {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={form.control}
                                          name={`stages.${stageIndex}.tasks.${taskIndex}.description`}
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Description</FormLabel>
                                              <FormControl>
                                                <Textarea 
                                                  {...field} 
                                                  value={field.value || ''}
                                                  rows={2}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <div className="flex gap-4">
                                          <FormField
                                            control={form.control}
                                            name={`stages.${stageIndex}.tasks.${taskIndex}.required`}
                                            render={({ field }) => (
                                              <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormControl>
                                                  <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                  />
                                                </FormControl>
                                                <FormLabel>Required</FormLabel>
                                              </FormItem>
                                            )}
                                          />
                                          
                                          <FormField
                                            control={form.control}
                                            name={`stages.${stageIndex}.tasks.${taskIndex}.priority`}
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Priority</FormLabel>
                                                <Select 
                                                  onValueChange={field.onChange} 
                                                  defaultValue={field.value}
                                                >
                                                  <FormControl>
                                                    <SelectTrigger className="w-[120px]">
                                                      <SelectValue placeholder="Priority" />
                                                    </SelectTrigger>
                                                  </FormControl>
                                                  <SelectContent>
                                                    <SelectItem value="HIGH">High</SelectItem>
                                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                                    <SelectItem value="LOW">Low</SelectItem>
                                                  </SelectContent>
                                                </Select>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </div>
                                      
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveTask(stageIndex, taskIndex)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddStage}
                      className="w-full"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Another Stage
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : templateId ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### 4. Integrate with Phase Creation Flow

Update the phase creation page to use the template selector.

```typescript
// app/(authenticated)/pov/[povId]/phase/create/page.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { PhaseType } from "@prisma/client";
import TemplateSelector from "@/components/phase/TemplateSelector";
import TemplatePreview from "@/components/phase/TemplatePreview";
import PhaseForm from "@/components/phase/PhaseForm";
import { toast } from "@/components/ui/useToast";

interface CreatePhasePageProps {
  params: {
    povId: string;
  };
}

export default function CreatePhasePage({ params }: CreatePhasePageProps) {
  const { povId } = params;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setActiveTab("details");
  };

  const handleCreatePhase = async (data: any) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/pov/${povId}/phase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          povId,
          templateId: selectedTemplateId,
        }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Success",
        description
