'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import {
  Clock,
  User,
  Users,
  Pencil,
  Trash,
  Plus,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDateFormat } from '@/lib/hooks/useDateFormat';
import { POVStatus, Priority } from '@/lib/types/pov';
import { UserRole } from '@/lib/types/auth';

const getStatusVariant = (status: POVStatus) => {
  switch (status) {
    case POVStatus.PROJECTED:
      return 'secondary' as const;
    case POVStatus.IN_PROGRESS:
      return 'default' as const;
    case POVStatus.STALLED:
      return 'destructive' as const;
    case POVStatus.VALIDATION:
      return 'outline' as const;
    case POVStatus.WON:
      return 'success' as const;
    case POVStatus.LOST:
      return 'destructive' as const;
    default:
      return 'default' as const;
  }
};

const getPriorityVariant = (priority: Priority) => {
  switch (priority) {
    case Priority.LOW:
      return 'secondary' as const;
    case Priority.MEDIUM:
      return 'default' as const;
    case Priority.HIGH:
      return 'destructive' as const;
    case Priority.URGENT:
      return 'destructive' as const;
    default:
      return 'default' as const;
  }
};

export default function PoVDetailPage({ params }: { params: { povId: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { formatDate } = useDateFormat();
  const [pov, setPov] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isOwner = pov?.owner?.id === user?.id;
  const isTeamMember = pov?.team?.members?.some((m: any) => m.user.id === user?.id);
  const canEdit = isAdmin || isOwner || isTeamMember;

  React.useEffect(() => {
    async function fetchPoV() {
      try {
        const response = await fetch(`/api/pov/${params.povId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch PoV');
        }
        const { data } = await response.json();
        setPov(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchPoV();
  }, [params.povId]);

  const handleEdit = () => {
    router.push(`/pov/${params.povId}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this PoV?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pov/${params.povId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete PoV');
      }

      router.push('/pov/list');
    } catch (err) {
      console.error('Failed to delete PoV:', err);
      alert('Failed to delete PoV. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-destructive">
        Error: {error.message}
      </div>
    );
  }

  if (!pov) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">PoV not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="p-6">
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{pov.title}</h1>
            <div className="flex gap-2 mb-4">
              <Badge variant={getStatusVariant(pov.status)}>
                {pov.status}
              </Badge>
              <Badge variant={getPriorityVariant(pov.priority)}>
                {pov.priority}
              </Badge>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEdit}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit PoV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {(isAdmin || isOwner) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete PoV</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>

        <p className="text-muted-foreground mb-6">
          {pov.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {formatDate(pov.startDate)} - {formatDate(pov.endDate)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                Owner: {pov.owner.name}
              </span>
            </div>

            {pov.team && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  Team: {pov.team.name}
                </span>
              </div>
            )}
          </div>

          {(isAdmin || isTeamMember) && pov.team && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Team Members</h2>
              <div className="flex flex-wrap gap-2">
                {pov.team.members.map((member: any) => (
                  <Badge
                    key={member.user.id}
                    variant="outline"
                  >
                    {member.user.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phases Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Phases</h2>
            {canEdit && (
              <Button
                onClick={() => router.push(`/pov/${params.povId}/phase/new`)}
              >
                Add Phase
              </Button>
            )}
          </div>

          {pov.phases?.length > 0 ? (
            <div className="space-y-4">
              {pov.phases.map((phase: any) => (
                <Card key={phase.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{phase.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {phase.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {phase.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/pov/${params.povId}/phase/${phase.id}/tasks`)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Manage Tasks
                        </Button>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/pov/${params.povId}/phase/${phase.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this phase?')) {
                              fetch(`/api/pov/${params.povId}/phase/${phase.id}`, {
                                method: 'DELETE',
                              }).then(() => {
                                router.refresh();
                              });
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No phases yet. {canEdit && 'Click "Add Phase" to create one.'}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
