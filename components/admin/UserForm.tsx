'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { UserRole, UserStatus } from '@/lib/types/auth';
import RoleSelect from './RoleSelect';
import StatusSelect from './StatusSelect';
import CustomRoleSelect from './CustomRoleSelect';

const userFormSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  customRoleId: z.string().optional(),
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: UserFormData) => Promise<void>;
  initialData?: UserFormData;
  mode: 'create' | 'edit';
  currentUserRole?: UserRole;
  jobTitles?: Array<{ id: string; name: string }>;
}

export default function UserForm({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  currentUserRole,
  jobTitles = []
}: UserFormProps): JSX.Element {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: initialData || {
      email: '',
      name: '',
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      customRoleId: undefined,
    }
  });

  const handleSubmit = async (data: UserFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New User' : 'Edit User'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Form form={form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  {error}
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        disabled={mode === 'edit' || isLoading}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isLoading}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <RoleSelect
                      value={field.value}
                      onChange={field.onChange}
                      currentUserRole={currentUserRole}
                      mode={mode}
                      initialRole={initialData?.role}
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <StatusSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="customRoleId"
                render={({ field }) => (
                  <CustomRoleSelect
                    value={field.value}
                    onChange={field.onChange}
                    jobTitles={jobTitles}
                  />
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
