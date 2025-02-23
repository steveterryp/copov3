# Reusability Guide

## UI Components

### Card Components
```css
/* Base card structure */
.card {
    background-color: var(--card-bg);
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    border: 1px solid var(--border-color);
}

/* Card variations */
.card--interactive {
    cursor: pointer;
    transition: transform 0.3s ease;
}

.card--interactive:hover {
    transform: translateY(-2px);
}
```

### Button Components
```css
/* Base button */
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

/* Button variations */
.btn--primary {
    background-color: var(--primary-color);
    color: white;
}

.btn--secondary {
    background-color: var(--secondary-color);
    color: white;
}

.btn--outline {
    background-color: transparent;
    border: 1px solid currentColor;
}
```

## Utility Functions

### Date Formatting
```javascript
function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleDateString();
}
```

### Status Handling
```javascript
function getStatusClass(status) {
    const statusMap = {
        'active': 'status--active',
        'pending': 'status--pending',
        'completed': 'status--completed'
    };
    return statusMap[status.toLowerCase()] || 'status--default';
}
```

### Event Handling
```javascript
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

## Documentation Standards

### Component Documentation
```javascript
/**
 * @component Modal
 * @description Reusable modal component for displaying content in an overlay
 * 
 * @param {Object} props - Component properties
 * @param {string} props.title - Modal title
 * @param {string} props.content - Modal content
 * @param {Function} props.onClose - Close handler
 * 
 * @example
 * showModal({
 *   title: 'New POC',
 *   content: formContent,
 *   onClose: () => handleClose()
 * });
 */
```

### Function Documentation
```javascript
/**
 * @function calculateProgress
 * @description Calculates progress percentage based on completed items
 * 
 * @param {Array} items - Array of items to check
 * @param {string} completedProp - Property name to check for completion
 * @returns {number} Progress percentage
 * 
 * @example
 * const progress = calculateProgress(tasks, 'completed');
 */
```

## State Management

### State Updates
```javascript
function updateState(key, value) {
    AppState[key] = value;
    notifyStateChange(key);
}

function notifyStateChange(key) {
    // Notify all subscribers of state change
    subscribers[key]?.forEach(callback => callback(AppState[key]));
}
```

### State Subscription
```javascript
function subscribeToState(key, callback) {
    if (!subscribers[key]) {
        subscribers[key] = [];
    }
    subscribers[key].push(callback);
}
```

## Error Handling

### Error Wrapper
```javascript
async function errorWrapper(func) {
    try {
        return await func();
    } catch (error) {
        console.error('Operation failed:', error);
        throw error;
    }
}
```

### Validation Helper
```javascript
function validateInput(input, rules) {
    const errors = [];
    rules.forEach(rule => {
        if (!rule.validate(input)) {
            errors.push(rule.message);
        }
    });
    return errors;
}
```

## Naming Conventions

### Component Names
- Use PascalCase for component names
- Suffix with type (e.g., Card, Modal, Form)
- Examples: POCCard, TaskList, IntegrationModal

### CSS Classes
- Use kebab-case for class names
- Follow BEM methodology
- Structure: block__element--modifier
- Examples: card__header, btn--primary, task-list__item

### JavaScript
- Use camelCase for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Examples: getUserData(), class TaskManager, MAX_ITEMS

## File Organization

### Directory Structure
```
components/
├── base/          # Base components
├── forms/         # Form components
├── modals/        # Modal components
└── cards/         # Card components

utils/
├── date.js        # Date utilities
├── validation.js  # Validation utilities
└── state.js       # State management

styles/
├── base/          # Base styles
├── components/    # Component styles
└── utilities/     # Utility classes
```

## Best Practices

1. Component Creation
   - Single responsibility
   - Minimal dependencies
   - Clear documentation
   - Consistent styling

2. Code Reuse
   - DRY principle
   - Modular functions
   - Shared utilities
   - Common patterns

3. Maintenance
   - Regular updates
   - Version control
   - Change documentation
   - Deprecation notices
