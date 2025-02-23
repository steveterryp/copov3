# KPI History Documentation

## Overview
The KPI history system provides comprehensive tracking of KPI value changes over time, supporting trend analysis, historical context for calculations, and visualization capabilities.

## History Structure

### Data Model
```typescript
interface KPIHistoryEntry {
  value: number;
  timestamp: string;
  metadata?: {
    calculationContext?: KPICalculationContext;
    [key: string]: any;
  };
}

interface KPICalculationContext {
  pov: {
    id: string;
    status: POVStatus;
    startDate: Date;
    endDate: Date;
  };
  current: any;
  target: KPITarget;
  history: KPIHistoryEntry[];
}
```

### Storage Format
- History entries stored as JSON in POVKPI model
- Each entry ~2.24KB in size
- Linear growth with number of entries
- Chronological order maintained

## Usage Guidelines

### Creating History Entries
```typescript
// Good: Create history entry with full context
const historyEntry: KPIHistoryEntry = {
  value: calculatedValue,
  timestamp: new Date().toISOString(),
  metadata: {
    calculationContext: context,
    source: 'automated_calculation'
  }
};

// Bad: Missing metadata
const historyEntry = {
  value: calculatedValue,
  timestamp: new Date().toISOString()
};
```

### Updating History
```typescript
// Good: Use atomic transactions
await prisma.$transaction(async (tx) => {
  // Update value and history together
  await tx.pOVKPI.update({
    where: { id: kpiId },
    data: {
      current: value,
      history: updatedHistory
    }
  });
});

// Bad: Separate updates
await updateValue();
await updateHistory(); // Risk of inconsistency
```

### Reading History
```typescript
// Good: Type-safe history access with defaults
const history: KPIHistoryEntry[] = kpi.history || [];

// Bad: Unsafe access
const history = kpi.history as any[];
```

## Performance Considerations

### Metrics
- History reads: ~1.4ms
- History writes: ~8ms
- Bulk operations: ~0.1ms per KPI
- Concurrent reads: ~0.2ms per operation

### Optimization Techniques
1. **Atomic Operations**
   - Use transactions for consistency
   - Batch updates when possible
   - Handle concurrent access

2. **Query Optimization**
   - Index JSON fields for faster queries
   - Use selective loading
   - Implement pagination for large histories

3. **Storage Management**
   - Monitor history size growth
   - Consider archiving old entries
   - Implement cleanup strategies

## Best Practices

### 1. Data Integrity
```typescript
// Validate history entries
function validateHistoryEntry(entry: unknown): entry is KPIHistoryEntry {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'value' in entry &&
    'timestamp' in entry &&
    typeof entry.value === 'number' &&
    typeof entry.timestamp === 'string'
  );
}

// Use validation when accessing history
const validEntries = history.filter(validateHistoryEntry);
```

### 2. Error Handling
```typescript
// Handle invalid history gracefully
if (!Array.isArray(history)) {
  return [];
}

// Provide fallbacks for calculations
const historyAvg = history.length > 0
  ? history.reduce((sum, entry) => sum + entry.value, 0) / history.length
  : currentValue;
```

### 3. Analytics Integration
```typescript
// Calculate trends
function calculateTrend(history: KPIHistoryEntry[]): number {
  if (history.length < 2) return 0;
  const recent = history.slice(-2);
  return recent[1].value - recent[0].value;
}

// Moving averages
function calculateMovingAverage(
  history: KPIHistoryEntry[],
  window: number = 3
): number {
  const recent = history.slice(-window);
  return recent.reduce((sum, entry) => 
    sum + entry.value, 0
  ) / recent.length;
}
```

### 4. Visualization Support
```typescript
// Prepare chart data
function prepareChartData(
  history: KPIHistoryEntry[],
  target: number
): ChartData {
  return {
    labels: history.map(entry => entry.timestamp),
    datasets: [
      {
        label: 'Value',
        data: history.map(entry => entry.value)
      },
      {
        label: 'Target',
        data: history.map(() => target)
      }
    ]
  };
}
```

## Testing

### Test Coverage
1. **History Structure**
   - Empty history initialization
   - Entry format validation
   - Metadata handling

2. **Calculations**
   - History-based calculations
   - Trend analysis
   - Moving averages

3. **Concurrent Operations**
   - Multiple simultaneous updates
   - Transaction isolation
   - Data consistency

4. **Performance**
   - Query execution times
   - Storage impact
   - Concurrent access

### Test Scripts
- test-kpi-framework.ts: Core functionality
- test-performance.ts: Performance metrics
- test-api-integration.ts: API endpoints

## Migration and Maintenance

### Data Migration
```typescript
// Migrate existing KPIs to include history
async function migrateKPIHistory() {
  const kpis = await prisma.pOVKPI.findMany({
    where: {
      history: null
    }
  });

  for (const kpi of kpis) {
    await prisma.pOVKPI.update({
      where: { id: kpi.id },
      data: {
        history: []
      }
    });
  }
}
```

### Maintenance Tasks
1. **Regular Cleanup**
   - Archive old history entries
   - Validate history integrity
   - Monitor storage usage

2. **Performance Monitoring**
   - Track query times
   - Monitor storage growth
   - Check concurrent access patterns

3. **Data Validation**
   - Verify history format
   - Check calculation accuracy
   - Validate metadata structure
