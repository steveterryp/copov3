# Shadcn Migration Performance Benchmarks

## Overview

This document outlines the performance metrics, benchmarks, and monitoring strategy for the MUI to Shadcn migration. It provides baseline measurements, target metrics, and tools for continuous performance monitoring.

## Performance Metrics

### 1. Bundle Size
```typescript
// Bundle size targets
interface BundleTargets {
  total: {
    current: number;    // Current MUI bundle size
    target: number;     // Target Shadcn bundle size
    reduction: number;  // Expected reduction
  };
  components: {
    [key: string]: {
      mui: number;      // MUI component size
      shadcn: number;   // Shadcn component size
      difference: number;
    };
  };
}

const bundleTargets: BundleTargets = {
  total: {
    current: 245_000,  // 245KB
    target: 180_000,   // 180KB
    reduction: 65_000  // 65KB (26.5% reduction)
  },
  components: {
    button: {
      mui: 12_000,     // 12KB
      shadcn: 4_000,   // 4KB
      difference: 8_000 // 8KB reduction
    },
    dialog: {
      mui: 28_000,     // 28KB
      shadcn: 15_000,  // 15KB
      difference: 13_000
    },
    select: {
      mui: 35_000,     // 35KB
      shadcn: 18_000,  // 18KB
      difference: 17_000
    }
  }
};
```

### 2. Runtime Performance
```typescript
// Performance measurement utilities
interface PerformanceMetrics {
  tti: number;        // Time to Interactive
  fcp: number;        // First Contentful Paint
  lcp: number;        // Largest Contentful Paint
  cls: number;        // Cumulative Layout Shift
  fid: number;        // First Input Delay
  memory: number;     // Memory usage
}

// Performance targets
const performanceTargets = {
  tti: 3500,          // 3.5s target
  fcp: 1000,          // 1s target
  lcp: 2500,          // 2.5s target
  cls: 0.1,           // 0.1 target
  fid: 100,           // 100ms target
  memory: 50_000_000  // 50MB target
};

// Performance monitoring
function measurePerformance(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    tti: performance.now(),
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0,
    memory: 0
  };

  // Measure First Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    metrics.fcp = entries[entries.length - 1].startTime;
  }).observe({ entryTypes: ['paint'] });

  // Measure Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    metrics.lcp = entries[entries.length - 1].startTime;
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // Measure Cumulative Layout Shift
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      metrics.cls += entry.value;
    }
  }).observe({ entryTypes: ['layout-shift'] });

  // Measure First Input Delay
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    metrics.fid = entries[0].processingStart - entries[0].startTime;
  }).observe({ entryTypes: ['first-input'] });

  // Measure Memory Usage
  if (performance.memory) {
    metrics.memory = performance.memory.usedJSHeapSize;
  }

  return metrics;
}
```

### 3. Component Performance
```typescript
// Component performance measurement
interface ComponentMetrics {
  renderTime: number;
  updateTime: number;
  memoryDelta: number;
  eventLatency: number;
}

// Component performance monitoring
function measureComponent(
  Component: React.ComponentType,
  props: Record<string, unknown>
): ComponentMetrics {
  const metrics: ComponentMetrics = {
    renderTime: 0,
    updateTime: 0,
    memoryDelta: 0,
    eventLatency: 0
  };

  // Measure initial render
  const startRender = performance.now();
  const { rerender, unmount } = render(<Component {...props} />);
  metrics.renderTime = performance.now() - startRender;

  // Measure update
  const startUpdate = performance.now();
  rerender(<Component {...props} />);
  metrics.updateTime = performance.now() - startUpdate;

  // Measure memory impact
  const startMemory = performance.memory?.usedJSHeapSize;
  unmount();
  metrics.memoryDelta = 
    (performance.memory?.usedJSHeapSize ?? 0) - (startMemory ?? 0);

  return metrics;
}

// Component performance targets
const componentTargets = {
  renderTime: 16,       // 16ms target (60fps)
  updateTime: 16,       // 16ms target
  memoryDelta: 100_000, // 100KB target
  eventLatency: 50      // 50ms target
};
```

## Monitoring Tools

### 1. Webpack Bundle Analyzer
```typescript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      defaultSizes: 'gzip',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    })
  ]
};
```

### 2. Performance Monitoring
```typescript
// Performance monitoring setup
interface PerformanceMonitor {
  metrics: PerformanceMetrics[];
  thresholds: typeof performanceTargets;
  violations: {
    count: number;
    details: Array<{
      metric: keyof PerformanceMetrics;
      value: number;
      threshold: number;
      timestamp: number;
    }>;
  };
}

class Monitor implements PerformanceMonitor {
  metrics: PerformanceMetrics[] = [];
  thresholds = performanceTargets;
  violations = {
    count: 0,
    details: []
  };

  measure() {
    const metrics = measurePerformance();
    this.metrics.push(metrics);
    this.checkViolations(metrics);
  }

  private checkViolations(metrics: PerformanceMetrics) {
    Object.entries(metrics).forEach(([metric, value]) => {
      const threshold = this.thresholds[metric as keyof PerformanceMetrics];
      if (value > threshold) {
        this.violations.count++;
        this.violations.details.push({
          metric: metric as keyof PerformanceMetrics,
          value,
          threshold,
          timestamp: Date.now()
        });
      }
    });
  }

  getReport() {
    return {
      metrics: this.metrics,
      violations: this.violations,
      summary: {
        averages: this.calculateAverages(),
        violationRate: this.violations.count / this.metrics.length
      }
    };
  }

  private calculateAverages() {
    return Object.keys(performanceTargets).reduce((acc, metric) => {
      const values = this.metrics.map(m => m[metric as keyof PerformanceMetrics]);
      acc[metric] = values.reduce((sum, val) => sum + val, 0) / values.length;
      return acc;
    }, {} as Record<string, number>);
  }
}
```

### 3. Continuous Monitoring
```typescript
// GitHub Action for performance monitoring
name: Performance Monitoring

on:
  push:
    branches: [ main, feat/shadcn-migration ]
  pull_request:
    branches: [ main ]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Analyze bundle size
        run: npm run analyze
        
      - name: Run performance tests
        run: npm run test:perf
        
      - name: Upload performance results
        uses: actions/upload-artifact@v2
        with:
          name: performance-results
          path: |
            bundle-report.html
            perf-results.json
```

## Performance Budgets

### 1. Bundle Size Budgets
```typescript
// Budget configuration
interface BudgetConfig {
  total: number;
  individual: {
    js: number;
    css: number;
    image: number;
  };
  routes: {
    initial: number;
    subsequent: number;
  };
}

const budgets: BudgetConfig = {
  total: 350_000,    // 350KB total
  individual: {
    js: 250_000,     // 250KB JS
    css: 50_000,     // 50KB CSS
    image: 100_000   // 100KB images
  },
  routes: {
    initial: 150_000, // 150KB initial route
    subsequent: 50_000 // 50KB subsequent routes
  }
};
```

### 2. Runtime Budgets
```typescript
// Runtime budget configuration
interface RuntimeBudget {
  tti: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  
  components: {
    render: number;
    update: number;
    interaction: number;
  };
  
  memory: {
    heap: number;
    components: number;
  };
}

const runtimeBudgets: RuntimeBudget = {
  tti: 3500,         // 3.5s Time to Interactive
  fcp: 1000,         // 1s First Contentful Paint
  lcp: 2500,         // 2.5s Largest Contentful Paint
  cls: 0.1,          // 0.1 Cumulative Layout Shift
  fid: 100,          // 100ms First Input Delay
  
  components: {
    render: 16,      // 16ms render time
    update: 16,      // 16ms update time
    interaction: 50  // 50ms interaction time
  },
  
  memory: {
    heap: 50_000_000,  // 50MB heap size
    components: 100_000 // 100KB per component
  }
};
```

## Optimization Techniques

### 1. Code Splitting
```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

// Component-based code splitting
const DataGrid = lazy(() => import('./components/DataGrid'));
const Chart = lazy(() => import('./components/Chart'));

// Preload on hover
const preloadComponent = (Component: React.LazyExoticComponent<any>) => {
  Component.preload?.();
};
```

### 2. Performance Optimization
```typescript
// Optimization utilities
const optimizations = {
  // Debounce expensive operations
  debounce: <T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  // Memoize expensive calculations
  memoize: <T extends (...args: any[]) => any>(
    fn: T
  ): T => {
    const cache = new Map();
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Virtual list for large datasets
  virtualList: <T,>({
    items,
    height,
    itemHeight,
    renderItem
  }: {
    items: T[];
    height: number;
    itemHeight: number;
    renderItem: (item: T) => React.ReactNode;
  }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const visibleItems = Math.ceil(height / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleItems, items.length);

    return (
      <div
        style={{ height, overflow: 'auto' }}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div style={{ height: items.length * itemHeight }}>
          <div
            style={{
              transform: `translateY(${startIndex * itemHeight}px)`
            }}
          >
            {items.slice(startIndex, endIndex).map(renderItem)}
          </div>
        </div>
      </div>
    );
  }
};
```

## Related Documentation
- [Migration Plan](./mui-to-shadcn.md)
- [Testing Strategy](./testing-strategy.md)
- [Component Architecture](../componentArchitecture.md)
- [Type System Guidelines](../type-system-guidelines.md)
