'use client';

import * as React from "react"
import { useFormContext, useFieldArray, Control } from "react-hook-form"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Switch } from "@/components/ui/Switch"
import { Label } from "@/components/ui/Label"
import { Trash2 } from "lucide-react"
import { PhaseType } from "@prisma/client"
import { WorkflowStage } from "@/lib/pov/types/phase"

interface WorkflowFormData {
  type: PhaseType
  stages: WorkflowStage[]
}

interface TaskEditorProps {
  control: Control<WorkflowFormData>
  stageIndex: number
  onRemove: () => void
}

interface TaskFieldProps {
  control: Control<WorkflowFormData>
  stageIndex: number
  taskIndex: number
}

function TaskField({ control, stageIndex, taskIndex }: TaskFieldProps) {
  const { register, watch } = useFormContext<WorkflowFormData>()
  const keyName = `stages.${stageIndex}.tasks.${taskIndex}.key` as const
  const labelName = `stages.${stageIndex}.tasks.${taskIndex}.label` as const
  const descName = `stages.${stageIndex}.tasks.${taskIndex}.description` as const
  const requiredName = `stages.${stageIndex}.tasks.${taskIndex}.required` as const

  const required = watch(requiredName, false)

  return (
    <div className="flex-1">
      <div className="space-y-4">
        <div>
          <Input
            {...register(keyName)}
            placeholder="Task Key"
          />
        </div>
        <div>
          <Input
            {...register(labelName)}
            placeholder="Task Label"
          />
        </div>
        <div>
          <Textarea
            {...register(descName)}
            placeholder="Task Description"
            rows={2}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={required}
            {...register(requiredName)}
          />
          <Label>Required</Label>
        </div>
      </div>
    </div>
  )
}

export default function TaskEditor({
  control,
  stageIndex,
  onRemove,
}: TaskEditorProps) {
  const { register } = useFormContext<WorkflowFormData>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: `stages.${stageIndex}.tasks` as const,
  })

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Input
              {...register(`stages.${stageIndex}.name` as const)}
              placeholder="Stage Name"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete stage</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Textarea
          {...register(`stages.${stageIndex}.description` as const)}
          placeholder="Stage Description"
          rows={2}
        />

        <div className="space-y-4">
          {fields.map((field, taskIndex) => (
            <div key={field.id} className="flex gap-4 items-start">
              <TaskField
                control={control}
                stageIndex={stageIndex}
                taskIndex={taskIndex}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(taskIndex)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete task</span>
              </Button>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={() =>
            append({
              key: "",
              label: "",
              description: "",
              required: false,
              dependencies: [],
            })
          }
        >
          Add Task
        </Button>
      </CardContent>
    </Card>
  )
}
