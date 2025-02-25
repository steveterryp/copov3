'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Loader2, KanbanIcon } from 'lucide-react';
import { useDateFormat } from '@/lib/hooks/useDateFormat';
import { Badge } from '@/components/ui/Badge';
import { POVStatus, Priority } from '@/lib/types/pov';

const getStatusVariant = (status: POVStatus) => {
  switch (status) {
    case POVStatus.PROJECTED:
      return 'secondary';
    case POVStatus.IN_PROGRESS:
      return 'default';
    case POVStatus.STALLED:
      return 'destructive';
    case POVStatus.VALIDATION:
      return 'outline';
    case POVStatus.WON:
      return 'success';
    case POVStatus.LOST:
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function KanbanBoardsPage() {
  const router = useRouter();
  const { formatDate } = useDateFormat();
  const [povs, setPovs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPovs() {
      try {
        const response = await fetch('/api/pov');
        if (!response.ok) {
          throw new Error('Failed to fetch POVs');
        }
        const data = await response.json();
        setPovs(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchPovs();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-destructive">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Kanban Boards</h1>
        <p className="text-muted-foreground mt-2">
          View and manage tasks using Kanban boards for all your PoVs
        </p>
      </div>
      
      <div className="space-y-6">
        {povs.length > 0 ? (
          povs.map((pov) => (
            <Card key={pov.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{pov.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={getStatusVariant(pov.status)}>
                        {pov.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(pov.startDate)} - {formatDate(pov.endDate)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/pov/${pov.id}`)}
                  >
                    View PoV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {pov.phases && pov.phases.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Phases</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pov.phases.map((phase: any) => (
                        <Card key={phase.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col h-full">
                            <div className="mb-2">
                              <h4 className="text-base font-medium">{phase.name}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {phase.description}
                              </p>
                            </div>
                            <div className="mt-auto pt-4">
                              <Button 
                                className="w-full"
                                onClick={() => router.push(`/pov/${pov.id}/phase/${phase.id}/kanban`)}
                              >
                                <KanbanIcon className="mr-2 h-4 w-4" />
                                Open Kanban Board
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No phases found for this PoV</p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => router.push(`/pov/${pov.id}/phase/new`)}
                    >
                      Create Phase
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">No PoVs Found</h2>
            <p className="text-muted-foreground mb-4">
              Create a PoV to get started with Kanban boards
            </p>
            <Button onClick={() => router.push('/pov/create')}>
              Create New PoV
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
