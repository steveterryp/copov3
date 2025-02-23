# KPI Management System

## Overview

The KPI Management System provides a comprehensive solution for managing Key Performance Indicators (KPIs) in POVs. It enables the creation, tracking, and visualization of both standard and custom KPIs with support for templates, calculations, and historical tracking.

### Key Features
- Template-based KPI management
- Custom calculation support
- Historical data tracking
- Multiple visualization types
- Threshold-based status tracking
- Real-time calculations
- Transaction-safe updates

## Implementation

### 1. Routes

#### UI Routes (Planned)
- `/pov/[povId]/kpi/templates` - KPI template management (awaiting KPITemplateManager component)
- `/pov/[povId]/kpi/[kpiId]` - Individual KPI view and history (awaiting KPIHistoryChart component)

#### Components To Be Implemented
- `KPITemplateManager` - Template CRUD operations and visualization configuration
- `KPIHistoryChart` - Historical data visualization and trend analysis
- `KPIGaugeWidget` - Real-time KPI status display
- `KPICalculator` - Custom calculation interface

### 2. Routes

#### UI Routes
- `/pov/[povId]/kpi/templates` - KPI template management
- `/pov/[povId]/kpi/[kpiId]` - Individual KPI view and history

#### API Routes (`/api/pov/[povId]/kpi`)
- `GET ?type=templates` - List KPI templates
- `GET ?kpiId=[id]` - Get specific KPI
- `GET` - List all KPIs for a POV
- `POST ?type=template` - Create KPI template
- `POST` - Create new KPI
- `PUT ?type=template&id=[id]` - Update template
- `PUT ?type=calculate&id=[id]` - Calculate KPI
- `PUT ?id=[id]` - Update KPI
- `DELETE ?type=template&id=[id]` - Delete template
- `DELETE ?id=[id]` - Delete KPI

All routes are protected with proper permission checks using `requirePermission` middleware.

### 2. KPI Service (`lib/pov/services/kpi.ts`)

#### Features
- Singleton service pattern
- Template management
- KPI CRUD operations
- Historical data management
- Calculation engine
- Status determination
- Visualization parsing

#### Key Methods
```typescript
class KPIService {
  createTemplate(data: KPITemplateCreateInput)
  updateTemplate(id: string, data: KPITemplateUpdateInput)
  createKPI(povId: string, templateId: string, data: KPICreateInput)
  calculateKPI(kpiId: string): Promise<KPICalculationResult>
  getKPIHistory(id: string): Promise<KPIHistoryEntry[]>
}
```

### 2. Data Types (`lib/pov/types/kpi.ts`)

#### KPI Template
```typescript
interface KPITemplateCreateInput {
  name: string;
  description?: string;
  type: KPIType;
  isCustom?: boolean;
  defaultTarget?: Prisma.JsonValue;
  calculation?: string;
  visualization?: string;
}
```

#### KPI Target
```typescript
interface KPITarget {
  value: number;
  threshold?: {
    warning: number;
    critical: number;
  };
}
```

#### Visualization
```typescript
interface KPIVisualization {
  type: 'line' | 'bar' | 'gauge';
  options?: {
    min?: number;
    max?: number;
    unit?: string;
    colors?: {
      success: string;
      warning: string;
      critical: string;
    };
  };
}
```

## Features

### 1. Template Management
- Create and manage KPI templates
- Set default targets and thresholds
- Define calculation methods
- Configure visualization options
- Support for custom KPIs

### 2. KPI Tracking
- Create KPIs from templates
- Set custom targets
- Track current values
- Maintain history
- Calculate status

### 3. Calculations
- Custom calculation functions
- Context-aware computations
- Historical data access
- Transaction-safe updates

### 4. Visualization
- Multiple chart types
  - Line charts
  - Bar charts
  - Gauge displays
- Customizable options
- Threshold-based coloring
- Unit display

## Technical Details

### 1. Data Storage
- JSON storage for complex data
- Historical tracking
- Template management
- Transaction support

### 2. Type Safety
- Full TypeScript implementation
- Runtime type checking
- Prisma integration
- Safe JSON handling

### 3. Performance
- Singleton service pattern
- Efficient calculations
- Batch updates
- Transaction safety

### 4. Error Handling
- Calculation error protection
- Type validation
- Transaction rollback
- Safe JSON parsing

## Usage Guide

### Common KPI Examples

1. **Revenue Growth KPI**
   ```typescript
   // Create template
   const revenueTemplate = await kpiService.createTemplate({
     name: "Revenue Growth",
     type: KPIType.PERCENTAGE,
     defaultTarget: {
       value: 10,
       threshold: {
         warning: 5,
         critical: 0
       }
     },
     calculation: `
       (context) => {
         const current = context.current;
         const previous = context.history[0]?.value || 0;
         return ((current - previous) / previous) * 100;
       }
     `,
     visualization: JSON.stringify({
       type: 'gauge',
       options: {
         min: -10,
         max: 30,
         unit: '%',
         colors: {
           success: '#4caf50',
           warning: '#ff9800',
           critical: '#f44336'
         }
       }
     })
   });

   // Create KPI instance
   const revenueKPI = await kpiService.createKPI(
     povId,
     revenueTemplate.id,
     {
       name: "Q1 2025 Revenue Growth",
       target: {
         value: 15,
         threshold: {
           warning: 10,
           critical: 5
         }
       },
       current: 1200000, // Current revenue
       weight: 30 // 30% weight in overall scoring
     }
   );
   ```

2. **Customer Satisfaction KPI**
   ```typescript
   // Create template
   const csatTemplate = await kpiService.createTemplate({
     name: "Customer Satisfaction",
     type: KPIType.SCORE,
     defaultTarget: {
       value: 4.5,
       threshold: {
         warning: 4.0,
         critical: 3.5
       }
     },
     calculation: `
       (context) => {
         const ratings = context.current.ratings;
         return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
       }
     `,
     visualization: JSON.stringify({
       type: 'line',
       options: {
         min: 0,
         max: 5,
         unit: 'stars',
         colors: {
           success: '#4caf50',
           warning: '#ff9800',
           critical: '#f44336'
         }
       }
     })
   });

   // Create KPI instance
   const csatKPI = await kpiService.createKPI(
     povId,
     csatTemplate.id,
     {
       name: "Project CSAT Score",
       target: {
         value: 4.8,
         threshold: {
           warning: 4.2,
           critical: 3.8
         }
       },
       current: {
         ratings: [5, 4, 5, 4, 5]
       },
       weight: 25
     }
   );
   ```

3. **Project Milestone KPI**
   ```typescript
   // Create template
   const milestoneTemplate = await kpiService.createTemplate({
     name: "Milestone Completion",
     type: KPIType.PERCENTAGE,
     defaultTarget: {
       value: 100,
       threshold: {
         warning: 90,
         critical: 80
       }
     },
     calculation: `
       (context) => {
         const { completed, total } = context.current;
         return (completed / total) * 100;
       }
     `,
     visualization: JSON.stringify({
       type: 'bar',
       options: {
         min: 0,
         max: 100,
         unit: '%',
         colors: {
           success: '#4caf50',
           warning: '#ff9800',
           critical: '#f44336'
         }
       }
     })
   });

   // Create KPI instance
   const milestoneKPI = await kpiService.createKPI(
     povId,
     milestoneTemplate.id,
     {
       name: "Phase 1 Milestones",
       target: {
         value: 100,
         threshold: {
           warning: 85,
           critical: 70
         }
       },
       current: {
         completed: 8,
         total: 10
       },
       weight: 20
     }
   );
   ```

### Managing KPI Updates

1. **Updating Revenue Growth**
   ```typescript
   // Update with new revenue figure
   await kpiService.updateKPI(revenueKPI.id, {
     current: 1350000
   });

   // Calculate new status
   const revenueResult = await kpiService.calculateKPI(revenueKPI.id);
   // Returns: { value: 12.5, status: 'success', metadata: {...} }
   ```

2. **Updating CSAT Score**
   ```typescript
   // Add new customer rating
   await kpiService.updateKPI(csatKPI.id, {
     current: {
       ratings: [5, 4, 5, 4, 5, 5]
     }
   });

   // Calculate new average
   const csatResult = await kpiService.calculateKPI(csatKPI.id);
   // Returns: { value: 4.67, status: 'success', metadata: {...} }
   ```

3. **Updating Milestone Progress**
   ```typescript
   // Update milestone completion
   await kpiService.updateKPI(milestoneKPI.id, {
     current: {
       completed: 9,
       total: 10
     }
   });

   // Calculate completion percentage
   const milestoneResult = await kpiService.calculateKPI(milestoneKPI.id);
   // Returns: { value: 90, status: 'warning', metadata: {...} }
   ```

### Visualizing KPIs

1. **Gauge Chart Example**
   ```typescript
   const gaugeConfig = {
     type: 'gauge',
     options: {
       min: 0,
       max: 100,
       unit: '%',
       colors: {
         success: '#4caf50',
         warning: '#ff9800',
         critical: '#f44336'
       }
     }
   };
   ```

2. **Line Chart Example**
   ```typescript
   const lineConfig = {
     type: 'line',
     options: {
       min: 0,
       max: 5,
       unit: 'score',
       colors: {
         success: '#4caf50',
         warning: '#ff9800',
         critical: '#f44336'
       }
     }
   };
   ```

3. **Bar Chart Example**
   ```typescript
   const barConfig = {
     type: 'bar',
     options: {
       min: 0,
       max: 100,
       unit: '%',
       colors: {
         success: '#4caf50',
         warning: '#ff9800',
         critical: '#f44336'
       }
     }
   };
   ```

## Testing Guide

### Prerequisites
- Admin access to the system
- Test POV environment
- Sample KPI templates

### Testing KPI Templates

1. **Template Creation**
   - Navigate to KPI Templates section
   - Create new template
   - Fill required fields:
     - Name
     - Type
     - Default target
     - Calculation method
   - Save template
   - Verify creation success

2. **Template Validation**
   - Try creating template without required fields
   - Attempt invalid calculations
   - Test boundary conditions
   - Verify error handling

3. **Template Updates**
   - Modify existing template
   - Update calculations
   - Change visualization
   - Verify changes persist

### Testing KPI Management

1. **KPI Creation**
   - Create KPI from template
   - Set custom targets
   - Initialize values
   - Verify creation

2. **Value Updates**
   - Update KPI values
   - Trigger calculations
   - Verify history tracking
   - Check status updates

3. **Visualization**
   - Test different chart types
   - Verify threshold colors
   - Check responsive behavior
   - Validate data display

### Troubleshooting

1. **Calculation Issues**
   - Check calculation syntax
   - Verify context data
   - Review error logs
   - Test edge cases

2. **Data Problems**
   - Verify JSON format
   - Check history entries
   - Validate thresholds
   - Test type conversions

3. **Performance**
   - Monitor calculation time
   - Check history size
   - Test concurrent updates
   - Verify transaction safety

## Future Enhancements

1. **Advanced Calculations**
   - Formula builder interface
   - More calculation contexts
   - Custom aggregations
   - Trend analysis

2. **Visualization**
   - More chart types
   - Custom color schemes
   - Interactive displays
   - Export capabilities

3. **Integration**
   - External data sources
   - Automated updates
   - Notification system
   - Reporting engine

4. **Analysis**
   - Trend detection
   - Predictive analytics
   - Comparative analysis
   - Custom reports
