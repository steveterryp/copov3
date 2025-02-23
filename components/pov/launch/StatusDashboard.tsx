import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import type { LaunchStatusResponse } from "@/lib/pov/types/launch"
import { Card } from "@/components/ui/Card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Alert"
import { Skeleton } from "@/components/ui/Skeleton"
import { formatDistanceToNow } from "date-fns"

interface StatusDashboardProps {
  povId: string
}

async function fetchLaunchStatus(povId: string): Promise<LaunchStatusResponse> {
  const response = await fetch(`/api/pov/${povId}/launch/status`)
  if (!response.ok) throw new Error('Failed to fetch launch status')
  return response.json()
}

export function StatusDashboardSkeleton() {
  return (
    <Card className="p-4 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </Card>
  )
}

export default function LaunchStatusDashboard({ povId }: StatusDashboardProps) {
  const { data, isLoading, error } = useQuery<LaunchStatusResponse>({
    queryKey: ["launch-status", povId],
    queryFn: () => fetchLaunchStatus(povId),
  })

  if (isLoading) return <StatusDashboardSkeleton />

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load launch status</AlertDescription>
      </Alert>
    )
  }

  if (!data) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LAUNCHED':
        return 'text-green-600'
      case 'IN_PROGRESS':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'LAUNCHED':
        return 'Launched'
      case 'IN_PROGRESS':
        return 'In Progress'
      default:
        return 'Not Initiated'
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Launch Status</h2>
        <div className={`font-medium ${getStatusColor(data.status)}`}>
          {getStatusLabel(data.status)}
        </div>
      </div>

      {data.status === 'LAUNCHED' && data.launchedAt && (
        <div className="text-sm text-muted-foreground">
          <div>
            Launched {formatDistanceToNow(new Date(data.launchedAt), { addSuffix: true })}
          </div>
          {data.launchedBy && (
            <div className="mt-1">
              By {data.launchedBy}
            </div>
          )}
        </div>
      )}

      {data.status === 'IN_PROGRESS' && data.checklist && (
        <div className="text-sm text-muted-foreground">
          Launch checklist in progress
        </div>
      )}

      {data.status === 'NOT_INITIATED' && (
        <div className="text-sm text-muted-foreground">
          Launch process not yet started
        </div>
      )}
    </Card>
  )
}
