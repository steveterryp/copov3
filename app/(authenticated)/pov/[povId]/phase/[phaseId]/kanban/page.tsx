"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Breadcrumb from "@/components/ui/Breadcrumb"
import { Spinner } from "@/components/ui/Spinner"
import KanbanBoard from "@/components/phase/KanbanBoard"
import { toast } from "@/lib/hooks/useToast"

interface Stage {
  id: string
  name: string
  description?: string
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "BLOCKED"
  order: number
  tasks: any[]
}

export default function KanbanPage() {
  const params = useParams()
  const povId = params.povId as string
  const phaseId = params.phaseId as string
  
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<any>(null)
  const [stages, setStages] = useState<Stage[]>([])

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
        
        // Fetch stages for the phase
        const stagesResponse = await fetch(`/api/phase/${phaseId}/stage`)
        const stagesData = await stagesResponse.json()
        
        if (stagesData.error) {
          toast({
            title: "Error",
            description: stagesData.error,
            variant: "destructive",
          })
          return
        }
        
        setStages(stagesData.stages || [])
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
    { title: phase.name, href: `/pov/${povId}/phase/${phaseId}` },
    { title: "Kanban Board" },
  ]

  return (
    <div className="p-6">
      <Breadcrumb className="mb-6" items={breadcrumbItems} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold">{phase.name} - Kanban Board</h1>
        {phase.description && (
          <p className="text-muted-foreground mt-2">{phase.description}</p>
        )}
      </div>

      <KanbanBoard phaseId={phaseId} initialStages={stages} />
    </div>
  )
}
