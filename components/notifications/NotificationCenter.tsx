'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { Separator } from '@/components/ui/Separator';
import { Button } from '@/components/ui/Button';
import { X, RotateCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/lib/hooks/useNotifications';

interface NotificationCenterProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  anchorEl,
  onClose,
}) => {
  const { notifications, markAsRead, clearAll, loading, refresh } = useNotifications();
  const open = Boolean(anchorEl);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleRefresh = async () => {
    await refresh();
  };

  return (
    <DropdownMenu open={open} onOpenChange={() => onClose()}>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-[400px] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              className="h-8 w-8"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearAll}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Separator />
        <div className="py-1">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4">
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <DropdownMenuItem
                  onClick={() => handleNotificationClick(notification.id)}
                  className={cn(
                    "px-4 py-3",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </DropdownMenuItem>
                <Separator />
              </React.Fragment>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;
