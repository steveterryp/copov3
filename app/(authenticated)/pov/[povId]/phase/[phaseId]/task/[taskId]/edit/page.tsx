'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Calendar } from '@/components/ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@/lib/types/task';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function EditTaskPage({ params }: { params: { povId: string; phaseId: string; taskId: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  // Fetch POV for team members
  const { data: pov, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['pov', params.povId],
    queryFn: async () => {
      const response = await fetch(`/api/pov/${params.povId}`);
      if (!response.ok) throw new Error('Failed to fetch POV');
      const { data } = await response.json();
      return data.pov;
    },
  });

  const teamMembers = pov?.team?.members?.map((member: any) => member.user) || [];

  // Fetch task data
  const { data: task } = useQuery({
    queryKey: ['task', params.taskId],
    queryFn: async () => {
      const response = await fetch(`/api/pov/${params.povId}/phase/${params.phaseId}/task/${params.taskId}`);
      if (!response.ok) throw new Error('Failed to fetch task');
      const { data } = await response.json();
      return data;
    },
  });

  // Set form data when task is loaded
  React.useEffect(() => {
    if (task) {
      console.log('Setting form data:', task);
      form.reset({
        title: task.title,
        description: task.description || '',
        assigneeId: task.assigneeId || null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        priority: task.priority || TaskPriority.MEDIUM,
        status: task.status || TaskStatus.OPEN,
      });
      setLoading(false);
    }
  }, [task, form.reset, form]);

  const onSubmit = async (formData: TaskFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.title?.trim()) {
        throw new Error('Title is required');
      }

      // Transform the data to match the API expectations
      const data = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
      };
      
      console.log('Submitting task update:', data);
      
      const response = await fetch(`/api/pov/${params.povId}/phase/${params.phaseId}/task/${params.taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log('Task update response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update task');
      }

      // Invalidate both task and phase queries to ensure UI is updated
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['phase', params.phaseId, 'tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['task', params.taskId] })
      ]);

      // Navigate back to tasks list
      router.push(`/pov/${params.povId}/phase/${params.phaseId}/tasks`);
    } catch (err) {
      console.error('Task update error:', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-destructive/10">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Error Loading Task
          </h2>
          <p className="text-destructive mb-4">
            {error.message}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(`/pov/${params.povId}/phase/${params.phaseId}/tasks`)}
          >
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Task Not Found</h2>
          <Button
            variant="outline"
            onClick={() => router.push(`/pov/${params.povId}/phase/${params.phaseId}/tasks`)}
          >
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-6">Edit Task</h1>

        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter task title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter task description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskPriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={isLoadingTeam}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {teamMembers.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/pov/${params.povId}/phase/${params.phaseId}/tasks`)}
                disabled={loading || isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
