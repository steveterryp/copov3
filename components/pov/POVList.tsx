'use client';

import React from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/Card';
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
} from 'lucide-react';
import { POVStatus, Priority } from '@/lib/types/pov';
import { UserRole } from '@/lib/types/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useDateFormat } from '@/lib/hooks/useDateFormat';
import { cn } from '@/lib/utils';

import { PoVDetails } from '@/lib/pov/types/core';

interface PoVListProps {
  povs: PoVDetails[];
}

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

const getPriorityVariant = (priority: Priority) => {
  switch (priority) {
    case Priority.LOW:
      return 'secondary';
    case Priority.MEDIUM:
      return 'default';
    case Priority.HIGH:
      return 'destructive';
    case Priority.URGENT:
      return 'destructive';
    default:
      return 'secondary';
  }
};

export function POVList({ povs }: PoVListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const { formatDate, settings } = useDateFormat();

  const handlePoVClick = (povId: string) => {
    router.push(`/pov/${povId}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {povs.map((pov) => (
        <Card
          key={pov.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handlePoVClick(pov.id)}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold truncate">
                {pov.title}
              </h3>
              <div className="flex gap-2 flex-shrink-0">
                <Badge variant={getStatusVariant(pov.status)}>
                  {pov.status}
                </Badge>
                <Badge variant={getPriorityVariant(pov.priority)}>
                  {pov.priority}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {pov.description}
            </p>

            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatDate(pov.startDate, settings.display?.dateFormat)} - {formatDate(pov.endDate, settings.display?.dateFormat)}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {pov.owner && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{pov.owner.name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Owner: {pov.owner.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {pov.team && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{pov.team.name}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Team: {pov.team.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Team members section removed until team type is updated */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
