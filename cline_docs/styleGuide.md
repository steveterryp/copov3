[Previous content remains the same until Component-Specific Styles...]

## Component-Specific Styles

### Navigation
```typescript
const navigationStyles = {
  drawer: {
    width: '280px',
    background: '#f8fafc'
  },
  item: {
    height: '44px',
    borderRadius: '8px',
    marginX: '8px',
    states: {
      hover: {
        background: alpha(theme.palette.primary.main, 0.08)
      },
      active: {
        background: alpha(theme.palette.primary.main, 0.12),
        color: theme.palette.primary.main,
        fontWeight: 600
      }
    }
  },
  nestedItem: {
    height: '40px',
    paddingLeft: '40px',
    marginX: '8px'
  },
  icon: {
    size: '20px',
    opacity: {
      default: 1,
      nested: 0.7
    }
  },
  transitions: {
    collapse: '0.2s ease-in-out',
    transform: '0.2s'
  }
}
```

### Layout
```typescript
const layoutStyles = {
  appBar: {
    height: '64px',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(6px)',
    borderBottom: '1px solid',
    borderColor: theme.palette.divider
  },
  actionIcon: {
    padding: '8px',
    marginLeft: '8px',
    states: {
      hover: {
        background: theme.palette.action.hover,
        color: theme.palette.primary.main
      }
    }
  },
  avatar: {
    size: '32px',
    marginLeft: '8px',
    states: {
      hover: {
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}`
      }
    }
  }
}
```

[Previous content remains the same until Component Examples...]

## Component Examples

### Navigation Item
```typescript
const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active?: boolean }>(({ theme, active }) => ({
  marginX: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  height: navigationStyles.item.height,
  '&:hover': {
    backgroundColor: navigationStyles.item.states.hover.background
  },
  ...(active && {
    backgroundColor: navigationStyles.item.states.active.background,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main
    },
    '& .MuiTypography-root': {
      color: theme.palette.primary.main,
      fontWeight: navigationStyles.item.states.active.fontWeight
    }
  })
}));
```

### Action Icon
```typescript
const ActionIcon = styled(IconButton)(({ theme }) => ({
  marginLeft: layoutStyles.actionIcon.marginLeft,
  padding: layoutStyles.actionIcon.padding,
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: layoutStyles.actionIcon.states.hover.background,
    color: layoutStyles.actionIcon.states.hover.color
  }
}));
```

[Previous content remains the same until Usage Guidelines...]

## Usage Guidelines

[Previous guidelines remain...]

6. **Navigation Patterns**
   - Use consistent item heights and spacing
   - Implement proper state transitions
   - Maintain visual hierarchy with nested items
   - Use appropriate icon opacity for hierarchy
   - Ensure smooth expand/collapse animations

7. **Layout Structure**
   - Follow responsive drawer patterns
   - Implement proper app bar styling
   - Use consistent action icon styling
   - Maintain proper spacing between elements
   - Handle mobile navigation appropriately

[Rest of the content remains the same...]
