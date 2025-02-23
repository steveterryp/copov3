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
import { Checkbox } from "@/components/ui/Checkbox"
import { Separator } from "@/components/ui/Separator"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  category: string
}

async function fetchChecklist(povId: string): Promise<ChecklistItem[]> {
  const response = await fetch(`/api/pov/${povId}/launch/checklist`)
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || 'Failed to fetch checklist')
  }
  return response.json()
}

function ChecklistSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <Skeleton className="h-8 w-3/5" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function groupByCategory(items: ChecklistItem[]) {
  return items.reduce((groups, item) => {
    const category = item.category || 'Uncategorized'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as Record<string, ChecklistItem[]>)
}

export default function LaunchChecklistPage() {
  const params = useParams()
  const povId = params.povId as string

  const { data: checklist, isLoading, error } = useQuery<ChecklistItem[], Error>({
    queryKey: ["launch-checklist", povId],
    queryFn: () => fetchChecklist(povId),
  })

  if (isLoading) return <ChecklistSkeleton />

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load checklist</AlertDescription>
      </Alert>
    )
  }

  const groupedItems = groupByCategory(checklist || [])

  return (
    <Container className="py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Launch Checklist</h2>
        <p className="text-muted-foreground">
          Track and manage launch requirements
        </p>
      </div>

      {Object.entries(groupedItems).map(([category, items], index) => (
        <Card key={category} className="mb-4">
          <CardHeader>
            <h3 className="text-lg font-semibold">{category}</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {items.map((item, itemIndex) => (
                <React.Fragment key={item.id}>
                  {itemIndex > 0 && <Separator className="my-2" />}
                  <li className="flex items-start gap-4">
                    <Checkbox
                      checked={item.completed}
                      disabled
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </Container>
  )
}
