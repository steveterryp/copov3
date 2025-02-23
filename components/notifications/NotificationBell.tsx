'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { Bell, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  count: number;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  count,
  onClick,
  loading = false,
  onRefresh
}) => {
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick(event);
    if (onRefresh) {
      await onRefresh();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClick}
              disabled={loading}
              className="relative h-9 w-9"
            >
              <Bell className="h-5 w-5" />
              {!loading && count > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {count}
                </Badge>
              )}
            </Button>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-9 w-9 animate-spin text-primary" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {loading ? 'Loading notifications...' : `${count} unread notifications`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NotificationBell;
