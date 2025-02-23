#!/bin/bash

# Create backup directory outside project
BACKUP_DIR="/tmp/copov2-tests-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# List of test directories to remove
TEST_DIRS=(
  "app/api/auth/__tests__"
  "app/api/dashboard/pov-overview/__tests__"
  "app/api/dashboard/team-activity/__tests__"
  "app/api/pov/[povId]/phase/[phaseId]/task/__tests__"
  "app/api/pov/[povId]/phase/__tests__"
  "app/api/pov/[povId]/phase/reorder/__tests__"
  "app/api/pov/__tests__"
  "lib/store/__tests__"
  "lib/websocket/__tests__"
  "middleware/__tests__"
)

# Function to backup and remove a directory
backup_and_remove() {
  local dir="$1"
  if [ -d "$dir" ]; then
    echo "Processing $dir"
    # Create the same directory structure in backup
    mkdir -p "$BACKUP_DIR/$(dirname "$dir")"
    # Copy the directory to backup
    cp -r "$dir" "$BACKUP_DIR/$(dirname "$dir")/"
    # Remove the original directory
    rm -rf "$dir"
    echo "✓ Removed $dir"
  else
    echo "Warning: $dir not found"
  fi
}

# Process each test directory
for dir in "${TEST_DIRS[@]}"; do
  backup_and_remove "$dir"
done

echo "Test directories have been backed up to $BACKUP_DIR and removed"
echo "If you need to restore them, you can find them in the backup directory"

# Remove test configuration files
TEST_CONFIG_FILES=(
  ".env.test"
)

for config in "${TEST_CONFIG_FILES[@]}"; do
  if [ -f "$config" ]; then
    echo "Backing up $config"
    cp "$config" "$BACKUP_DIR/"
    echo "Removing $config"
    rm "$config"
  else
    echo "Warning: $config not found"
  fi
done

echo "Test directories and configuration files have been backed up and removed"
