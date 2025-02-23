'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PlusIcon } from 'lucide-react';

interface CustomRoleSelectProps {
  value?: string;
  onChange: (roleId: string | undefined) => void;
  error?: string;
  jobTitles: Array<{ id: string; name: string }>;
}

export default function CustomRoleSelect({
  value,
  onChange,
  error,
  jobTitles
}: CustomRoleSelectProps): JSX.Element {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [newRoleName, setNewRoleName] = React.useState('');
  const [localError, setLocalError] = React.useState<string | undefined>(error);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (roleId: string) => {
    onChange(roleId === 'none' ? undefined : roleId);
  };

  const handleCreateRole = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newRoleName,
          permissions: [], // Default permissions
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      // Refresh page to get updated job titles
      window.location.reload();
      setOpenDialog(false);
      setNewRoleName('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setIsLoading(false);
    }
  };

  // Update local error when prop changes
  React.useEffect(() => {
    setLocalError(error);
  }, [error]);

  return (
    <>
      <div className="flex gap-2">
        <FormItem className="flex-1">
          <FormLabel>Job Title (Optional)</FormLabel>
          <Select value={value || 'none'} onValueChange={handleChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a job title" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-muted-foreground">No Job Title</span>
              </SelectItem>
              {jobTitles.map((title) => (
                <SelectItem key={title.id} value={title.id}>
                  {title.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {localError && <FormMessage>{localError}</FormMessage>}
        </FormItem>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpenDialog(true)}
          className="self-end mb-[2px]"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job Title</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              autoFocus
              placeholder="Enter job title name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
