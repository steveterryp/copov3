# CRM Management System

## Overview

The CRM Management System provides a split architecture for handling both POV-specific CRM operations and global CRM configuration. This separation enables efficient management of individual POV synchronization while maintaining centralized control over field mappings and templates.

### Key Features
- Split architecture (POV-specific vs Global)
- Field mapping configuration
- Sync history tracking
- Custom field transformers
- Real-time synchronization
- Transaction-safe updates

## Implementation

### 1. UI Components

#### Landing Page (`app/(authenticated)/admin/crm/page.tsx`)
- Overview cards with real-time status:
  - Settings configuration status
  - Field mapping completeness
  - Latest sync results
- Quick action buttons
- System health indicators
- Navigation to specialized sections

#### Settings Page (`app/(authenticated)/admin/crm/settings/page.tsx`)
- Connection configuration form:
  - API endpoint configuration
  - Authentication settings
  - Environment selection
- Auto-sync preferences:
  - Sync frequency settings
  - Trigger conditions
  - Notification preferences
- Secure credential storage:
  - Encrypted API keys
  - OAuth configuration
  - Token management
- Real-time validation:
  - Connection testing
  - Credential verification
  - Configuration validation

#### Field Mapping Page (`app/(authenticated)/admin/crm/mapping/page.tsx`)
- Interactive mapping interface:
  - Drag-and-drop field mapping
  - Visual field type indicators
  - Required field highlighting
- CRUD operations:
  - Bulk mapping creation
  - Mapping templates
  - Version history
- Data transformer configuration:
  - Custom transformer editor
  - Predefined transformers
  - Testing interface
- Validation and error handling:
  - Real-time field validation
  - Type compatibility checks
  - Circular dependency detection

#### Sync Status Page (`app/(authenticated)/admin/crm/sync/page.tsx`)
- Real-time sync monitoring:
  - Active sync progress
  - Queue status
  - Resource utilization
- Historical sync records:
  - Detailed sync logs
  - Success/failure statistics
  - Performance metrics
- Error reporting:
  - Detailed error messages
  - Resolution suggestions
  - Impact analysis
- POV-specific tracking:
  - Individual POV sync status
  - Custom field mapping status
  - Sync history per POV

### 2. Database Models
Schema backup created at prisma/schema.prisma.crm_backup_20250213

#### CRMSettings
- Global configuration storage
- Connection settings
- Sync preferences
- Security credentials

#### CRMFieldMapping
- Field mapping definitions
- Transformer configurations
- Validation rules
- Mapping metadata

#### CRMSyncHistory
- Sync operation tracking
- Error logging
- Performance metrics
- Status records

### 3. API Routes

#### Settings Management (`/api/admin/crm/settings`)
- GET: Retrieve current settings
- PUT: Update configuration
- POST: Initialize settings
- DELETE: Reset configuration

#### Field Mapping (`/api/admin/crm/mapping`)
- GET: List all mappings
- POST: Create new mapping
- PUT: Update mapping
- DELETE: Remove mapping

#### Sync Operations (`/api/admin/crm/sync`)
- GET: Get sync status
- POST: Trigger sync
- GET /history: Get sync history

All routes are protected with proper permission checks using `requirePermission` middleware.

### 2. CRM Service (`lib/pov/services/crm.ts`)

#### Features
- Singleton service pattern
- Sync operations
- Field mapping management
- History tracking
- Error handling

#### Key Methods
```typescript
class CRMService {
  syncPOV(povId: string): Promise<CRMSyncResult>
  getFieldMapping(): Promise<CRMFieldMapping[]>
  getSyncHistory(povId: string): Promise<CRMSyncHistory[]>
  createFieldMapping(data: CRMFieldMappingCreateInput)
  updateFieldMapping(id: string, data: CRMFieldMappingUpdateInput)
}
```

### 3. Data Types (`lib/pov/types/crm.ts`)

#### Field Types and Transformers
```typescript
type CRMFieldType = 'string' | 'number' | 'date' | 'boolean' | 'array';

type CRMFieldTransformer = {
  fromCRM: (value: any) => any;
  toCRM: (value: any) => any;
};

type CRMFieldConfig = {
  crmField: string;
  localField: string;
  type: CRMFieldType;
  required: boolean;
  transformer?: CRMFieldTransformer;
};
```

#### Sync Types
```typescript
type CRMSyncResult = {
  success: boolean;
  syncedFields: string[];
  errors?: {
    field: string;
    message: string;
  }[];
  timestamp: Date;
};
```

## Features

### 1. POV-Specific Operations
- Sync history tracking
- POV-CRM field values
  - Deal ID
  - Opportunity Name
  - Revenue
  - Forecast Date
  - Customer Information
  - Partner Information
- Sync operations requiring POV ID

### 2. Global Configuration
- Field mapping management
- Global settings and transformers
- Template administration
- No POV ID requirement

### 3. Sync Operations
- Real-time synchronization
- Error handling
- History tracking
- Status updates

### 4. Field Mapping
- Custom field transformers
- Required field validation
- Type conversion
- Bidirectional mapping

## Technical Details

### 1. Data Storage
- Field mapping persistence
- Sync history tracking
- Transaction support
- Error logging

### 2. Type Safety
- Full TypeScript implementation
- Runtime type checking
- Custom type transformers
- Safe JSON handling

### 3. Performance
- Singleton service pattern
- Efficient sync operations
- Batch updates
- Transaction safety

### 4. Error Handling
- Sync operation protection
- Field validation
- Transaction rollback
- History tracking

## Usage Guide

### Managing Field Mappings

1. **Creating Mappings**
   ```typescript
   const mapping = await crmService.createFieldMapping({
     crmField: "opportunity_name",
     localField: "title",
     transformer: `
       {
         "fromCRM": "(value) => value.toLowerCase()",
         "toCRM": "(value) => value.toUpperCase()"
       }
     `,
     isRequired: true
   });
   ```

2. **Updating Mappings**
   ```typescript
   await crmService.updateFieldMapping(id, {
     transformer: `
       {
         "fromCRM": "(value) => value.trim()",
         "toCRM": "(value) => value.trim()"
       }
     `
   });
   ```

### Managing Sync Operations

1. **Triggering Sync**
   ```typescript
   const result = await crmService.syncPOV(povId);
   // Returns: { success: true, syncedFields: [...], timestamp: Date }
   ```

2. **Checking Sync History**
   ```typescript
   const history = await crmService.getSyncHistory(povId);
   ```

## Testing Guide

### Prerequisites
- Test CRM environment
- Sample POV data
- Field mapping configuration

### Testing Field Mappings

1. **Mapping Creation**
   - Navigate to field mapping section
   - Create new mapping
   - Fill required fields:
     - CRM Field
     - Local Field
     - Type
     - Transformer (if needed)
   - Save mapping
   - Verify creation success

2. **Mapping Validation**
   - Try creating mapping without required fields
   - Test invalid transformers
   - Verify type conversions
   - Check error handling

3. **Mapping Updates**
   - Modify existing mapping
   - Update transformer
   - Test bidirectional conversion
   - Verify changes persist

### Testing Sync Operations

1. **Sync Execution**
   - Select POV for sync
   - Trigger sync operation
   - Monitor progress
   - Verify results

2. **History Tracking**
   - Check sync history
   - Verify field updates
   - Validate timestamps
   - Review error logs

3. **Error Handling**
   - Test invalid field mappings
   - Verify rollback behavior
   - Check error reporting
   - Test recovery process

### Troubleshooting

1. **Sync Issues**
   - Check field mapping configuration
   - Verify CRM connectivity
   - Review error logs
   - Test field transformers

2. **Data Problems**
   - Verify field types
   - Check transformer logic
   - Validate required fields
   - Test edge cases

3. **Performance**
   - Monitor sync duration
   - Check history size
   - Test concurrent syncs
   - Verify transaction safety

## Future Enhancements

1. **Advanced Mapping**
   - Visual mapping interface
   - Bulk mapping operations
   - Template management
   - Mapping validation

2. **Sync Features**
   - Scheduled syncs
   - Partial syncs
   - Conflict resolution
   - Batch operations

3. **Integration**
   - Multiple CRM support
   - Custom field types
   - Advanced transformers
   - Webhook support

4. **Monitoring**
   - Sync analytics
   - Performance metrics
   - Error tracking
   - Audit logging
