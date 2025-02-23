# KPI Integration Implementation

## Overview

This document details the implementation of the KPI system, focusing on template management, tracking, and visualization of Key Performance Indicators across POVs.

## Core Features

### KPI Template System

#### Template Types
1. Standard Templates
   - Revenue Growth
   - Customer Satisfaction
   - Resource Utilization
   - Project Timeline
   - Quality Metrics

2. Custom Templates
   - User-defined calculations
   - Custom visualization options
   - Flexible thresholds
   - Dynamic targets

#### Template Configuration
```typescript
interface KPITemplate {
  id: string;
  name: string;
  description?: string;
  type: KPIType;
  calculation: string;  // JavaScript function as string
  defaultTarget?: {
    value: number;
    threshold?: {
      warning: number;
      critical: number;
    };
  };
  visualization: {
    type: 'line' | 'bar' | 'gauge';
    options?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}
```

### KPI Tracking

#### Data Points
- Current value
- Historical values
- Target values
- Threshold status
- Calculation context

#### Status Tracking
```typescript
enum KPIStatus {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  CRITICAL = 'CRITICAL'
}
```

## Implementation Details

### Database Schema

```prisma
model KPITemplate {
  id           String   @id @default(cuid())
  name         String
  description  String?
  type         KPIType
  calculation  String   // JavaScript function as string
  visualization Json
  metadata     Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  kpis         KPI[]
}

model KPI {
  id           String    @id @default(cuid())
  templateId   String
  template     KPITemplate @relation(fields: [templateId], references: [id])
  povId        String
  pov          POV        @relation(fields: [povId], references: [id])
  name         String
  currentValue Float?
  target       Json      // Includes value and thresholds
  status       KPIStatus @default(ON_TRACK)
  history      KPIHistory[]
  metadata     Json?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model KPIHistory {
  id        String   @id @default(cuid())
  kpiId     String
  kpi       KPI      @relation(fields: [kpiId], references: [id])
  value     Float
  timestamp DateTime @default(now())
  metadata  Json?
}
```

### API Routes

#### Template Management
```typescript
// Create template
POST /api/admin/kpi/templates
Body: {
  name: string;
  description?: string;
  type: KPIType;
  calculation: string;
  visualization: {
    type: string;
    options?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

// Update template
PUT /api/admin/kpi/templates/[templateId]
Body: {
  name?: string;
  description?: string;
  calculation?: string;
  visualization?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
```

#### KPI Management
```typescript
// Create KPI
POST /api/pov/[povId]/kpi
Body: {
  templateId: string;
  name: string;
  target: {
    value: number;
    threshold?: {
      warning: number;
      critical: number;
    };
  };
  metadata?: Record<string, unknown>;
}

// Update KPI value
PUT /api/pov/[povId]/kpi/[kpiId]
Body: {
  value: number;
  metadata?: Record<string, unknown>;
}

// Get KPI history
GET /api/pov/[povId]/kpi/[kpiId]/history
Query: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}
```

### Service Layer

#### KPITemplateService
```typescript
class KPITemplateService {
  async createTemplate(data: CreateTemplateInput): Promise<KPITemplate>
  async updateTemplate(id: string, data: UpdateTemplateInput): Promise<KPITemplate>
  async validateCalculation(calculation: string): Promise<ValidationResult>
  async listTemplates(filter?: TemplateFilter): Promise<KPITemplate[]>
}
```

#### KPIService
```typescript
class KPIService {
  async createKPI(data: CreateKPIInput): Promise<KPI>
  async updateValue(id: string, value: number, metadata?: unknown): Promise<KPI>
  async calculateStatus(id: string): Promise<KPIStatus>
  async getHistory(id: string, options?: HistoryOptions): Promise<KPIHistory[]>
}
```

## UI Components

### Template Management
- TemplateList: Overview of all templates
- TemplateForm: Create/edit templates
- CalculationEditor: JavaScript editor for calculations
- VisualizationConfig: Configure display options

### KPI Management
- KPIList: List of KPIs for a POV
- KPICard: Individual KPI display
- KPIForm: Create/edit KPI settings
- KPIHistory: Historical data display

### Visualization Components
- LineChart: Trend visualization
- BarChart: Comparison visualization
- GaugeChart: Current status visualization
- StatusIndicator: Traffic light indicator

## Calculation Engine

### Context Object
```typescript
interface CalculationContext {
  current: number;
  history: Array<{
    value: number;
    timestamp: Date;
  }>;
  target: {
    value: number;
    threshold?: {
      warning: number;
      critical: number;
    };
  };
  metadata?: Record<string, unknown>;
}
```

### Example Calculations
```javascript
// Revenue Growth
(context) => {
  const current = context.current;
  const previous = context.history[0]?.value || 0;
  return ((current - previous) / previous) * 100;
}

// Customer Satisfaction
(context) => {
  const ratings = context.current.ratings;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}
```

## Integration Points

### Launch System Integration
- KPI validation for launch
- Status impact on launch
- Historical data verification
- Target achievement check

### Phase System Integration
- Phase-specific KPIs
- Progress tracking
- Status dependencies
- Milestone tracking

## Error Handling

### Calculation Errors
```typescript
interface CalculationError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}
```

### Error Categories
- Invalid calculation
- Missing data points
- Type mismatches
- Threshold violations

## Testing Strategy

### Unit Tests
- Calculation testing
- Status determination
- History tracking
- Visualization parsing

### Integration Tests
- API endpoint testing
- Database interaction
- Service integration
- Error handling

### E2E Tests
- Template management
- KPI lifecycle
- Visualization rendering
- Performance testing

## Monitoring & Analytics

### Performance Metrics
- Calculation time
- Data point frequency
- Storage utilization
- API response time

### Business Metrics
- Template usage
- Common calculations
- Status distribution
- Update frequency

## Future Enhancements

### Phase 2 Features
- Advanced calculations
- Custom visualizations
- Batch updates
- Export capabilities

### Phase 3 Features
- Predictive analytics
- Machine learning integration
- Real-time updates
- Advanced reporting
