# Phase 4: Advanced CRM Integration

## Overview

This phase builds on the basic CRM integration to implement advanced features for template-based POVs. It focuses on CRM-driven template selection, CRM data import, bidirectional sync enhancements, and analytics for template usage and sync performance.

## Implementation Details

### 1. CRM-Driven Template Selection

#### Template Recommendation Service

```typescript
// lib/pov/templates/recommendation.ts
import { POVTemplate } from './types';
import { templateService } from './service';
import { ApiError } from '@/lib/errors';

export class TemplateRecommendationService {
  private static instance: TemplateRecommendationService;

  private constructor() {}

  public static getInstance(): TemplateRecommendationService {
    if (!TemplateRecommendationService.instance) {
      TemplateRecommendationService.instance = new TemplateRecommendationService();
    }
    return TemplateRecommendationService.instance;
  }

  /**
   * Recommend a template based on CRM data
   */
  public async recommendTemplate(crmData: Record<string, any>): Promise<string> {
    // Get all published templates
    const templates = await templateService.getAllTemplates();
    const publishedTemplates = templates.filter(t => t.status === 'published');
    
    if (publishedTemplates.length === 0) {
      throw new ApiError('NOT_FOUND', 'No published templates available');
    }
    
    // Extract relevant data from CRM
    const industry = crmData.industry || '';
    const dealSize = parseFloat(crmData.amount || '0');
    const hasPartner = !!crmData.partner;
    
    // Find templates with matching selectors
    const matchingTemplates = publishedTemplates.filter(template => {
      const selectors = template.metadata?.templateSelectors;
      if (!selectors) return false;
      
      // Check industry match
      if (selectors.industry && industry) {
        const industryMatch = selectors.industry[industry] || selectors.industry.default;
        if (industryMatch && industryMatch === template.id) {
          return true;
        }
      }
      
      // Check deal size match
      if (selectors.dealSize && selectors.dealSize.ranges && dealSize > 0) {
        const matchingRange = selectors.dealSize.ranges.find(
          (range: any) => 
            dealSize >= (range.min || 0) && 
            (range.max === undefined || dealSize <= range.max)
        );
        
        if (matchingRange && matchingRange.template === template.id) {
          return true;
        }
      }
      
      // Check partner match
      if (selectors.partner && hasPartner) {
        if (selectors.partner.template === template.id) {
          return true;
        }
      }
      
      return false;
    });
    
    // Return the first matching template or default
    if (matchingTemplates.length > 0) {
      return matchingTemplates[0].id;
    }
    
    // Find a default template
    const defaultTemplate = publishedTemplates.find(t => t.metadata?.isDefault);
    if (defaultTemplate) {
      return defaultTemplate.id;
    }
    
    // Fall back to the first published template
    return publishedTemplates[0].id;
  }

  /**
   * Pre-populate template data from CRM
   */
  public async populateTemplateFromCrm(
    templateId: string,
    crmData: Record<string, any>
  ): Promise<Record<string, any>> {
    // Get the template
    const template = await templateService.getTemplate(templateId);
    if (!template) {
      throw new ApiError('NOT_FOUND', `Template with ID ${templateId} not found`);
    }
    
    const result: Record<string, any> = {};
    
    // Map CRM fields to template fields based on field mappings
    Object.entries(template.fields).forEach(([fieldId, field]) => {
      if (field.crm?.field && crmData[field.crm.field] !== undefined) {
        // Apply transformer if specified
        if (field.crm.transformer) {
          // This would use the transformer registry
          // For simplicity, we're just using the raw value
          result[fieldId] = crmData[field.crm.field];
        } else {
          result[fieldId] = crmData[field.crm.field];
        }
      } else if (field.defaultValue !== undefined) {
        // Use default value if available
        result[fieldId] = field.defaultValue;
      }
    });
    
    return result;
  }
}

export const templateRecommendationService = TemplateRecommendationService.getInstance();
```

#### Industry-Specific Template Selection

```typescript
// lib/pov/templates/selectors.ts
import { POVTemplate } from './types';

/**
 * Template selector types
 */
export interface IndustrySelector {
  [industry: string]: string; // industry -> templateId
  default?: string;
}

export interface DealSizeRange {
  min?: number;
  max?: number;
  template: string; // templateId
}

export interface DealSizeSelector {
  ranges: DealSizeRange[];
}

export interface PartnerSelector {
  template: string; // templateId
}

export interface TemplateSelectors {
  industry?: IndustrySelector;
  dealSize?: DealSizeSelector;
  partner?: PartnerSelector;
}

/**
 * Add selectors to a template
 */
export function addSelectors(
  template: POVTemplate,
  selectors: TemplateSelectors
): POVTemplate {
  return {
    ...template,
    metadata: {
      ...template.metadata,
      templateSelectors: selectors,
    },
  };
}

/**
 * Get selectors from a template
 */
export function getSelectors(template: POVTemplate): TemplateSelectors | undefined {
  return template.metadata?.templateSelectors;
}

/**
 * Create industry selector
 */
export function createIndustrySelector(
  mappings: Record<string, string>,
  defaultTemplate?: string
): IndustrySelector {
  return {
    ...mappings,
    ...(defaultTemplate ? { default: defaultTemplate } : {}),
  };
}

/**
 * Create deal size selector
 */
export function createDealSizeSelector(ranges: DealSizeRange[]): DealSizeSelector {
  // Sort ranges by min value
  const sortedRanges = [...ranges].sort((a, b) => {
    const aMin = a.min || 0;
    const bMin = b.min || 0;
    return aMin - bMin;
  });
  
  return {
    ranges: sortedRanges,
  };
}
```

### 2. CRM Data Import

#### CRM Import Service

```typescript
// lib/pov/templates/crm-import.ts
import { templateRecommendationService } from './recommendation';
import { templateService } from './service';
import { povService } from '../services/pov';
import { crmService } from '../services/crm';
import { ApiError } from '@/lib/errors';

export class CRMImportService {
  private static instance: CRMImportService;

  private constructor() {}

  public static getInstance(): CRMImportService {
    if (!CRMImportService.instance) {
      CRMImportService.instance = new CRMImportService();
    }
    return CRMImportService.instance;
  }

  /**
   * Create a POV from a CRM opportunity
   */
  public async createPovFromCrmOpportunity(
    opportunityId: string,
    userId: string
  ): Promise<any> {
    // Fetch opportunity data from CRM
    const crmData = await this.fetchOpportunityData(opportunityId);
    
    // Recommend a template based on CRM data
    const templateId = await templateRecommendationService.recommendTemplate(crmData);
    
    // Pre-populate template with CRM data
    const initialData = await templateRecommendationService.populateTemplateFromCrm(
      templateId,
      crmData
    );
    
    // Create POV with pre-populated data
    const pov = await templateService.createPOVFromTemplate(
      templateId,
      initialData,
      userId
    );
    
    // Update POV with CRM reference
    await povService.update(pov.id, {
      dealId: opportunityId,
      lastCrmSync: new Date(),
      crmSyncStatus: 'SUCCESS'
    });
    
    return pov;
  }

  /**
   * Fetch opportunity data from CRM
   */
  private async fetchOpportunityData(opportunityId: string): Promise<Record<string, any>> {
    // This would be replaced with actual CRM API calls
    // For now, return mock data
    return {
      id: opportunityId,
      name: `Opportunity ${opportunityId}`,
      amount: '100000',
      stage: 'Qualification',
      closeDate: new Date().toISOString(),
      probability: 50,
      industry: 'Technology',
      description: 'This is a sample opportunity',
      accountName: 'ACME Corp',
      accountId: 'ACC-123',
      contactName: 'John Doe',
      contactEmail: 'john.doe@example.com',
      partner: null,
    };
  }

  /**
   * Get available opportunities from CRM
   */
  public async getAvailableOpportunities(): Promise<any[]> {
    // This would be replaced with actual CRM API calls
    // For now, return mock data
    return [
      {
        id: 'OPP-123',
        name: 'ACME Corp - Enterprise Solution',
        amount: '100000',
        stage: 'Qualification',
        closeDate: new Date().toISOString(),
        accountName: 'ACME Corp',
        industry: 'Technology',
      },
      {
        id: 'OPP-124',
        name: 'Globex - Security Implementation',
        amount: '250000',
        stage: 'Proposal',
        closeDate: new Date().toISOString(),
        accountName: 'Globex',
        industry: 'Finance',
      },
      {
        id: 'OPP-125',
        name: 'Initech - Cloud Migration',
        amount: '500000',
        stage: 'Negotiation',
        closeDate: new Date().toISOString(),
        accountName: 'Initech',
        industry: 'Healthcare',
      },
    ];
  }
}

export const crmImportService = CRMImportService.getInstance();
```

#### CRM Import UI

```tsx
// app/(authenticated)/pov/create/crm-import/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, Search, ArrowRight, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Opportunity {
  id: string;
  name: string;
  amount: string;
  stage: string;
  closeDate: string;
  accountName: string;
  industry: string;
}

export default function CRMImportPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch opportunities on component mount
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/crm/opportunities');
        
        if (!response.ok) {
          throw new Error('Failed to fetch opportunities');
        }
        
        const data = await response.json();
        setOpportunities(data.opportunities || []);
        setFilteredOpportunities(data.opportunities || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOpportunities();
  }, []);
  
  // Filter opportunities based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOpportunities(opportunities);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = opportunities.filter(
      opp => 
        opp.name.toLowerCase().includes(term) || 
        opp.accountName.toLowerCase().includes(term) ||
        opp.industry.toLowerCase().includes(term)
    );
    
    setFilteredOpportunities(filtered);
  }, [searchTerm, opportunities]);
  
  // Handle opportunity selection
  const handleSelectOpportunity = (id: string) => {
    setSelectedOpportunity(id === selectedOpportunity ? null : id);
  };
  
  // Handle import button click
  const handleImport = async () => {
    if (!selectedOpportunity) {
      return;
    }
    
    setImporting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pov/crm-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opportunityId: selectedOpportunity,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import opportunity');
      }
      
      const data = await response.json();
      
      // Redirect to the new POV
      router.push(`/pov/${data.pov.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setImporting(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Get stage color
  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Qualification':
        return 'bg-blue-100 text-blue-800';
      case 'Proposal':
        return 'bg-purple-100 text-purple-800';
      case 'Negotiation':
        return 'bg-amber-100 text-amber-800';
      case 'Closed Won':
        return 'bg-green-100 text-green-800';
      case 'Closed Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Import from CRM</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No opportunities found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOpportunities.map((opportunity) => (
            <Card
              key={opportunity.id}
              className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                selectedOpportunity === opportunity.id ? 'border-blue-500 ring-2 ring-blue-200' : ''
              }`}
              onClick={() => handleSelectOpportunity(opportunity.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg">{opportunity.name}</h3>
                  <p className="text-sm text-gray-500">
                    {opportunity.accountName} | {opportunity.industry}
                  </p>
                </div>
                
                <div className="flex flex-col items-end">
                  <Badge className={getStageColor(opportunity.stage)}>
                    {opportunity.stage}
                  </Badge>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(opportunity.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Close Date: {formatDate(opportunity.closeDate)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleImport}
          disabled={!selectedOpportunity || importing}
        >
          {importing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          Import Selected Opportunity
        </Button>
      </div>
    </div>
  );
}
```

#### CRM Import API Route

```typescript
// app/api/pov/crm-import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { crmImportService } from '@/lib/pov/templates/crm-import';
import { ApiError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { opportunityId } = data;
    
    if (!opportunityId) {
      return NextResponse.json(
        { error: 'Opportunity ID is required' },
        { status: 400 }
      );
    }
    
    // Create POV from CRM opportunity
    const pov = await crmImportService.createPovFromCrmOpportunity(
      opportunityId,
      user.userId
    );
    
    return NextResponse.json({ pov });
  } catch (error) {
    console.error('[CRM Import Error]:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to import from CRM' },
      { status: 500 }
    );
  }
}
```

### 3. Bidirectional Sync Enhancements

#### Field-Level Change Tracking

```typescript
// lib/pov/templates/change-tracking.ts
import { POVTemplate } from './types';
import { CRMFieldConfig } from './crm-types';

export interface FieldChange {
  fieldId: string;
  oldValue: any;
  newValue: any;
  source: 'local' | 'crm';
  timestamp: Date;
}

export interface SyncHistory {
  id: string;
  povId: string;
  templateId: string;
  changes: FieldChange[];
  conflicts: FieldChange[];
  timestamp: Date;
}

export type ConflictResolution = 'local_wins' | 'crm_wins' | 'most_recent_wins' | 'manual';

export interface ConflictResolutionRules {
  default: ConflictResolution;
  fields?: Record<string, ConflictResolution>;
}

/**
 * Detect changes between two data sets
 */
export function detectChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>,
  template: POVTemplate,
  source: 'local' | 'crm'
): FieldChange[] {
  const changes: FieldChange[] = [];
  
  // Check each field in the template
  Object.entries(template.fields).forEach(([fieldId, field]) => {
    // Skip fields without CRM mapping
    if (!field.crm) return;
    
    const oldValue = oldData[fieldId];
    const newValue = newData[fieldId];
    
    // Check if value has changed
    if (!isEqual(oldValue, newValue)) {
      changes.push({
        fieldId,
        oldValue,
        newValue,
        source,
        timestamp: new Date(),
      });
    }
  });
  
  return changes;
}

/**
 * Detect conflicts between local and CRM changes
 */
export function detectConflicts(
  localChanges: FieldChange[],
  crmChanges: FieldChange[]
): FieldChange[] {
  const conflicts: FieldChange[] = [];
  
  // Group changes by field ID
  const changesByField: Record<string, { local?: FieldChange; crm?: FieldChange }> = {};
  
  // Add local changes
  localChanges.forEach(change => {
    if (!changesByField[change.fieldId]) {
      changesByField[change.fieldId] = {};
    }
    changesByField[change.fieldId].local = change;
  });
  
  // Add CRM changes and detect conflicts
  crmChanges.forEach(change => {
    if (!changesByField[change.fieldId]) {
      changesByField[change.fieldId] = {};
    }
    changesByField[change.fieldId].crm = change;
    
    // If both local and CRM changes exist, it's a conflict
    if (changesByField[change.fieldId].local) {
      conflicts.push(change);
    }
  });
  
  return conflicts;
}

/**
 * Resolve conflicts based on rules
 */
export function resolveConflicts(
  conflicts: FieldChange[],
  rules: ConflictResolutionRules,
  template: POVTemplate
): Record<string, any> {
  const result: Record<string, any> = {};
  
  conflicts.forEach(conflict => {
    const fieldId = conflict.fieldId;
    const field = template.fields[fieldId];
    
    if (!field) return;
    
    // Get resolution rule for this field
    const rule = rules.fields?.[fieldId] || rules.default;
    
    // Apply resolution rule
    switch (rule) {
      case 'local_wins':
        // Find the local change
        const localChange = conflicts.find(c => c.fieldId === fieldId && c.source === 'local');
        if (localChange) {
          result[fieldId] = localChange.newValue;
        }
        break;
        
      case 'crm_wins':
        // Find the CRM change
        const crmChange = conflicts.find(c => c.fieldId === fieldId && c.source === 'crm');
        if (crmChange) {
          result[fieldId] = crmChange.newValue;
        }
        break;
        
      case 'most_recent_wins':
        // Find the most recent change
        const localChangeTime = conflicts.find(c => c.fieldId === fieldId && c.source === 'local')?.timestamp;
        const crmChangeTime = conflicts.find(c => c.fieldId === fieldId && c.source === 'crm')?.timestamp;
        
        if (localChangeTime && crmChangeTime) {
          if (localChangeTime > crmChangeTime) {
            const localChange = conflicts.find(c => c.fieldId === fieldId && c.source === 'local');
            if (localChange) {
              result[fieldId] = localChange.newValue;
            }
          } else {
            const crmChange = conflicts.find(c => c.fieldId === fieldId && c.source === 'crm');
            if (crmChange) {
              result[fieldId] = crmChange.newValue;
            }
          }
        }
        break;
        
      case 'manual':
        // Manual resolution requires user input
        // For now, default to local wins
        const manualLocalChange = conflicts.find(c => c.fieldId === fieldId && c.source === 'local');
        if (manualLocalChange) {
          result[fieldId] = manualLocalChange.newValue;
        }
        break;
    }
  });
  
  return result;
}

/**
 * Check if two values are equal
 */
function isEqual(a: any, b: any): boolean {
  // Handle null/undefined
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  
  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => isEqual(val, b[i]));
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => isEqual(a[key], b[key]));
  }
  
  // Handle primitives
  return a === b;
}
```

#### Conflict Resolution UI

```tsx
// components/pov/templates/ConflictResolutionModal.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Label } from '@/components/ui/Label';
import { formatFieldValue } from '@/lib/pov/templates/form-utils';
import { POVTemplate, FieldDefinition } from '@/lib/pov/templates/types';
import { FieldChange } from '@/lib/pov/templates/change-tracking';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: FieldChange[];
  template: POVTemplate;
  onResolve: (resolutions: Record<string, any>) => void;
}

export function ConflictResolutionModal({
  isOpen,
  onClose,
  conflicts,
  template,
  onResolve,
}: ConflictResolutionModalProps) {
  // Group conflicts by field ID
  const conflictsByField: Record<string, { local?: FieldChange; crm?: FieldChange }> = {};
  
  conflicts.forEach(conflict => {
    if (!conflictsByField[conflict.fieldId]) {
      conflictsByField[conflict.fieldId] = {};
    }
    
    if (conflict.source === 'local') {
      conflictsByField[conflict.fieldId].local = conflict;
    } else {
      conflictsByField[conflict.fieldId].crm = conflict;
    }
  });
  
  // State for selected resolutions
  const [resolutions, setResolutions] = useState<Record<string, 'local' | 'crm'>>(
    Object.keys(conflictsByField).reduce((acc, fieldId) => {
      acc[fieldId] = 'local'; // Default to local
      return acc;
    }, {} as Record<string, 'local' | 'crm'>)
  );
  
  // Handle resolution change
  const handleResolutionChange = (fieldId: string, value: 'local' | 'crm') => {
    setResolutions(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };
  
  // Handle resolve button click
  const handleResolve = () => {
    const resolvedValues: Record<string, any> = {};
    
    // Apply resolutions
    Object.entries(resolutions).forEach(([fieldId, resolution]) => {
      const conflicts = conflictsByField[fieldId];
      
      if (resolution === 'local' && conflicts.local) {
        resolvedValues[fieldId] = conflicts.local.newValue;
      } else if (resolution === 'crm' && conflicts.crm) {
        resolvedValues[fieldId] = conflicts.crm.newValue;
      }
    });
    
    onResolve(resolvedValues);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Resolve Conflicts</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-500 mb-4">
            The following fields have conflicting changes between your local data and the CRM.
            Please select which version to keep for each field.
          </p>
          
          <div className="space-y-6">
            {Object.entries(conflictsByField).map(([fieldId, conflicts]) => {
              const field = template.fields[fieldId];
              if (!field) return null;
              
              return (
                <div key={fieldId} className="border-b pb-4">
                  <h3 className="font-medium mb-2">{field.label}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p
