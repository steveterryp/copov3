# React Hook Form Import Issues

## Issue Description
We are experiencing import issues with react-hook-form in three components:
- TaskEditor.tsx
- TemplateEditModal.tsx
- WorkflowEditModal.tsx

The build system is unable to resolve imports from react-hook-form, specifically:
- useForm
- useFormContext
- useFieldArray
- FormProvider

## Code Elements Involved

### 1. TaskEditor Component
- Purpose: Manages individual task editing within workflow stages
- Key Features:
  - Form field management for task properties
  - Dynamic field array handling for multiple tasks
  - Integration with parent form context

### 2. TemplateEditModal Component
- Purpose: Handles template creation and editing
- Key Features:
  - Form management for template properties
  - Phase type selection
  - Template metadata handling

### 3. WorkflowEditModal Component
- Purpose: Manages workflow editing interface
- Key Features:
  - Stage management
  - Integration with TaskEditor
  - Form context provider for nested components

## Root Cause Analysis
The issue stems from attempting to import from internal paths of react-hook-form package. We tried several import patterns:

1. Direct imports (failed):
```typescript
import { useForm } from 'react-hook-form'
```

2. Internal path imports (failed):
```typescript
import { useForm } from 'react-hook-form/dist/index'
```

3. Experimental imports (failed):
```typescript
import { experimental_useForm as useForm } from 'react-hook-form'
```

## Fix Attempts History

1. Initial approach: Direct imports from package root
2. Attempted to use internal paths (/dist/index)
3. Tried experimental feature imports
4. Attempted namespace imports with * as RHF
5. Tried importing from specific subpaths

## Recommended Solutions

### Immediate Solution
1. Install specific version of react-hook-form known to work with Next.js:
```bash
npm install react-hook-form@7.43.0
```

2. Use simplified imports:
```typescript
import { useForm, useFormContext, useFieldArray, FormProvider } from 'react-hook-form'
```

### Alternative Solutions

1. **Simplified Form Management**
   - Replace react-hook-form with basic React state management
   - Use useState and useReducer for form state
   - Pros: Simpler implementation, no dependency issues
   - Cons: Loss of form validation and field array features

```typescript
const [formState, setFormState] = useState({
  name: '',
  type: PhaseType.PLANNING,
  description: '',
  isDefault: false,
})
```

2. **Formik Alternative**
   - Replace react-hook-form with Formik
   - Similar feature set, different import pattern
   - Pros: More stable package exports
   - Cons: Migration effort required

```typescript
import { Formik, Form, Field } from 'formik'
```

3. **Custom Form Hook**
   - Create a simplified custom form hook
   - Handle basic form state and validation
   - Pros: Full control over implementation
   - Cons: Need to implement features from scratch

```typescript
function useCustomForm<T>(initialValues: T) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  
  // Form handling logic
  return { values, setValues, errors }
}
```

## Implementation Plan

1. **Phase 1: Quick Fix**
   - Try installing specific version (7.43.0)
   - Update imports to use package root
   - Test build and functionality

2. **Phase 2: If Quick Fix Fails**
   - Implement simplified form state management
   - Remove react-hook-form dependency
   - Update components to use basic React state

3. **Phase 3: Long-term Solution**
   - Evaluate form library alternatives
   - Create proof of concept with chosen solution
   - Plan migration strategy

## Impact Assessment
- Build process blocked
- Form functionality affected in admin interface
- Template and workflow management features impacted

## Additional Considerations
- Need to maintain TypeScript type safety
- Form validation requirements
- Complex nested form state management
- Integration with existing components

## Next Steps
1. Try installing specific version
2. If unsuccessful, implement simplified solution
3. Document chosen approach
4. Update affected components
5. Add comprehensive tests for new implementation
