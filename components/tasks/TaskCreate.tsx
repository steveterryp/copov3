import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Task, TaskPriority, TaskStatus } from '@/lib/types/task';
import { useSettings } from '@/lib/hooks/useSettings';
import { formatDate } from '@/lib/utils/dateFormat';

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface PoV {
  id: string;
  team?: {
    id: string;
    name: string;
    members: Array<{
      user: TeamMember;
    }>;
  };
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  teamId: z.string().optional().nullable(),
  povId: z.string().optional().nullable(),
  phaseId: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  priority: z.nativeEnum(TaskPriority),
  status: z.nativeEnum(TaskStatus),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskCreateProps {
  povId?: string;
  phaseId?: string;
  teamId?: string;
  onSuccess?: (task: Task) => void;
  onCancel?: () => void;
}

export default function TaskCreate({
  povId,
  phaseId,
  teamId,
  onSuccess,
  onCancel,
}: TaskCreateProps) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      povId: povId || null,
      phaseId: phaseId || null,
      teamId: teamId || null,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.OPEN,
    },
  });

  // Fetch team members for assignee selection
  const { data: pov, isLoading: isLoadingTeam, error: povError } = useQuery<{ data: PoV }>({
    queryKey: ['pov', povId],
    queryFn: async () => {
      try {
        console.log('Fetching PoV:', povId);
        const response = await fetch(`/api/pov/${povId}`);
        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!response.ok) {
          console.error('PoV fetch failed:', response.status, responseText);
          throw new Error(`Failed to fetch PoV: ${response.status}`);
        }

        try {
          const data = JSON.parse(responseText);
          console.log('Parsed PoV data:', data);
          return data;
        } catch (parseError) {
          console.error('Failed to parse PoV response:', parseError);
          throw new Error('Invalid PoV response format');
        }
      } catch (error) {
        console.error('PoV fetch error:', error);
        throw error;
      }
    },
    enabled: !!povId,
  });

  console.log('PoV query state:', { 
    pov, 
    isLoadingTeam, 
    error: povError,
    hasTeam: !!pov?.data.team,
    hasMembers: !!pov?.data.team?.members,
    membersLength: pov?.data.team?.members?.length
  });

  const teamMembers = React.useMemo(() => {
    if (!pov?.data.team?.members) {
      console.log('No team members found');
      return [];
    }

    return pov.data.team.members
      .map(({ user }) => user)
      .filter((user): user is TeamMember => {
        if (!user?.id || !user?.name) {
          console.warn('Invalid team member structure:', user);
          return false;
        }
        return true;
      });
  }, [pov?.data.team?.members]);

  console.log('Processed team members:', teamMembers);

  if (povError) {
    console.error('PoV error details:', povError);
  }

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetch(`/api/pov/${povId}/phase/${phaseId}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create task');
      }
      return response.json();
    },
    onSuccess: (response) => {
      console.log('Task creation response:', response);
      if (!response?.data) {
        throw new Error('Invalid response from server');
      }
      queryClient.invalidateQueries({ queryKey: ['phase', phaseId, 'tasks'] });
      onSuccess?.(response.data);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      setError(null);
      console.log('Submitting task data:', data);
      await createTask.mutateAsync(data);
    } catch (err) {
      console.error('Task creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-bold mb-6">Create New Task</h2>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
            name="assigneeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee</FormLabel>
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  disabled={isLoadingTeam}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {teamMembers.map((user) => (
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

          <div className="grid grid-cols-2 gap-4">
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
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
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
          </div>

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
              disabled={createTask.isPending}
              className="flex-1"
            >
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Task'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
