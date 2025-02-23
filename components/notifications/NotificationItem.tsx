'use client';

import React from 'react';
import { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Notification } from './types';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  showDivider?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  showDivider = true
}) => {
  const getNotificationIcon = () => {
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  const getNotificationColor = () => {
    return 'border-blue-500';
  };

  const formattedTime = new Date(notification.timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <DropdownMenuItem
      onClick={() => onClick(notification)}
      className={cn(
        "px-4 py-3 cursor-pointer border-l-2 transition-colors",
        getNotificationColor(),
        !notification.read && "bg-muted/50",
        "hover:bg-accent focus:bg-accent"
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon()}
        </div>
        <div className="flex-grow space-y-1">
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-sm",
              !notification.read && "font-medium"
            )}>
              {notification.title}
            </p>
          </div>
          <p className={cn(
            "text-sm text-muted-foreground",
            !notification.read && "text-foreground"
          )}>
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formattedTime}
          </p>
        </div>
      </div>
    </DropdownMenuItem>
  );
};

export default NotificationItem;
