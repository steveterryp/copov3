'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserRole } from '@/lib/types/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

export default function UserMenu() {
  console.log('UserMenu component rendered');
  const { user, hasRole } = useAuth();
  const isAdmin = user && hasRole(UserRole.ADMIN);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) return null;

  // Get initials from name, handle undefined user.name
  const initials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : ''; // Default to empty string if user.name is undefined

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className={cn(
                  "h-8 w-8",
                  isAdmin ? "bg-destructive" : "bg-primary"
                )}>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            Account settings
          </TooltipContent>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium leading-none">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {user.email}
              </p>
              {isAdmin && (
                <p className="text-xs text-destructive mt-1">
                  Administrator
                </p>
              )}
            </div>
            <Separator className="my-1" />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              Profile Settings
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push('/admin')}>
                Admin Dashboard
              </DropdownMenuItem>
            )}
            <Separator className="my-1" />
            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
