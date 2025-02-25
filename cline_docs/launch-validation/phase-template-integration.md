# Phase Template Integration with Launch Validation

This document details how the Launch Validation System integrates with Phase Templates, allowing users to assign phase templates during the POV launch process.

## Overview

Phase templates provide predefined structures for POV phases, including standard stages, tasks, and workflows. Integrating phase template selection into the launch process ensures that newly launched POVs follow standardized methodologies and best practices.

## Current State

Currently, there is no direct integration between phase templates and the launch validation system. Phase templates must be manually assigned to a POV after creation, which can lead to inconsistencies and missed steps.

## Enhanced Implementation

The enhanced implementation will integrate phase template selection directly into the launch process, allowing users to:

1. Select phase templates during POV launch
2. Preview template structures before applying them
3. Customize template parameters during launch
4. Validate template compatibility with POV requirements

### Database Schema Updates

No additional schema changes are required beyond what's already defined in the POV and Phase models. The existing `PhaseTemplate` model will be used:

```prisma
model PhaseTemplate {
  id          String    @id @default(cuid())
  name        String
  description String?
  type        PhaseType @default(PLANNING)
  isDefault   Boolean   @default(false)
  workflow    Json
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  phases      Phase[]
}
```

### Type Definition Updates

```typescript
// lib/pov/types/launch.ts
export interface PhaseTemplateSelection {
  templateId: string;
  position: number;
  customizations?: Record<string, any>;
}

export interface LaunchPhaseTemplateRequest {
  povId: string;
  templates: PhaseTemplateSelection[];
}
```

### Service Layer Updates

#### PhaseTemplateService Integration

```typescript
// lib/pov/services/phaseTemplate.ts
class PhaseTemplateService {
  // ... existing methods

  // Get available templates for launch
  async getTemplatesForLaunch(): Promise<PhaseTemplate[]> {
    return await prisma.phaseTemplate.findMany({
      orderBy: { name: 'asc' }
    });
  }

  // Get default templates
  async getDefaultTemplates(): Promise<PhaseTemplate[]> {
    return await prisma.phaseTemplate.findMany({
      where: { isDefault: true },
      orderBy: { type: 'asc' }
    });
  }

  // Validate template compatibility
  async validateTemplateCompatibility(
    povId: string,
    templateIds: string[]
  ): Promise<ValidationResult> {
    const pov = await povService.get(povId);
    if (!pov) {
      throw new Error('POV not found');
    }

    const templates = await prisma.phaseTemplate.findMany({
      where: { id: { in: templateIds } }
    });

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check for duplicate phase types
    const phaseTypes = templates.map(t => t.type);
    const duplicateTypes = phaseTypes.filter(
      (type, index) => phaseTypes.indexOf(type) !== index
    );

    if (duplicateTypes.length > 0) {
      errors.push({
        code: 'DUPLICATE_PHASE_TYPES',
        message: `Duplicate phase types detected: ${duplicateTypes.join(', ')}`,
        severity: 'ERROR',
        category: 'phase_template'
      });
    }

    // Check for missing required phase types
    const requiredTypes: PhaseType[] = ['PLANNING', 'EXECUTION', 'REVIEW'];
    const missingTypes = requiredTypes.filter(type => !phaseTypes.includes(type));

    if (missingTypes.length > 0) {
      warnings.push({
        code: 'MISSING_PHASE_TYPES',
        message: `Missing recommended phase types: ${missingTypes.join(', ')}`,
        severity: 'WARNING',
        category: 'phase_template'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export const phaseTemplateService = PhaseTemplateService.getInstance();
```

#### LaunchService Updates

```typescript
// lib/pov/services/launch.ts
class LaunchService {
  // ... existing methods

  // Apply phase templates during launch
  async applyPhaseTemplates(
    povId: string,
    templateSelections: PhaseTemplateSelection[],
    userId: string
  ): Promise<void> {
    const pov = await povService.get(povId);
    if (!pov) {
      throw new Error('POV not found');
    }

    // Validate template compatibility
    const templateIds = templateSelections.map(s => s.templateId);
    const validation = await phaseTemplateService.validateTemplateCompatibility(
      povId,
      templateIds
    );

    if (!validation.valid) {
      throw new Error(`Template compatibility validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Sort selections by position
    const sortedSelections = [...templateSelections].sort((a, b) => a.position - b.position);

    // Apply each template
    for (const selection of sortedSelections) {
      await phaseService.createPhaseFromTemplate(
        povId,
        selection.templateId,
        selection.position,
        selection.customizations || {}
      );
    }

    // Create audit entry
    const launch = await this.getLaunchByPovId(povId);
    if (launch) {
      await this.createAudit(launch.id, userId, 'phase_templates_applied', {
        templateIds,
        count: templateSelections.length
      });
    }
  }

  // Initialize launch with default phase templates
  async initiateLaunchWithTemplates(povId: string): Promise<void> {
    // Initialize basic launch
    await this.initiateLaunch(povId);

    // Get default templates
    const defaultTemplates = await phaseTemplateService.getDefaultTemplates();
    
    if (defaultTemplates.length > 0) {
      // Create template selections from defaults
      const templateSelections = defaultTemplates.map((template, index) => ({
        templateId: template.id,
        position: index
      }));

      // Apply default templates
      await this.applyPhaseTemplates(povId, templateSelections, 'system');
    }
  }
}
```

### API Route Updates

```typescript
// app/api/pov/[povId]/launch/phase-templates/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Unauthorized');
  }

  const templates = await phaseTemplateService.getTemplatesForLaunch();
  return Response.json(templates);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { povId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    throw new ApiError('UNAUTHORIZED', 'Unauthorized');
  }

  const { templates } = await request.json() as { templates: PhaseTemplateSelection[] };
  
  await launchService.applyPhaseTemplates(params.povId, templates, user.userId);
  
  return Response.json({ success: true });
}
```

### UI Component Updates

#### Phase Template Selector Component

```tsx
// components/pov/launch/PhaseTemplateSelector.tsx
export function PhaseTemplateSelector({
  povId,
  onApply
}: {
  povId: string;
  onApply: () => void;
}) {
  const [selectedTemplates, setSelectedTemplates] = useState<PhaseTemplateSelection[]>([]);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["phase-templates"],
    queryFn: () => fetch(`/api/pov/${povId}/launch/phase-templates`).then(res => res.json()),
  });

  const addTemplate = (templateId: string) => {
    setSelectedTemplates(prev => [
      ...prev,
      {
        templateId,
        position: prev.length
      }
    ]);
  };

  const removeTemplate = (index: number) => {
    setSelectedTemplates(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Update positions
      return updated.map((item, i) => ({ ...item, position: i }));
    });
  };

  const moveTemplate = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedTemplates.length - 1)
    ) {
      return;
    }

    setSelectedTemplates(prev => {
      const updated = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap items
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      
      // Update positions
      return updated.map((item, i) => ({ ...item, position: i }));
    });
  };

  const applyTemplates = async () => {
    if (selectedTemplates.length === 0) {
      setError('Please select at least one template');
      return;
    }

    setApplying(true);
    setError(null);

    try {
      await fetch(`/api/pov/${povId}/launch/phase-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templates: selectedTemplates })
      });
      
      onApply();
    } catch (error) {
      setError('Failed to apply templates. Please try again.');
      console.error('Template application error:', error);
    } finally {
      setApplying(false);
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Phase Templates</h3>
        <Button
          onClick={applyTemplates}
          disabled={applying || selectedTemplates.length === 0}
        >
          {applying ? 'Applying...' : 'Apply Templates'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <h4 className="text-md font-medium">Available Templates</h4>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {templates?.map((template: any) => (
                <li key={template.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {template.type}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTemplate(template.id)}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h4 className="text-md font-medium">Selected Templates</h4>
          </CardHeader>
          <CardContent>
            {selectedTemplates.length === 0 ? (
              <p className="text-muted-foreground">No templates selected</p>
            ) : (
              <ul className="space-y-2">
                {selectedTemplates.map((selection, index) => {
                  const template = templates?.find((t: any) => t.id === selection.templateId);
                  return (
                    <li key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{template?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Position: {index + 1}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => moveTemplate(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => moveTemplate(index, 'down')}
                          disabled={index === selectedTemplates.length - 1}
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeTemplate(index)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### Launch Phase Templates Page

```tsx
// app/(authenticated)/pov/[povId]/launch/phase-templates/page.tsx
export default function LaunchPhaseTemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const povId = params.povId as string;

  const handleApply = () => {
    // Navigate to launch status page after applying templates
    router.push(`/pov/${povId}/launch/status`);
  };

  return (
    <Container className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Phase Templates</h2>
        <p className="text-muted-foreground">
          Select and configure phase templates for this POV
        </p>
      </div>

      <PhaseTemplateSelector povId={povId} onApply={handleApply} />
    </Container>
  );
}
```

## Integration with Launch Workflow

The phase template selection will be integrated into the launch workflow as follows:

1. **POV Creation**: When a POV is created, default phase templates can be automatically applied.

```typescript
// lib/pov/handlers/post.ts
export async function createPoVHandler(
  request: NextRequest,
  { params }: { params: { povId?: string } }
) {
  // ... existing code

  // Create POV
  const pov = await povService.create({
    // ... existing code
  });

  // Initialize launch with default templates
  await launchService.initiateLaunchWithTemplates(pov.id);

  // Return the POV data
  return pov;
}
```

2. **Launch Process**: During the launch process, users can select and configure phase templates.

```typescript
// components/pov/launch/LaunchWorkflow.tsx
export function LaunchWorkflow({ povId }: { povId: string }) {
  const [step, setStep] = useState<'checklist' | 'templates' | 'validation' | 'confirmation'>('checklist');

  // ... other state and handlers

  return (
    <div className="space-y-8">
      {/* Step navigation */}
      <div className="flex justify-between">
        <Button
          variant={step === 'checklist' ? 'default' : 'outline'}
          onClick={() => setStep('checklist')}
        >
          Checklist
        </Button>
        <Button
          variant={step === 'templates' ? 'default' : 'outline'}
          onClick={() => setStep('templates')}
        >
          Phase Templates
        </Button>
        <Button
          variant={step === 'validation' ? 'default' : 'outline'}
          onClick={() => setStep('validation')}
        >
          Validation
        </Button>
        <Button
          variant={step === 'confirmation' ? 'default' : 'outline'}
          onClick={() => setStep('confirmation')}
        >
          Confirmation
        </Button>
      </div>

      {/* Step content */}
      {step === 'checklist' && (
        <ChecklistManager
          povId={povId}
          checklist={checklist}
          onUpdate={fetchChecklist}
        />
      )}

      {step === 'templates' && (
        <PhaseTemplateSelector
          povId={povId}
          onApply={() => {
            fetchChecklist();
            setStep('validation');
          }}
        />
      )}

      {step === 'validation' && (
        <ValidationResults
          validation={validation}
          onRetry={validateLaunch}
        />
      )}

      {step === 'confirmation' && (
        <LaunchConfirmation
          povId={povId}
          onSuccess={() => {
            // Handle successful launch
          }}
        />
      )}
    </div>
  );
}
```

3. **Validation**: The system will validate that the selected templates are compatible with the POV.

```typescript
// lib/pov/services/validation.ts
class ValidationService {
  // ... existing methods

  // Validate phase templates
  async validatePhaseTemplates(povId: string): Promise<ValidationResult> {
    const pov = await povService.get(povId);
    if (!pov) {
      throw new Error('POV not found');
    }

    const phases = await phaseService.getPoVPhases(povId);
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check if any phases exist
    if (phases.length === 0) {
      errors.push({
        code: 'NO_PHASES',
        message: 'No phases have been created for this POV',
        severity: 'ERROR',
        category: 'phase_template'
      });
    }

    // Check for required phase types
    const requiredTypes: PhaseType[] = ['PLANNING', 'EXECUTION', 'REVIEW'];
    const existingTypes = phases.map(p => p.type);
    
    const missingTypes = requiredTypes.filter(type => !existingTypes.includes(type));
    if (missingTypes.length > 0) {
      warnings.push({
        code: 'MISSING_PHASE_TYPES',
        message: `Missing recommended phase types: ${missingTypes.join(', ')}`,
        severity: 'WARNING',
        category: 'phase_template'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

## Benefits of Phase Template Integration

Integrating phase templates with the launch validation system provides several benefits:

1. **Standardization**: Ensures all POVs follow standardized methodologies and best practices.
2. **Efficiency**: Reduces the time required to set up a new POV by applying predefined templates.
3. **Consistency**: Maintains consistent phase structures across all POVs.
4. **Quality Assurance**: Validates that all required phases are included before launch.
5. **Flexibility**: Allows customization of templates to meet specific POV requirements.

## Future Enhancements

Future enhancements to the phase template integration could include:

1. **Template Recommendations**: Suggest templates based on POV characteristics.
2. **Template Analytics**: Track which templates are most successful.
3. **Dynamic Templates**: Templates that adapt based on POV parameters.
4. **Template Versioning**: Track changes to templates over time.
5. **Template Sharing**: Allow teams to share custom templates.
