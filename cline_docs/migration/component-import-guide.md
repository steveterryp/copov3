# Component Import Migration Guide

## Overview

As part of our migration from MUI to Shadcn UI, we've updated our component exports to use default exports instead of named exports. This guide explains how to update your imports to work with the new component structure.

## Import Changes Required

### Before (Named Imports)
```typescript
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert"
```

### After (Default Imports)
```typescript
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Alert, { AlertTitle, AlertDescription } from "@/components/ui/Alert"
```

## Component List

Here's a list of components that need import updates:

### Basic Components
- Button
- Card
- Input
- Label
- Form
- Select
- Switch
- Checkbox
- RadioGroup
- TextField

### Navigation Components
- Tabs
- Breadcrumb
- DropdownMenu
- Sheet

### Feedback Components
- Alert
- Dialog
- Progress
- Skeleton

### Data Display
- Table
- Chart

## Compatibility Components

For backward compatibility, we provide *Compat components that support both MUI and Shadcn:

```typescript
import ButtonCompat from "@/components/ui/ButtonCompat"
import CardCompat from "@/components/ui/CardCompat"
// etc.
```

These components accept a `useShadcn` prop to explicitly opt into the Shadcn implementation:

```typescript
<ButtonCompat useShadcn>Click me</ButtonCompat>
```

## Migration Steps

1. Search for component imports in your codebase:
   ```bash
   grep -r "import.*from.*@/components/ui/" .
   ```

2. Update imports to use default import syntax

3. If you need MUI compatibility, use the *Compat version of the component

4. Test the component after updating imports

## Common Issues

### Type Errors
If you see errors like:
```
Module '"@/components/ui/Button"' has no exported member 'Button'
```
This means you need to update to default import syntax.

### Missing Exports
If you see errors like:
```
Module not found: Can't resolve '@/components/ui/ButtonCompat'
```
Make sure you're using the correct filename case (PascalCase).

## Testing

After updating imports, run:
```bash
npm run build
```

This will catch any remaining import issues.
