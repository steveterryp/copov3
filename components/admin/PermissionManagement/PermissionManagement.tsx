import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Checkbox } from '@/components/ui/Checkbox';
import { ResourceType, ResourceAction, UserRole } from '@/lib/types/auth';

interface PermissionManagementProps {
  role: UserRole;
  currentUserRole: UserRole;
  rolePermissions: Record<ResourceType, Record<ResourceAction, boolean>>;
  onPermissionChange: (role: UserRole, resource: ResourceType, action: ResourceAction, value: boolean) => void;
}

export default function PermissionManagement({
  role,
  currentUserRole,
  rolePermissions,
  onPermissionChange,
}: PermissionManagementProps) {
  const resources = Object.values(ResourceType);
  const actions = Object.values(ResourceAction);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
            <TableRow>
              <TableCell>Resource</TableCell>
              {actions.map((action) => (
                <TableCell key={action} align="center">
                  {action.charAt(0).toUpperCase() + action.slice(1).toLowerCase()}
                </TableCell>
              ))}
            </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <TableRow key={resource}>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {resource.charAt(0).toUpperCase() + resource.slice(1).toLowerCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getResourceDescription(resource)}
                  </p>
                </div>
              </TableCell>
                {actions.map((action) => (
                  <TableCell key={action} align="center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={rolePermissions[resource as ResourceType]?.[action as ResourceAction] || false}
                        onCheckedChange={(checked: boolean | 'indeterminate') =>
                          onPermissionChange(role, resource as ResourceType, action as ResourceAction, checked === true)
                        }
                        disabled={role === UserRole.SUPER_ADMIN || (role === UserRole.ADMIN && currentUserRole !== UserRole.SUPER_ADMIN)}
                      />
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getResourceDescription(resource: string): string {
  switch (resource) {
    case ResourceType.PoV:
      return 'PoV documents and their management';
    case ResourceType.PHASE:
      return 'Project phases within PoVs';
    case ResourceType.TASK:
      return 'Tasks and assignments';
    case ResourceType.USER:
      return 'User management and profiles';
    case ResourceType.TEAM:
      return 'Team organization and membership';
    case ResourceType.SETTINGS:
      return 'System configuration and preferences';
    case ResourceType.ANALYTICS:
      return 'Reports and data analysis';
    default:
      return '';
  }
}
