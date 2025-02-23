'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Loader2, Plus, Pencil } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Task, TaskStatus } from '@/lib/tasks/types';
import { Phase } from '@/lib/types/phase';
import { useRouter } from 'next/navigation';
import TaskCreate from '@/components/tasks/TaskCreate';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';

interface PhaseResponse {
  data: Phase;
}

export default function PhaseTasksPage({ params }: { params: { povId: string; phaseId: string } }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const { data: phase, isLoading, error } = useQuery<PhaseResponse, Error>({
    queryKey: ['phase', params.phaseId],
    queryFn: async () => {
      console.log('Fetching phase data for tasks...');
      const response = await fetch(`/api/pov/${params.povId}/phase/${params.phaseId}`);
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to fetch phase:', errorData);
        throw new Error('Failed to fetch phase');
      }
      const data = await response.json();
      console.log('Phase data received:', data);
      return data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleTaskCreated = async (task: Task) => {
    console.log('Task created:', task);
    // Invalidate both the phase query and any task-related queries
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['phase', params.phaseId] }),
      queryClient.invalidateQueries({ queryKey: ['phase', params.phaseId, 'tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks', params.phaseId] })
    ]);
    setIsCreateDialogOpen(false);
  };

  if (isLoading) {
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
          <p className="text-destructive">Error: {error.message}</p>
        </Card>
      </div>
    );
  }

  if (!phase?.data) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <p>Phase not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            {phase.data.name} - Tasks
          </h1>
          <div className="flex gap-4">
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Task (Dialog)
            </Button>
            <Button
              onClick={() => router.push(`/pov/${params.povId}/phase/${params.phaseId}/task/new`)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Task (Page)
            </Button>
          </div>
        </div>

        {/* Tasks List */}
        {(phase.data.tasks || []).length > 0 ? (
          <div className="space-y-4">
            {(phase.data.tasks || []).map((task: Task) => (
              <Card key={task.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <Select
                        value={task.status}
                        onValueChange={async (value: TaskStatus) => {
                          try {
                            const response = await fetch(`/api/pov/${params.povId}/phase/${params.phaseId}/task/${task.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                ...task,
                                status: value,
                              }),
                            });

                            if (!response.ok) {
                              throw new Error('Failed to update task status');
                            }

                            await queryClient.invalidateQueries({ queryKey: ['phase', params.phaseId] });
                          } catch (err) {
                            console.error('Failed to update task status:', err);
                            // You might want to add a toast notification here
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
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
                      {task.assignee && (
                        <p className="text-sm text-muted-foreground">
                          Assignee: {task.assignee.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/pov/${params.povId}/phase/${params.phaseId}/task/${task.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit task</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No tasks yet. Click &quot;Add Task&quot; to create one.
          </p>
        )}

        {/* Create Task Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <TaskCreate
              povId={params.povId}
              phaseId={params.phaseId}
              onSuccess={handleTaskCreated}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}
