"use client";

import React, { useEffect } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useToast } from '@/lib/hooks/useToast';

interface ActivityData {
  action: string;
  user: {
    name: string | null;
    email: string;
  };
  details: Record<string, any>;
  timestamp: Date;
}

export function ActivityNotification() {
  const { connected, subscribe } = useWebSocket();
  const { toast } = useToast();

  const formatActivityMessage = (data: ActivityData) => {
    const { action, user, details } = data;
    const userName = user.name || user.email;

    switch (action) {
      case 'PoV_CREATED':
        return `${userName} created PoV "${details.title}"`;
      case 'PoV_UPDATED':
        return `${userName} updated PoV "${details.title}"`;
      case 'TASK_COMPLETED':
        return `${userName} completed task "${details.title}"`;
      case 'COMMENT_ADDED':
        return `${userName} commented on "${details.taskTitle}"`;
      default:
        return `${userName} performed ${action}`;
    }
  };

  useEffect(() => {
    // Subscribe to activity updates
    const unsubscribe = subscribe('activity', (data: ActivityData) => {
      toast({
        description: formatActivityMessage(data),
      });
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe, toast]);

  if (!connected) {
    return null;
  }

  return null;
}
