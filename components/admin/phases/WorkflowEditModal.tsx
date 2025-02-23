'use client';

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form"
import { useForm, useFieldArray, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PhaseType } from "@prisma/client"
import { WorkflowStage } from "@/lib/pov/types/phase"
import { workflowSchema } from "@/app/api/admin/phases/workflow/route.config"
import TaskEditor from "./TaskEditor"

interface WorkflowFormData {
  type: PhaseType
  stages: WorkflowStage[]
}

interface WorkflowEditModalProps {
  workflow?: WorkflowFormData
  open: boolean
  onClose: () => void
  onSave: (data: WorkflowFormData) => void
}

export default function WorkflowEditModal({
  workflow,
  open,
  onClose,
  onSave,
}: WorkflowEditModalProps) {
  const form = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowSchema),
    defaultValues: workflow || {
      type: PhaseType.PLANNING,
      stages: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stages",
  })

  const onSubmit = form.handleSubmit((data: WorkflowFormData) => {
    onSave(data)
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Workflow</DialogTitle>
        </DialogHeader>

        <Form form={form}>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id}>
                  <TaskEditor
                    control={form.control}
                    stageIndex={index}
                    onRemove={() => remove(index)}
                  />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  name: "",
                  description: "",
                  tasks: [],
                })
              }
            >
              Add Stage
            </Button>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
