# KPI Integration Implementation Plan

## Overview

This document outlines a comprehensive implementation plan for integrating the KPI system with the Launch Validation system, phase templates, and CRM. The plan builds upon the existing KPI implementation described in `cline_docs/option1/kpi-integration-implementation.md` and focuses on creating seamless integration points between these systems.

## Integration Architecture

The KPI integration architecture will connect four key systems:

1. **KPI System**: Core functionality for template management, tracking, and visualization
2. **Launch Validation**: Validation and approval process for POVs
3. **Phase Templates**: Structured approach to POV phases and stages
4. **CRM System**: External data synchronization and field mapping

### Data Flow Diagram

```
Launch Validation → Phase Template Application → KPI Template Assignment → KPI Tracking
     ↑                    ↑                          ↓                    ↓
     └────────────────────┴──────────────────────────┴────────────────────┘
                                      ↑
                                      │
                                 CRM System
                                (Bidirectional)
```

## 1. KPI Integration with Launch Validation

### Current State Analysis

Currently, KPIs are associated with POVs through a direct relationship in the database schema, but there is no integration with the launch validation process. KPIs must be manually set up after a POV is created, which can lead to inconsistencies and missed KPIs. The launch validation system already includes a checklist and validation process, making it an ideal point for KPI setup and validation.

### Enhanced Implementation

#### Database Schema Updates

```prisma
model LaunchKPIRequirement {
  id              String       @id @default(cuid())
  kpiTemplateId   String
  kpiTemplate     KPITemplate  @relation(fields: [kpiTemplateId], references: [id])
  requirementType String       // "MANDATORY", "RECOMMENDED", "OPTIONAL"
  povCriteria     Json?        // Criteria for when this KPI is required
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

// Update to existing POVLaunch model
model POVLaunch {
  // ... existing fields
  kpiValidation   Json?        // Results of KPI validation
}
```

#### Service Layer Updates

```typescript
// lib/pov/services/launch.ts
class LaunchService {
  // ... existing methods

  /**
   * Assign KPIs during launch process
   */
  async assignLaunchKPIs(povId: string): Promise<void> {
    // Get POV details
    const pov = await povService.get(povId);
    if (!pov) {
      throw new Error('POV not found');
    }

    // Get launch requirements
    const requirements = await this.getLaunchKPIRequirements(pov);
    
    // Create KPIs from templates
    for (const req of requirements) {
      // Check if KPI already exists
      const existingKPI = await kpiService.findKPIByTemplateAndPOV(
        req.kpiTemplateId, 
        povId
      );
      
      if (!existingKPI) {
        await kpiService.createKPI({
          povId,
          templateId: req.kpiTemplateId,
          name: req.kpiTemplate.name,
          target: req.kpiTemplate.defaultTarget || { value: 0 },
        });
      }
    }
    
    // Update launch record
    await this.updateLaunchKPIStatus(povId);
  }

  /**
   * Get KPI requirements for launch
   */
  private async getLaunchKPIRequirements(pov: any): Promise<LaunchKPIRequirement[]> {
    // Get all requirements
    const allRequirements = await prisma.launchKPIRequirement.findMany({
      include: {
        kpiTemplate: true,
      },
    });

    // Filter requirements based on POV criteria
    return allRequirements.filter(req => {
      // If no criteria, always include
      if (!req.povCriteria) return true;
      
      const criteria = req.povCriteria as Record<string, any>;
      
      // Check each criterion
      for (const [key, value] of Object.entries(criteria)) {
        if (pov[key] !== value) return false;
      }
      
      return true;
    });
  }
  
  /**
   * Validate KPIs for launch
   */
  async validateLaunchKPIs(povId: string): Promise<ValidationResult> {
    // Get POV KPIs
    const kpis = await kpiService.getKPIsByPOV(povId);
    
    // Get mandatory requirements
    const mandatoryRequirements = await prisma.launchKPIRequirement.findMany({
      where: { requirementType: 'MANDATORY' },
      include: { kpiTemplate: true },
    });
    
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    // Check for missing mandatory KPIs
    for (const req of mandatoryRequirements) {
      const hasKPI = kpis.some(kpi => kpi.templateId === req.kpiTemplateId);
      
      if (!hasKPI) {
        errors.push({
          code: 'MISSING_MANDATORY_KPI',
          message: `Missing mandatory KPI: ${req.kpiTemplate.name}`,
          severity: 'ERROR',
          category: 'kpi'
        });
      }
    }
    
    // Check for KPIs without targets
    for (const kpi of kpis) {
      if (!kpi.target || kpi.target.value === undefined) {
        warnings.push({
          code: 'KPI_MISSING_TARGET',
          message: `KPI "${kpi.name}" is missing a target value`,
          severity: 'WARNING',
          category: 'kpi'
        });
      }
    }
    
    // Update launch record with validation results
    await this.updateLaunchKPIValidation(povId, {
      valid: errors.length === 0,
      errors,
      warnings
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Update launch KPI validation status
   */
  private async updateLaunchKPIValidation(
    povId: string, 
    validation: ValidationResult
  ): Promise<void> {
    const launch = await this.getLaunchByPovId(povId);
    if (!launch) return;
    
    await prisma.pOVLaunch.update({
      where: { id: launch.id },
      data: {
        kpiValidation: validation as unknown as Prisma.InputJsonValue
      }
    });
  }
  
  /**
   * Update launch KPI status
   */
  private async updateLaunchKPIStatus(povId: string): Promise<void> {
    const kpis = await kpiService.getKPIsByPOV(povId);
    const launch = await this.getLaunchByPovId(povId);
    
    if (!launch) return;
    
    await prisma.pOVLaunch.update({
      where: { id: launch.id },
      data: {
        checklist: {
          ...launch.checklist as any,
          items: [
            ...(launch.checklist as any)?.items || [],
            {
              key: 'kpisConfigured',
              label: 'KPIs Configured',
              completed: kpis.length > 0,
              description: `${kpis.length} KPIs configured for this POV`
            }
          ]
        } as unknown as Prisma.InputJsonValue
      }
    });
  }
}
```

#### UI Components

```tsx
// components/pov/launch/KPIRequirementManager.tsx
export function KPIRequirementManager() {
  // Fetch KPI templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["kpi-templates"],
    queryFn: () => fetch(`/api/kpi/templates`).then(res => res.json()),
  });

  // Fetch launch requirements
  const { data: requirements, refetch } = useQuery({
    queryKey: ["launch-kpi-requirements"],
    queryFn: () => fetch(`/api/admin/launch/kpi-requirements`).then(res => res.json()),
  });

  // Create requirement
  const createRequirement = async (data: any) => {
    await fetch(`/api/admin/launch/kpi-requirements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    refetch();
  };

  // Render requirement management UI
  // ...
}

// components/pov/launch/LaunchKPISelector.tsx
export function LaunchKPISelector({
  povId,
  onApply
}: {
  povId: string;
  onApply: () => void;
}) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  
  // Fetch available templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["kpi-templates"],
    queryFn: () => fetch(`/api/kpi/templates`).then(res => res.json()),
  });

  // Fetch already assigned KPIs
  const { data: assignedKPIs } = useQuery({
    queryKey: ["assigned-kpis", povId],
    queryFn: () => fetch(`/api/pov/${povId}/kpi`).then(res => res.json()),
  });

  // Apply selected templates
  const applyTemplates = async () => {
    await fetch(`/api/pov/${povId}/launch/kpi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ templateIds: selectedTemplates })
    });
    
    onApply();
  };

  // Render template selection UI
  // ...
}
```

#### Launch Workflow Integration

```typescript
// Enhanced LaunchWorkflow component
export function LaunchWorkflow({ povId }: { povId: string }) {
  const [step, setStep] = useState<'checklist' | 'templates' | 'kpis' | 'validation' | 'confirmation'>('checklist');

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
          variant={step === 'kpis' ? 'default' : 'outline'}
          onClick={() => setStep('kpis')}
        >
          KPIs
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
            setStep('kpis');
          }}
        />
      )}
      
      {step === 'kpis' && (
        <LaunchKPISelector
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

## 2. KPI Integration with Phase Templates

### Current State Analysis

Phase templates define the structure for POV phases, but KPIs are not directly associated with phases. There is no automatic KPI assignment when applying phase templates, which means phase-specific KPIs must be manually created and tracked.

### Enhanced Implementation

#### Database Schema Updates

```prisma
model PhaseTemplate {
  // ... existing fields
  kpiTemplates Json? // Array of KPI template IDs relevant to this phase
}

model KPI {
  // ... existing fields
  phaseId     String?
  phase       Phase?     @relation(fields: [phaseId], references: [id])
}
```

#### Service Layer Updates

```typescript
// lib/pov/services/phaseTemplate.ts
class PhaseTemplateService {
  // ... existing methods

  /**
   * Get KPI templates associated with a phase template
   */
  async getAssociatedKPITemplates(templateId: string): Promise<string[]> {
    const template = await prisma.phaseTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Phase template not found');
    }

    return (template.kpiTemplates as string[]) || [];
  }

  /**
   * Associate KPI templates with a phase template
   */
  async associateKPITemplates(templateId: string, kpiTemplateIds: string[]): Promise<void> {
    await prisma.phaseTemplate.update({
      where: { id: templateId },
      data: {
        kpiTemplates: kpiTemplateIds as unknown as Prisma.InputJsonValue
      }
    });
  }
}

// lib/pov/services/kpi.ts
class KPIService {
  // ... existing methods

  /**
   * Assign KPIs to a phase based on template
   */
  async assignPhaseKPIs(povId: string, phaseId: string, kpiTemplateIds: string[]): Promise<void> {
    // Get phase details
    const phase = await phaseService.getPhase(phaseId);
    if (!phase) {
      throw new Error('Phase not found');
    }

    // Get templates
    const templates = await Promise.all(
      kpiTemplateIds.map(id => this.getTemplate(id))
    );

    // Create KPIs from templates
    for (const template of templates) {
      await this.createKPI({
        povId,
        phaseId,
        templateId: template.id,
        name: `${phase.name} - ${template.name}`,
        target: template.defaultTarget || { value: 0 },
      });
    }
  }
}
```

#### Phase Template Integration

```typescript
// lib/pov/services/launch.ts
class LaunchService {
  // ... existing methods

  /**
   * Apply phase templates during launch
   */
  async applyPhaseTemplates(
    povId: string,
    templateSelections: PhaseTemplateSelection[],
    userId: string
  ): Promise<void> {
    // ... existing code

    // Sort selections by position
    const sortedSelections = [...templateSelections].sort((a, b) => a.position - b.position);

    // Apply each template
    for (const selection of sortedSelections) {
      // Create phase from template
      const phase = await phaseService.createPhaseFromTemplate(
        povId,
        selection.templateId,
        selection.position,
        selection.customizations || {}
      );

      // Get associated KPI templates
      const kpiTemplateIds = await phaseTemplateService.getAssociatedKPITemplates(selection.templateId);
      
      // Apply KPIs if any are associated
      if (kpiTemplateIds.length > 0) {
        await kpiService.assignPhaseKPIs(povId, phase.id, kpiTemplateIds);
      }
    }

    // ... existing code
  }
}
```

#### UI Components

```tsx
// components/phase/PhaseKPIList.tsx
export function PhaseKPIList({ phaseId }: { phaseId: string }) {
  // Fetch KPIs for this phase
  const { data: kpis, isLoading } = useQuery({
    queryKey: ["phase-kpis", phaseId],
    queryFn: () => fetch(`/api/phase/${phaseId}/kpi`).then(res => res.json()),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Phase KPIs</h3>
      
      {kpis?.length === 0 ? (
        <p className="text-muted-foreground">No KPIs associated with this phase</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kpis?.map((kpi: any) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## 3. KPI Integration with CRM

### Current State Analysis

The CRM system manages field mappings and synchronization with external CRM platforms, but there is no direct integration between KPIs and CRM data. Manual updates are required to reflect CRM changes in KPIs, which can lead to outdated or inconsistent KPI values.

### Enhanced Implementation

#### Database Schema Updates

```prisma
model KPICRMFieldMapping {
  id           String    @id @default(cuid())
  kpiTemplateId String
  kpiTemplate  KPITemplate @relation(fields: [kpiTemplateId], references: [id])
  crmField     String
  mappingType  String    // "TARGET", "CURRENT", "THRESHOLD"
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([kpiTemplateId, crmField, mappingType])
}
```

#### Service Layer Updates

```typescript
// lib/pov/services/kpi.ts
class KPIService {
  // ... existing methods

  /**
   * Update KPIs based on CRM data changes
   */
  async updateFromCRM(povId: string, syncedFields: string[]): Promise<void> {
    // Get KPIs for this POV
    const kpis = await this.getKPIsByPOV(povId);
    
    // Get CRM field mappings for KPIs
    const kpiMappings = await prisma.kPICRMFieldMapping.findMany({
      where: {
        kpiTemplateId: {
          in: kpis.map(kpi => kpi.templateId)
        }
      }
    });
    
    // Filter mappings that match synced fields
    const relevantMappings = kpiMappings.filter(mapping => 
      syncedFields.includes(mapping.crmField)
    );
    
    // Group mappings by KPI template
    const mappingsByTemplate = relevantMappings.reduce((acc, mapping) => {
      if (!acc[mapping.kpiTemplateId]) {
        acc[mapping.kpiTemplateId] = [];
      }
      acc[mapping.kpiTemplateId].push(mapping);
      return acc;
    }, {} as Record<string, typeof relevantMappings>);
    
    // Get POV with CRM data
    const pov = await povService.get(povId);
    
    // Update KPIs based on mappings
    for (const kpi of kpis) {
      const templateMappings = mappingsByTemplate[kpi.templateId];
      if (!templateMappings || templateMappings.length === 0) continue;
      
      // Prepare updates
      const updates: Record<string, any> = {};
      
      for (const mapping of templateMappings) {
        const crmValue = this.extractCRMValue(pov, mapping.crmField);
        
        switch (mapping.mappingType) {
          case 'TARGET':
            updates.target = {
              ...kpi.target,
              value: crmValue
            };
            break;
          case 'CURRENT':
            updates.currentValue = crmValue;
            break;
          case 'THRESHOLD':
            updates.target = {
              ...kpi.target,
              threshold: {
                ...kpi.target.threshold,
                warning: crmValue
              }
            };
            break;
        }
      }
      
      // Update KPI if there are changes
      if (Object.keys(updates).length > 0) {
        await this.updateKPI(kpi.id, updates);
      }
    }
  }
  
  /**
   * Extract value from CRM field in POV
   */
  private extractCRMValue(pov: any, crmField: string): any {
    // Handle nested fields with dot notation
    if (crmField.includes('.')) {
      const parts = crmField.split('.');
      let value = pov;
      for (const part of parts) {
        if (value === null || value === undefined) return null;
        value = value[part];
      }
      return value;
    }
    
    return pov[crmField];
  }
}
```

#### CRM Integration

```typescript
// lib/pov/services/crm.ts
class CRMService {
  // ... existing methods

  /**
   * Sync POV with CRM
   */
  async syncPOV(povId: string): Promise<CRMSyncResult> {
    // ... existing sync code
    
    // After successful sync, update related KPIs
    if (result.success) {
      await kpiService.updateFromCRM(povId, result.syncedFields);
    }
    
    return result;
  }

  /**
   * Push KPI data to CRM
   */
  async pushKPIsToCRM(povId: string): Promise<void> {
    // Get KPIs for this POV
    const kpis = await kpiService.getKPIsByPOV(povId);
    
    // Get POV details
    const pov = await povService.get(povId);
    if (!pov) {
      throw new Error('POV not found');
    }
    
    // Prepare KPI data for CRM
    const kpiData = kpis.map(kpi => ({
      name: kpi.name,
      currentValue: kpi.currentValue,
      target: kpi.target.value,
      status: kpi.status
    }));
    
    // Push to CRM (implementation depends on CRM API)
    // This is a placeholder for the actual CRM API call
    console.log(`Pushing KPI data to CRM for POV ${povId}:`, kpiData);
    
    // Record sync in history
    await this.createSyncHistory(povId, 'SUCCESS', {
      action: 'push_kpis',
      timestamp: new Date().toISOString(),
      kpiCount: kpiData.length
    });
  }
}
```

#### UI Components

```tsx
// components/pov/KPICRMMapping.tsx
export function KPICRMMapping({ templateId }: { templateId: string }) {
  // Fetch CRM fields
  const { data: crmFields } = useQuery({
    queryKey: ["crm-fields"],
    queryFn: () => fetch(`/api/admin/crm/mapping`).then(res => res.json()),
  });

  // Fetch existing mappings
  const { data: mappings, refetch } = useQuery({
    queryKey: ["kpi-crm-mappings", templateId],
    queryFn: () => fetch(`/api/kpi/templates/${templateId}/crm-mappings`).then(res => res.json()),
  });

  // Create mapping
  const createMapping = async (data: any) => {
    await fetch(`/api/kpi/templates/${templateId}/crm-mappings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    refetch();
  };

  // Render mapping UI
  // ...
}
```

## 4. Implementation Phases

### Phase 1: Foundation (2-3 weeks)

#### Objectives
- Implement KPI template system
- Create basic KPI tracking
- Establish POV-KPI relationship

#### Tasks
1. Create KPITemplateAssociation model
2. Implement KPI template management UI
3. Develop KPI assignment during POV creation
4. Create basic KPI visualization components
5. Implement KPI history tracking

### Phase 2: Phase Integration (2 weeks)

#### Objectives
- Enhance phase templates with KPI associations
- Implement phase-specific KPI tracking
- Create visualization by phase

#### Tasks
1. Update PhaseTemplate model with KPI template references
2. Implement KPI-Phase association UI
3. Develop phase-specific KPI tracking
4. Create phase KPI dashboard
5. Implement KPI progress tracking by phase

### Phase 3: CRM Integration (3 weeks)

#### Objectives
- Implement CRM field mapping to KPIs
- Create bidirectional updates
- Add KPI-driven CRM activities

#### Tasks
1. Create KPICRMFieldMapping model
2. Implement CRM field mapping UI
3. Develop KPI updates from CRM changes
4. Create KPI data push to CRM
5. Implement CRM activities based on KPI milestones

### Phase 4: Advanced Features (3-4 weeks)

#### Objectives
- Implement predictive analytics
- Add custom visualizations
- Create advanced reporting

#### Tasks
1. Develop KPI trend analysis
2. Implement custom calculation engine
3. Create advanced visualization components
4. Develop KPI forecasting
5. Implement comprehensive reporting dashboard

## 5. Technical Considerations

### Performance Optimization
- Batch KPI updates during CRM sync
- Implement caching for KPI calculations
- Use efficient database queries for KPI retrieval

### Security Considerations
- Implement proper permission checks for KPI management
- Secure CRM credentials and tokens
- Validate KPI calculation inputs

### Testing Strategy
- Unit tests for KPI calculations
- Integration tests for CRM synchronization
- End-to-end tests for KPI workflow

### Monitoring and Logging
- Track KPI update performance
- Log CRM synchronization events
- Monitor calculation errors

## 6. Benefits of Launch System Integration

Integrating KPIs with the Launch Validation system rather than directly with POV creation offers several significant advantages:

1. **Formal Validation Process**: The launch system already includes a structured validation process, making it the ideal place to ensure KPIs are properly configured before a POV is launched.

2. **Comprehensive Review**: During launch validation, stakeholders review all aspects of the POV, including KPIs, ensuring they align with business objectives.

3. **Workflow Integration**: Adding KPI configuration as a step in the launch workflow creates a natural progression from phase template selection to KPI setup to validation.

4. **Quality Assurance**: The launch validation process ensures that all required KPIs are properly configured with appropriate targets before the POV is approved.

5. **Consistent Implementation**: By making KPI setup a formal part of the launch process, we ensure consistent implementation across all POVs.

6. **Stakeholder Visibility**: The launch process typically involves multiple stakeholders, giving them visibility into KPI selection and targets.

7. **Checklist Integration**: The launch checklist can include KPI-related items, ensuring they're not overlooked.

## 7. Conclusion

This implementation plan provides a comprehensive approach to integrating the KPI system with the Launch Validation system, phase templates, and CRM. By following this plan, we can create a seamless experience that ensures proper KPI configuration as part of the launch process, while keeping KPI data synchronized with external CRM systems.

The phased approach allows for incremental implementation and testing, ensuring that each component is properly integrated before moving on to more advanced features. The end result will be a robust KPI system that provides valuable insights into POV performance and helps drive successful outcomes.

By integrating with the launch system rather than POV creation, we ensure that KPIs are properly reviewed and validated as part of the formal launch process, leading to higher quality implementations and better alignment with business objectives.
