'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Notification, NotificationResponse } from '@/lib/notifications/types';
import { useClientAuth } from '@/lib/auth/get-client-auth';
import { useRouter, usePathname } from 'next/navigation';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
  initialFetchFailed: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

async function fetchNotifications(): Promise<NotificationResponse> {
  const response = await fetch('/api/notifications', {
    method: 'GET',
    credentials: 'include', // Important for cookies
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const getAuth = useClientAuth();
  const [initialFetchFailed, setInitialFetchFailed] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  // Query notifications - will only run when user is authenticated
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: false, // Don't auto-fetch, we'll handle this manually
    staleTime: Infinity, // Keep data fresh indefinitely (static until refresh)
    gcTime: Infinity, // Never delete from cache
    retry: false, // Don't retry on failure
  });

  // Load notifications on:
  // - Initial mount
  // - Route changes
  // - Focus events
  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      try {
        const user = await getAuth();
        if (user && mounted) {
          const result = await refetch();
          setInitialFetchFailed(!result.isSuccess);
        }
      } catch (error) {
        console.error('[NotificationProvider] Error loading notifications:', error);
        if (mounted) {
          setInitialFetchFailed(true);
        }
      }
    }

    loadNotifications();

    // Add focus event listener
    window.addEventListener('focus', loadNotifications);

    return () => {
      mounted = false;
      window.removeEventListener('focus', loadNotifications);
    };
  }, [getAuth, refetch, pathname]); // Include pathname to refresh on route changes

  const markAsRead = async (id: string) => {
    try {
      const user = await getAuth();
      if (!user) {
        console.log('[NotificationProvider] Not logged in, skipping mark as read');
        return;
      }

      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      await refetch();
    } catch (error) {
      console.error('[NotificationProvider] Error marking as read:', error);
      throw error;
    }
  };

  const clearAll = async () => {
    try {
      const user = await getAuth();
      if (!user) {
        console.log('[NotificationProvider] Not logged in, skipping clear all');
        return;
      }

      await fetch('/api/notifications/clear', {
        method: 'POST',
        credentials: 'include',
      });
      await refetch();
    } catch (error) {
      console.error('[NotificationProvider] Error clearing notifications:', error);
      throw error;
    }
  };

  const refresh = async () => {
    try {
      const user = await getAuth();
      if (!user) {
        console.log('[NotificationProvider] Not logged in, skipping refresh');
        return;
      }

      await refetch();
    } catch (error) {
      console.error('[NotificationProvider] Error refreshing notifications:', error);
      throw error;
    }
  };

  // Clear notifications on logout
  useEffect(() => {
    return () => {
      queryClient.setQueryData(['notifications'], { data: [], unreadCount: 0 });
    };
  }, [queryClient]);

  const value = {
    notifications: data?.data || [],
    unreadCount: data?.unreadCount || 0,
    loading: isLoading,
    error: error as Error | null,
    markAsRead,
    clearAll,
    refresh,
    initialFetchFailed,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
