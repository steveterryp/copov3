# Component Naming Convention Fixes

## Issues Overview

We have three main categories of naming convention issues to address:

1. **Missing Default Exports (67 files)**
   - Components using named exports instead of default exports
   - Example: `export { Button }` → `export default Button`

2. **Missing Declarations (15 files)**
   - Components without proper declarations matching their file names
   - Example: Missing `const ComponentName = ...` declaration

3. **Incorrect File Casing (14 files)**
   - Files using kebab-case instead of PascalCase
   - Example: `dropdown-menu.tsx` → `DropdownMenu.tsx`

## Files to Rename (PascalCase)

### UI Components
```bash
# Rename commands
git mv components/ui/Dropdown-menu.tsx components/ui/DropdownMenu.tsx
git mv components/ui/Radio-group.tsx components/ui/RadioGroup.tsx
git mv components/ui/Text-field-field-compat.tsx components/ui/TextFieldCompat.tsx

# Compat files
git mv components/ui/Breadcrumb-compat.tsx components/ui/BreadcrumbCompat.tsx
git mv components/ui/Button-compat.tsx components/ui/ButtonCompat.tsx
git mv components/ui/Card-compat.tsx components/ui/CardCompat.tsx
git mv components/ui/Chart-compat.tsx components/ui/ChartCompat.tsx
git mv components/ui/Checkbox-compat.tsx components/ui/CheckboxCompat.tsx
git mv components/ui/Dialog-compat.tsx components/ui/DialogCompat.tsx
git mv components/ui/Dropdown-menu-menu-compat.tsx components/ui/DropdownMenuCompat.tsx
git mv components/ui/Radio-group-group-compat.tsx components/ui/RadioGroupCompat.tsx
git mv components/ui/Select-compat.tsx components/ui/SelectCompat.tsx
git mv components/ui/Sheet-compat.tsx components/ui/SheetCompat.tsx
git mv components/ui/Switch-compat.tsx components/ui/SwitchCompat.tsx
```

## Component Export Patterns

### 1. Basic Component Export
```typescript
// Before
export const Button = () => {
  // ...
}

// After
const Button = () => {
  // ...
}
export default Button;
```

### 2. Component with Additional Exports
```typescript
// Before
export const Button = () => {
  // ...
}
export { Button, buttonVariants }

// After
const Button = () => {
  // ...
}
export { buttonVariants }
export default Button;
```

### 3. ForwardRef Component
```typescript
// Before
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(() => {
  // ...
})

// After
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(() => {
  // ...
})
export default Button;
```

## Components by Directory

### UI Components (/components/ui/*)
- Alert.tsx
- Breadcrumb.tsx
- Button.tsx
- Card.tsx
- Chart.tsx
- Checkbox.tsx
- Dialog.tsx
- DropdownMenu.tsx
- Form.tsx
- Input.tsx
- Label.tsx
- Progress.tsx
- RadioGroup.tsx
- Select.tsx
- Sheet.tsx
- Skeleton.tsx
- Switch.tsx
- Table.tsx
- Tabs.tsx
- TextField.tsx
- Timeline.tsx
- Tooltip.tsx

### Auth Components (/components/auth/*)
- LoginForm.tsx
- PasswordResetForm.tsx
- RequestPasswordResetForm.tsx

### Dashboard Components (/components/dashboard/*)
- DashboardLayout.tsx
- widgets/PoVOverview.tsx
- widgets/TeamActivity.tsx

### Provider Components (/components/providers/*)
- AuthProvider.tsx
- ClientProviders.tsx
- DatePickerProvider.tsx
- NotificationProvider.tsx
- Providers.tsx
- QueryProvider.tsx
- ThemeProvider.tsx

### Task Components (/components/tasks/*)
- TaskCard.tsx
- TaskList.tsx

## Implementation Steps

1. **Rename Files**
   ```bash
   # Run rename commands listed in "Files to Rename" section
   ```

2. **Update Component Exports**
   - Add component declaration if missing
   - Convert to default export
   - Keep any additional named exports

3. **Update Imports**
   ```typescript
   // Before
   import { ComponentName } from './path/to/component'
   
   // After
   import ComponentName from './path/to/component'
   ```

4. **Verify Changes**
   ```bash
   # Run naming check
   node scripts/check-naming.mjs
   
   # Start dev server to verify components
   npm run dev
   ```

## Notes

1. **Compatibility Files**
   - Rename -compat files to PascalCase
   - No need to modify their exports
   - Update any imports referencing them

2. **Import Updates**
   - Use default imports for components
   - Keep named imports for utilities/types
   - Update all affected files

3. **Documentation**
   - Update component documentation
   - Update import examples in docs
   - Update any related guides
