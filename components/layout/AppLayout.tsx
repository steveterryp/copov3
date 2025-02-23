'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SideNav from './SideNav';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loader2, Home, Users, Settings, FileText, Calendar, BarChart, Shield, Briefcase } from 'lucide-react';
import Breadcrumb, { BreadcrumbItem } from '@/components/ui/Breadcrumb';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoadingUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoadingUser && !user) {
      router.push('/login');
    }
  }, [user, isLoadingUser, router]);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getBreadcrumbItems = (path: string): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { title: 'Home', href: '/', icon: Home }
    ];

    const segments = path.split('/').filter(Boolean);
    let currentPath = '';

    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      
      // Convert segment to title case and handle special cases
      let title = segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
      let icon;

      // Check if segment is a UUID/CUID
      if (/^[a-z0-9-]+$/.test(segment) && segment.length > 8) {
        // For dynamic segments like IDs, try to get a meaningful title
        if (segments[segments.indexOf(segment) - 1] === 'pov') {
          title = 'POV Details';
          icon = FileText;
        } else {
          title = 'Details';
        }
      } else switch (segment) {
        case 'admin':
          icon = Settings;
          break;
        case 'users':
          icon = Users;
          break;
        case 'permissions':
          title = 'Permissions';
          icon = Settings;
          break;
        case 'pov':
          title = 'POV';
          icon = FileText;
          // Special case for POV to always link to list
          items.push({
            title,
            href: '/pov/list',
            icon
          });
          return items;
        case 'phases':
          title = 'Phases';
          icon = Calendar;
          break;
        case 'analytics':
          icon = BarChart;
          break;
        case 'roles':
          title = 'Roles';
          icon = Shield;
          break;
        case 'job-titles':
          title = 'Job Titles';
          icon = Briefcase;
          break;
      }

      items.push({
        title,
        href: currentPath,
        icon
      });
    });

    return items;
  };

  return (
    <div className="flex min-h-screen">
      {user && <SideNav />}
      <div className="flex-grow flex flex-col">
        <div className="border-b bg-background">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold">
              Synthesize huge themes for your PoV process
            </h1>
            <div className="flex-1 mx-4">
              <Breadcrumb 
                items={getBreadcrumbItems(pathname)} 
                className="text-sm"
              />
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <NotificationBell />
                  <UserMenu />
                </>
              )}
            </div>
          </div>
        </div>
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}
