"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/Card"
import { Container } from "@/components/ui/Container"
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/Alert"
import { Skeleton } from "@/components/ui/Skeleton"
import { Progress } from "@/components/ui/Progress"
import { Badge } from "@/components/ui/Badge"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

interface LaunchStatus {
  id: string
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED"
  progress: number
  currentPhase: string
  nextMilestone: string
  blockers: string[]
  lastUpdated: string
}

async function fetchLaunchStatus(povId: string): Promise<LaunchStatus> {
  const response = await fetch(`/api/pov/${povId}/launch/status`)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to fetch launch status')
  }
  return response.json()
}

function StatusSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-3/5" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const statusVariants = {
  NOT_STARTED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  BLOCKED: "destructive",
} as const

export default function LaunchStatusPage() {
  const params = useParams()
  const povId = params.povId as string

  const { data: status, isLoading, error } = useQuery<LaunchStatus, Error>({
    queryKey: ["launch-status", povId],
    queryFn: () => fetchLaunchStatus(povId),
  })

  if (isLoading) return <StatusSkeleton />

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load launch status</AlertDescription>
      </Alert>
    )
  }

  if (!status) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No launch status data available</AlertDescription>
      </Alert>
    )
  }

  return (
    <Container className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Launch Status</h2>
        <p className="text-muted-foreground">
          Track launch progress and status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Current Status</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant={statusVariants[status.status || 'NOT_STARTED']}>
                {(status.status || 'NOT_STARTED').replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Last updated: {status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : 'Not available'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Progress</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Progress value={status.progress || 0} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {status.progress || 0}% Complete
              </p>
            </div>
            <p className="text-sm">
              Current Phase: {status.currentPhase || 'Not started'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Next Steps</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{status.nextMilestone || 'No upcoming milestones'}</p>
            {status.blockers && status.blockers.length > 0 && (
              <div>
                <p className="font-medium text-destructive mb-2">
                  Blockers:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  {status.blockers.map((blocker, index) => (
                    <li key={index} className="text-sm text-destructive">
                      {blocker}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}
