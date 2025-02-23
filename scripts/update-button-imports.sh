#!/bin/bash

# Create a backup of each file and update the import
for file in \
  components/notifications/NotificationBell.tsx \
  components/notifications/NotificationCenter.tsx \
  components/layout/NotificationBell.tsx \
  components/layout/UserMenu.tsx \
  components/layout/AdminHeader.tsx \
  components/admin/UserManagement/UserFilter.tsx \
  components/admin/UserManagement/BulkActions.tsx \
  components/admin/UserManagement/UserTable.tsx \
  components/admin/CustomRoleSelect.tsx \
  components/admin/UserForm.tsx \
  components/ui/DataTable.tsx \
  components/ui/DatePicker.tsx \
  components/pov/crm/SyncStatus.tsx \
  components/pov/Creation/PoVCreationForm.tsx \
  components/pov/Creation/steps/MetricsGoals.tsx \
  components/pov/Creation/steps/Resources.tsx \
  components/pov/Creation/steps/WorkflowSetup.tsx \
  components/pov/launch/Checklist.tsx \
  components/pov/List/PoVList.tsx \
  components/pov/kpi/TemplateManager.tsx \
  components/pov/phases/TemplateSelector.tsx \
  components/pov/phases/ApprovalWorkflow.tsx \
  components/tasks/TaskCreate.tsx \
  components/tasks/TaskCard.tsx \
  components/auth/PasswordResetForm.tsx \
  components/auth/RequestPasswordResetForm.tsx \
  components/auth/LoginForm.tsx \
  app/(auth)/register/page.tsx \
  app/(auth)/login/page.tsx \
  app/(authenticated)/support/feature/page.tsx \
  app/(authenticated)/support/request/page.tsx \
  app/(authenticated)/admin/crm/settings/page.tsx \
  app/(authenticated)/admin/crm/page.tsx \
  app/(authenticated)/admin/crm/mapping/page.tsx \
  app/(authenticated)/admin/crm/sync/page.tsx \
  app/(authenticated)/admin/dashboard/page.tsx \
  app/(authenticated)/admin/roles/page.tsx \
  app/(authenticated)/admin/users/page.tsx \
  app/(authenticated)/admin/phases/page.tsx \
  app/(authenticated)/pov/[povId]/edit/page.tsx \
  app/(authenticated)/pov/[povId]/phase/new/page.tsx \
  app/(authenticated)/pov/[povId]/phase/[phaseId]/task/[taskId]/edit/page.tsx \
  app/(authenticated)/pov/[povId]/phase/[phaseId]/edit/page.tsx \
  app/(authenticated)/pov/[povId]/phase/[phaseId]/tasks/page.tsx \
  app/(authenticated)/pov/create/page.tsx \
  app/(authenticated)/profile/page.tsx \
  app/(authenticated)/test-auth/page.tsx
do
  if [ -f "$file" ]; then
    # Create a backup
    cp "$file" "${file}.bak"
    
    # Replace the import statement
    sed -i 's/import Button from/import { Button } from/g' "$file"
    
    echo "Updated $file"
  else
    echo "Warning: $file not found"
  fi
done

echo "Done updating Button imports"
