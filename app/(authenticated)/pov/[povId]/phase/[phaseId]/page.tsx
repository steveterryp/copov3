"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Breadcrumb from "@/components/ui/Breadcrumb"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Spinner } from "@/components/ui/Spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { toast } from "@/lib/hooks/useToast"
import { KanbanIcon, ListIcon, PencilIcon } from "lucide-react"

export default function PhaseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const povId = params.povId as string
  const phaseId = params.phaseId as string
  
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<any>(null)

  useEffect(() => {
    const fetchPhaseData = async () => {
      try {
        setLoading(true)
        
        // Fetch phase details
        const phaseResponse = await fetch(`/api/pov/${povId}/phase/${phaseId}`)
        const phaseData = await phaseResponse.json()
        
        if (phaseData.error) {
          toast({
            title: "Error",
            description: phaseData.error,
            variant: "destructive",
          })
          return
        }
        
        setPhase(phaseData.phase)
      } catch (error) {
        console.error("Error fetching phase data:", error)
        toast({
          title: "Error",
          description: "Failed to load phase data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (povId && phaseId) {
      fetchPhaseData()
    }
  }, [povId, phaseId])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!phase) {
    return (
      <div className="p-6">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">Phase Not Found</h2>
          <p className="text-muted-foreground">
            The requested phase could not be found or you don&apos;t have access to it.
          </p>
        </div>
      </div>
    )
  }

  const breadcrumbItems = [
    { title: "PoVs", href: "/pov/list" },
    { title: "PoV Details", href: `/pov/${povId}` },
    { title: "Phases", href: `/pov/${povId}/phase` },
    { title: phase.name },
  ]

  return (
    <div className="p-6">
      <Breadcrumb className="mb-6" items={breadcrumbItems} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{phase.name}</h1>
          {phase.description && (
            <p className="text-muted-foreground mt-2">{phase.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/pov/${povId}/phase/${phaseId}/edit`)}
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Phase Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
              <p>{new Date(phase.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
              <p>{new Date(phase.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <p>{phase.status}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
              <p>{phase.type}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Task Management</h2>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/pov/${povId}/phase/${phaseId}/tasks`)}
          >
            <ListIcon className="h-4 w-4 mr-2" />
            Task List
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/pov/${povId}/phase/${phaseId}/kanban`)}
          >
            <KanbanIcon className="h-4 w-4 mr-2" />
            Kanban Board
          </Button>
        </div>
      </div>
    </div>
  )
}
