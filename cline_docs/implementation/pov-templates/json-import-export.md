# JSON Import/Export for POV Updates

## Overview

This document outlines the implementation of JSON import/export functionality for POV updates, allowing users to update POV information, including phase changes and stage completion status, by importing a JSON file with the updated information.

## Implementation Details

### 1. JSON Schema for POV Updates

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "POV Update Schema",
  "description": "Schema for POV updates via JSON import",
  "required": ["povId", "updates"],
  "properties": {
    "povId": {
      "type": "string",
      "description": "ID of the POV to update"
    },
    "updates": {
      "type": "object",
      "description": "Updates to apply to the POV",
      "properties": {
        "status": {
          "type": "string",
          "enum": ["PROJECTED", "ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD"],
          "description": "New status for the POV"
        },
        "phases": {
          "type": "array",
          "description": "Phase updates",
          "items": {
            "type": "object",
            "required": ["phaseId"],
            "properties": {
              "phaseId": {
                "type": "string",
                "description": "ID of the phase to update"
              },
              "status": {
                "type": "string",
                "enum": ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "BLOCKED"],
                "description": "New status for the phase"
              },
              "stages": {
                "type": "array",
                "description": "Stage updates",
                "items": {
                  "type": "object",
                  "required": ["stageId"],
                  "properties": {
                    "stageId": {
                      "type": "string",
                      "description": "ID of the stage to update"
                    },
                    "status": {
                      "type": "string",
                      "enum": ["ACTIVE", "COMPLETED"],
                      "description": "New status for the stage"
                    },
                    "tasks": {
                      "type": "array",
                      "description": "Task updates",
                      "items": {
                        "type": "object",
                        "required": ["taskId"],
                        "properties": {
                          "taskId": {
                            "type": "string",
                            "description": "ID of the task to update"
                          },
                          "status": {
                            "type": "string",
                            "enum": ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"],
                            "description": "New status for the task"
                          },
                          "assigneeId": {
                            "type": "string",
                            "description": "ID of the user to assign the task to"
                          },
                          "priority": {
                            "type": "string",
                            "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                            "description": "New priority for the task"
                          },
                          "dueDate": {
                            "type": "string",
                            "format": "date-time",
                            "description": "New due date for the task"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "formData": {
          "type": "object",
          "description": "Updates to the POV form data"
        },
        "metadata": {
          "type": "object",
          "description": "Updates to the POV metadata"
        }
      }
    },
    "options": {
      "type": "object",
      "description": "Import options",
      "properties": {
        "validateOnly": {
          "type": "boolean",
          "default": false,
          "description": "If true, validate the updates without applying them"
        },
        "skipValidation": {
          "type": "boolean",
          "default": false,
          "description": "If true, skip validation and apply updates directly (use with caution)"
        },
        "createMissingEntities": {
          "type": "boolean",
          "default": false,
          "description": "If true, create missing phases, stages, or tasks"
        }
      }
    }
  }
}
```

### 2. Import Service

```typescript
// lib/pov/templates/import-export.ts
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { phaseService } from '../services/phase';
import { povService } from '../services/pov';
import { templateService } from './service';
import { templateValidator } from './validator';

export interface ImportOptions {
  validateOnly?: boolean;
  skipValidation?: boolean;
  createMissingEntities?: boolean;
}

export interface ImportResult {
  success: boolean;
  povId: string;
  appliedUpdates: {
    status?: string;
    phases: {
      phaseId: string;
      status?: string;
      stages: {
        stageId: string;
        status?: string;
        tasks: {
          taskId: string;
          status?: string;
          assigneeId?: string;
          priority?: string;
          dueDate?: Date;
        }[];
      }[];
    }[];
    formData?: Record<string, any>;
    metadata?: Record<string, any>;
  };
  validationErrors?: Record<string, string>;
}

export class ImportExportService {
  private static instance: ImportExportService;

  private constructor() {}

  public static getInstance(): ImportExportService {
    if (!ImportExportService.instance) {
      ImportExportService.instance = new ImportExportService();
    }
    return ImportExportService.instance;
  }

  /**
   * Import POV updates from JSON
   */
  public async importPOVUpdates(
    jsonData: any,
    userId: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    // Validate JSON structure
    if (!jsonData.povId) {
      throw new ApiError('BAD_REQUEST', 'Missing POV ID');
    }

    if (!jsonData.updates) {
      throw new ApiError('BAD_REQUEST', 'Missing updates object');
    }

    // Get POV
    const pov = await povService.get(jsonData.povId);
    if (!pov) {
      throw new ApiError('NOT_FOUND', `POV with ID ${jsonData.povId} not found`);
    }

    // Check if user has permission to update this POV
    // This would be replaced with actual permission check
    const canUpdate = pov.ownerId === userId || pov.teamMembers.some(m => m.userId === userId);
    if (!canUpdate) {
      throw new ApiError('FORBIDDEN', 'You do not have permission to update this POV');
    }

    // Validate updates if not skipping validation
    const validationErrors: Record<string, string> = {};
    if (!options.skipValidation) {
      // Validate status update
      if (jsonData.updates.status) {
        const validStatuses = ['PROJECTED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD'];
        if (!validStatuses.includes(jsonData.updates.status)) {
          validationErrors.status = `Invalid status: ${jsonData.updates.status}`;
        }
      }

      // Validate phase updates
      if (jsonData.updates.phases) {
        for (const phaseUpdate of jsonData.updates.phases) {
          if (!phaseUpdate.phaseId) {
            validationErrors[`phase_${phaseUpdate.phaseId || 'unknown'}`] = 'Missing phase ID';
            continue;
          }

          // Check if phase exists
          const phase = await phaseService.getPhase(phaseUpdate.phaseId);
          if (!phase && !options.createMissingEntities) {
            validationErrors[`phase_${phaseUpdate.phaseId}`] = `Phase with ID ${phaseUpdate.phaseId} not found`;
            continue;
          }

          // Validate phase status
          if (phaseUpdate.status) {
            const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
            if (!validStatuses.includes(phaseUpdate.status)) {
              validationErrors[`phase_${phaseUpdate.phaseId}_status`] = `Invalid phase status: ${phaseUpdate.status}`;
            }
          }

          // Validate stage updates
          if (phaseUpdate.stages) {
            for (const stageUpdate of phaseUpdate.stages) {
              if (!stageUpdate.stageId) {
                validationErrors[`stage_${stageUpdate.stageId || 'unknown'}`] = 'Missing stage ID';
                continue;
              }

              // Check if stage exists
              const stage = await prisma.stage.findUnique({
                where: { id: stageUpdate.stageId }
              });
              if (!stage && !options.createMissingEntities) {
                validationErrors[`stage_${stageUpdate.stageId}`] = `Stage with ID ${stageUpdate.stageId} not found`;
                continue;
              }

              // Validate stage status
              if (stageUpdate.status) {
                const validStatuses = ['ACTIVE', 'COMPLETED'];
                if (!validStatuses.includes(stageUpdate.status)) {
                  validationErrors[`stage_${stageUpdate.stageId}_status`] = `Invalid stage status: ${stageUpdate.status}`;
                }
              }

              // Validate task updates
              if (stageUpdate.tasks) {
                for (const taskUpdate of stageUpdate.tasks) {
                  if (!taskUpdate.taskId) {
                    validationErrors[`task_${taskUpdate.taskId || 'unknown'}`] = 'Missing task ID';
                    continue;
                  }

                  // Check if task exists
                  const task = await prisma.task.findUnique({
                    where: { id: taskUpdate.taskId }
                  });
                  if (!task && !options.createMissingEntities) {
                    validationErrors[`task_${taskUpdate.taskId}`] = `Task with ID ${taskUpdate.taskId} not found`;
                    continue;
                  }

                  // Validate task status
                  if (taskUpdate.status) {
                    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'];
                    if (!validStatuses.includes(taskUpdate.status)) {
                      validationErrors[`task_${taskUpdate.taskId}_status`] = `Invalid task status: ${taskUpdate.status}`;
                    }
                  }

                  // Validate assignee
                  if (taskUpdate.assigneeId) {
                    const assignee = await prisma.user.findUnique({
                      where: { id: taskUpdate.assigneeId }
                    });
                    if (!assignee) {
                      validationErrors[`task_${taskUpdate.taskId}_assignee`] = `User with ID ${taskUpdate.assigneeId} not found`;
                    }
                  }

                  // Validate priority
                  if (taskUpdate.priority) {
                    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
                    if (!validPriorities.includes(taskUpdate.priority)) {
                      validationErrors[`task_${taskUpdate.taskId}_priority`] = `Invalid task priority: ${taskUpdate.priority}`;
                    }
                  }

                  // Validate due date
                  if (taskUpdate.dueDate) {
                    const date = new Date(taskUpdate.dueDate);
                    if (isNaN(date.getTime())) {
                      validationErrors[`task_${taskUpdate.taskId}_dueDate`] = `Invalid due date: ${taskUpdate.dueDate}`;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Validate form data updates if POV has a template
      if (jsonData.updates.formData && pov.templateId) {
        const template = await templateService.getTemplate(pov.templateId);
        if (template) {
          const formValidation = templateValidator.validatePOVData(
            { ...pov.formData, ...jsonData.updates.formData },
            template
          );
          if (!formValidation.valid) {
            Object.entries(formValidation.errors).forEach(([field, error]) => {
              validationErrors[`formData_${field}`] = error;
            });
          }
        }
      }
    }

    // If validation failed, return errors
    if (Object.keys(validationErrors).length > 0) {
      return {
        success: false,
        povId: jsonData.povId,
        appliedUpdates: {
          phases: []
        },
        validationErrors
      };
    }

    // If validate only, return success without applying updates
    if (options.validateOnly) {
      return {
        success: true,
        povId: jsonData.povId,
        appliedUpdates: {
          phases: []
        }
      };
    }

    // Apply updates
    const appliedUpdates: ImportResult['appliedUpdates'] = {
      phases: []
    };

    // Update POV status
    if (jsonData.updates.status) {
      await povService.update(jsonData.povId, {
        status: jsonData.updates.status
      });
      appliedUpdates.status = jsonData.updates.status;
    }

    // Update phases, stages, and tasks
    if (jsonData.updates.phases) {
      for (const phaseUpdate of jsonData.updates.phases) {
        const phaseResult = {
          phaseId: phaseUpdate.phaseId,
          stages: []
        } as any;

        // Update phase status
        if (phaseUpdate.status) {
          await phaseService.updatePhase(phaseUpdate.phaseId, {
            status: phaseUpdate.status
          });
          phaseResult.status = phaseUpdate.status;
        }

        // Update stages and tasks
        if (phaseUpdate.stages) {
          for (const stageUpdate of phaseUpdate.stages) {
            const stageResult = {
              stageId: stageUpdate.stageId,
              tasks: []
            } as any;

            // Update stage status
            if (stageUpdate.status) {
              await prisma.stage.update({
                where: { id: stageUpdate.stageId },
                data: { status: stageUpdate.status }
              });
              stageResult.status = stageUpdate.status;
            }

            // Update tasks
            if (stageUpdate.tasks) {
              for (const taskUpdate of stageUpdate.tasks) {
                const taskResult = {
                  taskId: taskUpdate.taskId
                } as any;

                // Prepare task update data
                const taskData: any = {};
                if (taskUpdate.status) {
                  taskData.status = taskUpdate.status;
                  taskResult.status = taskUpdate.status;
                }
                if (taskUpdate.assigneeId) {
                  taskData.assigneeId = taskUpdate.assigneeId;
                  taskResult.assigneeId = taskUpdate.assigneeId;
                }
                if (taskUpdate.priority) {
                  taskData.priority = taskUpdate.priority;
                  taskResult.priority = taskUpdate.priority;
                }
                if (taskUpdate.dueDate) {
                  taskData.dueDate = new Date(taskUpdate.dueDate);
                  taskResult.dueDate = taskData.dueDate;
                }

                // Update task
                await prisma.task.update({
                  where: { id: taskUpdate.taskId },
                  data: taskData
                });

                stageResult.tasks.push(taskResult);
              }
            }

            phaseResult.stages.push(stageResult);
          }
        }

        appliedUpdates.phases.push(phaseResult);
      }
    }

    // Update form data
    if (jsonData.updates.formData) {
      const updatedFormData = {
        ...pov.formData,
        ...jsonData.updates.formData
      };
      await povService.update(jsonData.povId, {
        formData: updatedFormData
      });
      appliedUpdates.formData = jsonData.updates.formData;
    }

    // Update metadata
    if (jsonData.updates.metadata) {
      const updatedMetadata = {
        ...pov.metadata,
        ...jsonData.updates.metadata
      };
      await povService.update(jsonData.povId, {
        metadata: updatedMetadata
      });
      appliedUpdates.metadata = jsonData.updates.metadata;
    }

    return {
      success: true,
      povId: jsonData.povId,
      appliedUpdates
    };
  }

  /**
   * Export POV data to JSON
   */
  public async exportPOV(povId: string, options: { includeFormData?: boolean; includeMetadata?: boolean } = {}): Promise<any> {
    // Get POV with related data
    const pov = await prisma.pOV.findUnique({
      where: { id: povId },
      include: {
        phases: {
          include: {
            stages: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });

    if (!pov) {
      throw new ApiError('NOT_FOUND', `POV with ID ${povId} not found`);
    }

    // Build export data
    const exportData = {
      povId: pov.id,
      title: pov.title,
      description: pov.description,
      status: pov.status,
      createdAt: pov.createdAt,
      updatedAt: pov.updatedAt,
      phases: pov.phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description,
        status: phase.status,
        order: phase.order,
        stages: phase.stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          status: stage.status,
          order: stage.order,
          tasks: stage.tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId,
            dueDate: task.dueDate,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          }))
        }))
      }))
    };

    // Include form data if requested
    if (options.includeFormData && pov.formData) {
      exportData.formData = pov.formData;
    }

    // Include metadata if requested
    if (options.includeMetadata && pov.metadata) {
      exportData.metadata = pov.metadata;
    }

    return exportData;
  }
}

export const importExportService = ImportExportService.getInstance();
```

### 3. API Routes

```typescript
// app/api/pov/[povId]/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { importExportService } from '@/lib/pov/templates/import-export';
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
    const data = await request.json();
    
    // Ensure POV ID in URL matches POV ID in JSON
    if (data.povId && data.povId !== povId) {
      return NextResponse.json(
        { error: 'POV ID in URL does not match POV ID in JSON' },
        { status: 400 }
      );
    }
    
    // Set POV ID from URL if not in JSON
    if (!data.povId) {
      data.povId = povId;
    }
    
    // Get import options
    const options = data.options || {};
    
    // Import updates
    const result = await importExportService.importPOVUpdates(
      data,
      user.userId,
      options
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('[POV Import Error]:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to import POV updates' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/pov/[povId]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { importExportService } from '@/lib/pov/templates/import-export';
import { ApiError } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { povId } = params;
    const searchParams = request.nextUrl.searchParams;
    const includeFormData = searchParams.get('includeFormData') === 'true';
    const includeMetadata = searchParams.get('includeMetadata') === 'true';
    
    // Export POV data
    const exportData = await importExportService.exportPOV(
      povId,
      { includeFormData, includeMetadata }
    );
    
    return NextResponse.json(exportData);
  } catch (error) {
    console.error('[POV Export Error]:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to export POV data' },
      { status: 500 }
    );
  }
}
```

### 4. UI Components

#### Import/Export Buttons

```tsx
// components/pov/ImportExportButtons.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Download, Upload, FileJson } from 'lucide-react';

interface ImportExportButtonsProps {
  povId: string;
}

export function ImportExportButtons({ povId }: ImportExportButtonsProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [validateOnly, setValidateOnly] = useState<boolean>(true);
  const [includeFormData, setIncludeFormData] = useState<boolean>(true);
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);
  
  // Handle import file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportError(null);
    }
  };
  
  // Handle import button click
  const handleImport = async () => {
    if (!importFile) {
      setImportError('Please select a file to import');
      return;
    }
    
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(false);
    
    try {
      // Read file content
      const fileContent = await importFile.text();
      let jsonData;
      
      try {
        jsonData = JSON.parse(fileContent);
      } catch (e) {
        setImportError('Invalid JSON file');
        setImportLoading(false);
        return;
      }
      
      // Add options
      jsonData.options = {
        validateOnly,
      };
      
      // Send import request
      const response = await fetch(`/api/pov/${povId}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setImportError(result.error || 'Failed to import POV updates');
        return;
      }
      
      if (!result.success) {
        setImportError('Validation failed. Please check the errors and try again.');
        console.error('Validation errors:', result.validationErrors);
        return;
      }
      
      setImportSuccess(true);
      
      // Close dialog after successful import if not validate only
      if (!validateOnly) {
        setTimeout(() => {
          setImportDialogOpen(false);
          // Reload page to show updated data
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError('An error occurred during import');
    } finally {
      setImportLoading(false);
    }
  };
  
  // Handle export button click
  const handleExport = () => {
    // Build export URL with query parameters
    const url = `/api/pov/${povId}/export?includeFormData=${includeFormData}&includeMetadata=${includeMetadata}`;
    
    // Create a hidden link and click it to download the file
    const link = document.createElement('a');
    link.href = url;
    link.download = `pov-${povId}-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Close dialog
    setExportDialogOpen(false);
  };
  
  return (
    <div className="flex space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setImportDialogOpen(true)}
      >
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExportDialogOpen(true)}
      >
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      
      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import POV Updates</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="validateOnly"
                checked={validateOnly}
                onCheckedChange={(checked) => setValidateOnly(!!checked)}
              />
              <Label htmlFor="validateOnly">Validate only (don't apply changes)</Label>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileJson className="h-8 w-8 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Select a JSON file with POV updates
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="mt-4 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            
            {importError && (
              <Alert variant="destructive">
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
            
            {importSuccess && (
              <Alert variant="success">
                <AlertDescription>
                  {validateOnly 
                    ? 'Validation successful! You can now uncheck "Validate only" to apply the changes.' 
                    : 'Import successful! The page will reload to show the updated data.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || importLoading}
            >
              {importLoading ? 'Importing...' : validateOnly ? 'Validate' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export POV Data</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeFormData"
                checked={includeFormData}
                onCheckedChange={(checked) => setIncludeFormData(!!checked)}
              />
              <Label htmlFor="includeFormData">Include form data</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMetadata"
                checked={includeMetadata}
                onCheckedChange={(checked) => setIncludeMetadata(!!checked)}
              />
              <Label htmlFor="includeMetadata">Include metadata</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handle
