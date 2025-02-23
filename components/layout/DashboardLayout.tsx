'use client';

import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Menu, Search, Settings } from 'lucide-react';
import SideNav from './SideNav';
import NotificationBell from '../notifications/NotificationBell';
import NotificationCenter from '../notifications/NotificationCenter';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

const DRAWER_WIDTH = 280;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [notificationAnchor, setNotificationAnchor] = React.useState<HTMLElement | null>(null);
  const { notifications, loading, refresh } = useNotifications();
  const router = useRouter();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 right-0 z-50 w-full h-16 border-b bg-background/80 backdrop-blur-sm lg:pl-[280px]">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {!isDesktop && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDrawerToggle}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="flex-grow" />

          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <div>
            <NotificationBell
              count={notifications.filter(n => !n.read).length}
              onClick={(event) => setNotificationAnchor(event.currentTarget)}
              loading={loading}
              onRefresh={refresh}
            />
            <NotificationCenter
              anchorEl={notificationAnchor}
              onClose={() => setNotificationAnchor(null)}
            />
          </div>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-2 h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SideNav onMobileClose={handleDrawerToggle} />
        </SheetContent>
      </Sheet>

      {/* Desktop Drawer */}
      {isDesktop && (
        <div className="fixed left-0 top-0 z-40 h-full w-[280px] border-r bg-background">
          <SideNav />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full min-h-screen pt-16 lg:pl-[280px]">
        <div className="flex-grow p-4 sm:p-6 bg-muted/10">
          {children}
        </div>
      </div>
    </div>
  );
}
