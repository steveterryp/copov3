import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Separator } from '@/components/ui/Separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { PoVFormData } from '../PoVCreationForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface WorkflowSetupProps {
  data: PoVFormData;
  onUpdate: (data: Partial<PoVFormData>) => void;
  errors?: Record<string, string[]>;
}

interface Task {
  title: string;
  description: string;
}

interface Stage {
  name: string;
  tasks: Task[];
}

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().min(1, 'Task description is required'),
});

const stageSchema = z.object({
  name: z.string().min(1, 'Stage name is required'),
  tasks: z.array(taskSchema).min(1, 'At least one task is required'),
});

const workflowSchema = z.object({
  stages: z.array(stageSchema).min(1, 'At least one stage is required'),
});

type WorkflowFormData = z.infer<typeof workflowSchema>;

const WorkflowSetup: React.FC<WorkflowSetupProps> = ({ data, onUpdate, errors = {} }) => {
  const form = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      stages: data.stages,
    },
  });

  const handleFormChange = (stages: Stage[]) => {
    form.setValue('stages', stages);
    onUpdate({ stages });
  };

  const handleAddStage = () => {
    const newStages = [
      ...form.getValues('stages'),
      {
        name: '',
        tasks: []
      }
    ];
    handleFormChange(newStages);
  };

  const handleRemoveStage = (stageIndex: number) => {
    const newStages = form.getValues('stages').filter((_, index) => index !== stageIndex);
    handleFormChange(newStages);
  };

  const handleStageNameChange = (stageIndex: number, name: string) => {
    const newStages = [...form.getValues('stages')];
    newStages[stageIndex] = {
      ...newStages[stageIndex],
      name
    };
    handleFormChange(newStages);
  };

  const handleAddTask = (stageIndex: number) => {
    const newStages = [...form.getValues('stages')];
    newStages[stageIndex] = {
      ...newStages[stageIndex],
      tasks: [
        ...newStages[stageIndex].tasks,
        { title: '', description: '' }
      ]
    };
    handleFormChange(newStages);
  };

  const handleRemoveTask = (stageIndex: number, taskIndex: number) => {
    const newStages = [...form.getValues('stages')];
    newStages[stageIndex] = {
      ...newStages[stageIndex],
      tasks: newStages[stageIndex].tasks.filter((_, index) => index !== taskIndex)
    };
    handleFormChange(newStages);
  };

  const handleTaskChange = (
    stageIndex: number,
    taskIndex: number,
    field: keyof Task,
    value: string
  ) => {
    const newStages = [...form.getValues('stages')];
    newStages[stageIndex] = {
      ...newStages[stageIndex],
      tasks: newStages[stageIndex].tasks.map((task, index) =>
        index === taskIndex ? { ...task, [field]: value } : task
      )
    };
    handleFormChange(newStages);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Workflow Setup</h2>
        <p className="text-muted-foreground">
          Define the stages and tasks for your PoV workflow.
        </p>
      </div>

      <Form form={form}>
        <FormField
          control={form.control}
          name="stages"
          render={() => (
            <FormItem>
              <div>
                <Button
                  variant="outline"
                  onClick={handleAddStage}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Stage
                </Button>
              </div>

              <div className="space-y-4 mt-4">
                {form.getValues('stages').map((stage, stageIndex) => (
                  <Card key={stageIndex} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              value={stage.name}
                              onChange={(e) => handleStageNameChange(stageIndex, e.target.value)}
                              placeholder="Stage Name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStage(stageIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {stage.tasks.map((task, taskIndex) => (
                          <div key={taskIndex}>
                            {taskIndex > 0 && <Separator className="my-4" />}
                            <div className="flex items-start gap-4">
                              <div className="flex-1 space-y-4">
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      value={task.title}
                                      onChange={(e) => handleTaskChange(stageIndex, taskIndex, 'title', e.target.value)}
                                      placeholder="Task Title"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>

                                <FormItem>
                                  <FormControl>
                                    <Textarea
                                      value={task.description}
                                      onChange={(e) => handleTaskChange(stageIndex, taskIndex, 'description', e.target.value)}
                                      placeholder="Task Description"
                                      className="min-h-[80px]"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTask(stageIndex, taskIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTask(stageIndex)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Task
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </div>
  );
};

export default WorkflowSetup;
