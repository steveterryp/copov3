import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { LaunchChecklistItem } from "@/lib/pov/types/launch"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert"
import { Skeleton } from "@/components/ui/Skeleton"
import { Progress } from "@/components/ui/Progress"

interface ChecklistProps {
  povId: string
  onComplete?: () => void
}

interface ChecklistResponse {
  items: LaunchChecklistItem[]
  progress: {
    completed: number
    total: number
  }
}

async function fetchChecklist(povId: string): Promise<ChecklistResponse> {
  const response = await fetch(`/api/pov/${povId}/launch/checklist`)
  if (!response.ok) throw new Error('Failed to fetch checklist')
  return response.json()
}

export function ChecklistSkeleton() {
  return (
    <Card className="p-4 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </Card>
  )
}

export default function LaunchChecklist({ povId, onComplete }: ChecklistProps) {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<ChecklistResponse>({
    queryKey: ["launch-checklist", povId],
    queryFn: () => fetchChecklist(povId),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ key, completed }: { key: string; completed: boolean }) => {
      const response = await fetch(`/api/pov/${povId}/launch/checklist/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      })
      if (!response.ok) throw new Error('Failed to update checklist item')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launch-checklist", povId] })
    },
  })

  if (isLoading) return <ChecklistSkeleton />

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load launch checklist</AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  const { items, progress } = data
  const progressPercentage = (progress.completed / progress.total) * 100

  return (
    <Card className="p-4 space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Launch Checklist</h2>
          <div className="text-sm text-muted-foreground">
            {progress.completed} of {progress.total} completed
          </div>
        </div>
        <Progress value={progressPercentage} />
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.key} className="p-4">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="mt-0.5"
                onClick={() => updateMutation.mutate({
                  key: item.key,
                  completed: !item.completed
                })}
              >
                {item.completed ? '✓' : '○'}
              </Button>
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                )}
                {item.metadata?.url && (
                  <a
                    href={item.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 block"
                  >
                    View Documentation
                  </a>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {progress.completed === progress.total && (
        <div className="flex justify-end">
          <Button onClick={onComplete}>
            Complete Launch Checklist
          </Button>
        </div>
      )}

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to update checklist item</AlertDescription>
        </Alert>
      )}
    </Card>
  )
}
