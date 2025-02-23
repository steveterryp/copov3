#!/bin/bash

# List of Compat components to remove
COMPAT_FILES=(
  "components/ui/ChartCompat.tsx"
  "components/ui/DropdownMenuCompat.tsx"
  "components/ui/DialogCompat.tsx"
  "components/ui/ButtonCompat.tsx"
  "components/ui/CheckboxCompat.tsx"
  "components/ui/TabsCompat.tsx"
  "components/ui/RadioGroupCompat.tsx"
  "components/ui/TextFieldCompat.tsx"
  "components/ui/TableCompat.tsx"
  "components/ui/CardCompat.tsx"
  "components/ui/SelectCompat.tsx"
  "components/ui/SheetCompat.tsx"
  "components/ui/BreadcrumbCompat.tsx"
  "components/ui/SwitchCompat.tsx"
)

# Create backup directory outside project
BACKUP_DIR="/tmp/copov2-compat-components-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup and remove each file
for file in "${COMPAT_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Backing up $file"
    cp "$file" "$BACKUP_DIR/$(basename $file)"
    echo "Removing $file"
    rm "$file"
  else
    echo "Warning: $file not found"
  fi
done

echo "Compat components have been backed up to $BACKUP_DIR and removed"
echo "If you need to restore them, you can find them in the backup directory"
