"use client"

import { useState, useEffect, useCallback } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { PlusIcon, XIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { toast } from "@/lib/hooks/useToast"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  assignee?: {
    id: string
    name: string
    email: string
  }
  dueDate?: string
  order: number
}

interface Stage {
  id: string
  name: string
  description?: string
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "BLOCKED"
  order: number
  tasks: Task[]
}

interface KanbanBoardProps {
  phaseId: string
  initialStages?: Stage[]
}

export default function KanbanBoard({ phaseId, initialStages = [] }: KanbanBoardProps) {
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [loading, setLoading] = useState(true)
  const [newStageOpen, setNewStageOpen] = useState(false)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const [newStage, setNewStage] = useState({ name: "", description: "" })
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  })

  const fetchStages = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/phase/${phaseId}/stage`)
      const data = await response.json()
      
      if (data.stages) {
        setStages(data.stages)
      }
    } catch (error) {
      console.error("Error fetching stages:", error)
      toast({
        title: "Error",
        description: "Failed to load stages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [phaseId])

  useEffect(() => {
    if (initialStages.length > 0) {
      setStages(initialStages)
      setLoading(false)
    } else {
      fetchStages()
    }
  }, [phaseId, initialStages, fetchStages])

  const handleDragEnd = async (result: any) => {
    const { source, destination, type, draggableId } = result

    // Dropped outside the list
    if (!destination) return

    // Reordering stages
    if (type === "STAGE") {
      if (source.index === destination.index) return

      const newStages = Array.from(stages)
      const [removed] = newStages.splice(source.index, 1)
      newStages.splice(destination.index, 0, removed)

      setStages(newStages)

      try {
        const stageIds = newStages.map(stage => stage.id)
        await fetch(`/api/phase/${phaseId}/stage/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageIds }),
        })
      } catch (error) {
        console.error("Error reordering stages:", error)
        toast({
          title: "Error",
          description: "Failed to reorder stages",
          variant: "destructive",
        })
        fetchStages() // Revert to server state
      }
      return
    }

    // Moving task between stages or reordering within a stage
    const sourceStageId = source.droppableId
    const destStageId = destination.droppableId
    const taskId = draggableId

    // Create a new array of stages
    const newStages = Array.from(stages)
    
    // Find source and destination stage indices
    const sourceStageIndex = newStages.findIndex(s => s.id === sourceStageId)
    const destStageIndex = newStages.findIndex(s => s.id === destStageId)
    
    if (sourceStageIndex === -1 || destStageIndex === -1) return

    // If moving within the same stage
    if (sourceStageId === destStageId) {
      const stageTasks = Array.from(newStages[sourceStageIndex].tasks)
      const [removed] = stageTasks.splice(source.index, 1)
      stageTasks.splice(destination.index, 0, removed)
      
      // Update the order property of each task
      stageTasks.forEach((task, index) => {
        task.order = index
      })
      
      newStages[sourceStageIndex].tasks = stageTasks
      setStages(newStages)
    } else {
      // Moving between stages
      const sourceStage = newStages[sourceStageIndex]
      const destStage = newStages[destStageIndex]
      
      // Remove from source stage
      const task = sourceStage.tasks.find(t => t.id === taskId)
      if (!task) return
      
      const sourceTasks = sourceStage.tasks.filter(t => t.id !== taskId)
      
      // Add to destination stage
      const destTasks = Array.from(destStage.tasks)
      destTasks.splice(destination.index, 0, task)
      
      // Update order properties
      sourceTasks.forEach((t, i) => { t.order = i })
      destTasks.forEach((t, i) => { t.order = i })
      
      newStages[sourceStageIndex].tasks = sourceTasks
      newStages[destStageIndex].tasks = destTasks
      
      setStages(newStages)
    }

    // Update the server
    try {
      await fetch(`/api/phase/${phaseId}/task/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          newStageId: destStageId,
          newOrder: destination.index,
        }),
      })
    } catch (error) {
      console.error("Error moving task:", error)
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive",
      })
      fetchStages() // Revert to server state
    }
  }

  const handleCreateStage = async () => {
    if (!newStage.name.trim()) {
      toast({
        title: "Error",
        description: "Stage name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/phase/${phaseId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStage),
      })

      const data = await response.json()
      
      if (data.stage) {
        setStages([...stages, { ...data.stage, tasks: [] }])
        setNewStage({ name: "", description: "" })
        setNewStageOpen(false)
      }
    } catch (error) {
      console.error("Error creating stage:", error)
      toast({
        title: "Error",
        description: "Failed to create stage",
        variant: "destructive",
      })
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !activeStage) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/phase/${phaseId}/stage/${activeStage}/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      })

      const data = await response.json()
      
      if (data.task) {
        const newStages = stages.map(stage => {
          if (stage.id === activeStage) {
            return {
              ...stage,
              tasks: [...stage.tasks, data.task],
            }
          }
          return stage
        })
        
        setStages(newStages)
        setNewTask({ title: "", description: "", priority: "MEDIUM" })
        setNewTaskOpen(false)
        setActiveStage(null)
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Kanban Board</h2>
        <Dialog open={newStageOpen} onOpenChange={setNewStageOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Stage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Stage</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newStage.name}
                  onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                  placeholder="Stage name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newStage.description}
                  onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                  placeholder="Stage description"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateStage}>Create Stage</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-stages" direction="horizontal" type="STAGE">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex space-x-4 overflow-x-auto pb-4"
            >
              {stages.map((stage, index) => (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="w-80 flex-shrink-0"
                    >
                      <Card>
                        <CardHeader
                          {...provided.dragHandleProps}
                          className="cursor-grab bg-muted/50"
                        >
                          <CardTitle className="flex justify-between items-center">
                            <span>{stage.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {stage.tasks.length}
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                          <Droppable droppableId={stage.id} type="TASK">
                            {(provided) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="min-h-[200px]"
                              >
                                {stage.tasks.map((task, index) => (
                                  <Draggable
                                    key={task.id}
                                    draggableId={task.id}
                                    index={index}
                                  >
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="mb-2"
                                      >
                                        <Card className="p-3 cursor-grab hover:bg-muted/50">
                                          <div className="font-medium">{task.title}</div>
                                          {task.description && (
                                            <div className="text-sm text-muted-foreground mt-1">
                                              {task.description}
                                            </div>
                                          )}
                                          <div className="flex justify-between items-center mt-2">
                                            <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                              {task.priority}
                                            </div>
                                            {task.assignee && (
                                              <div className="text-xs">
                                                {task.assignee.name}
                                              </div>
                                            )}
                                          </div>
                                        </Card>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                          <Button
                            variant="ghost"
                            className="w-full mt-2"
                            onClick={() => {
                              setActiveStage(stage.id)
                              setNewTaskOpen(true)
                            }}
                          >
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add Task
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreateTask}>Create Task</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
