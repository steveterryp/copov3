'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/Separator';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  LayoutDashboard,
  ClipboardList,
  BarChart,
  Headset,
  Plus,
  List,
  HelpCircle,
  Lightbulb,
  FileText,
  Wand2,
  LineChart,
  Rocket
} from 'lucide-react';

interface SideNavProps {
  onMobileClose?: () => void;
}

const navItems = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: '/dashboard'
  },
  {
    title: 'PoV Management',
    icon: <ClipboardList className="h-5 w-5" />,
    path: '/pov',
    children: [
      {
        title: 'Create New PoV',
        path: '/pov/create',
        icon: <Plus className="h-4 w-4" />
      },
      {
        title: 'View All PoVs',
        path: '/pov/list',
        icon: <List className="h-4 w-4" />
      },
      {
        title: 'Launch Management',
        path: '/pov/launch',
        icon: <Rocket className="h-4 w-4" />
      },
      {
        title: 'Kanban Boards',
        path: '/pov/kanban',
        icon: <ClipboardList className="h-4 w-4" />
      }
    ]
  },
  {
    title: 'AI Analytics',
    icon: <BarChart className="h-5 w-5" />,
    path: '/analytics',
    children: [
      {
        title: 'Suggestions',
        path: '/analytics/suggestions',
        icon: <Lightbulb className="h-4 w-4" />
      },
      {
        title: 'Document Processing',
        path: '/analytics/documents',
        icon: <FileText className="h-4 w-4" />
      },
      {
        title: 'Automation Rules',
        path: '/analytics/automation',
        icon: <Wand2 className="h-4 w-4" />
      },
      {
        title: 'Reports & KPIs',
        path: '/analytics/reports',
        icon: <LineChart className="h-4 w-4" />
      }
    ]
  },
  {
    title: 'Tech Support',
    icon: <Headset className="h-5 w-5" />,
    path: '/support',
    children: [
      {
        title: 'Support Request',
        path: '/support/request',
        icon: <HelpCircle className="h-4 w-4" />
      },
      {
        title: 'Feature Request',
        path: '/support/feature',
        icon: <Lightbulb className="h-4 w-4" />
      }
    ]
  }
];

const SideNav: React.FC<SideNavProps> = ({ onMobileClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleNavClick = (path: string, hasChildren: boolean) => {
    if (hasChildren) {
      setExpandedItem(expandedItem === path ? null : path);
    } else {
      router.push(path);
      if (onMobileClose) {
        onMobileClose();
      }
    }
  };

  const handleChildClick = (path: string) => {
    router.push(path);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path || pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="h-full flex flex-col bg-muted/50 border-r">
      <div className="h-16 flex items-center px-6 border-b">
        <h1 className="text-xl font-semibold text-primary">
          PoV Manager
        </h1>
      </div>

      <div className="flex-grow px-2 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <div key={item.path}>
              <button
                onClick={() => handleNavClick(item.path, Boolean(item.children))}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                  "hover:bg-primary/10",
                  isActive(item.path) && "bg-primary/15 text-primary hover:bg-primary/20",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
              >
                <span className="mr-2 text-current opacity-70">
                  {item.icon}
                </span>
                <span className="flex-grow font-medium">
                  {item.title}
                </span>
                {item.children && (
                  <ChevronRight 
                    className={cn(
                      "h-4 w-4 opacity-50 transition-transform",
                      expandedItem === item.path && "transform rotate-90"
                    )}
                  />
                )}
              </button>
              {item.children && (
                <div
                  className={cn(
                    "overflow-hidden transition-all",
                    expandedItem === item.path ? "max-h-96" : "max-h-0"
                  )}
                >
                  <nav className="mt-1 space-y-1">
                    {item.children.map((child) => (
                      <button
                        key={child.path}
                        onClick={() => handleChildClick(child.path)}
                        className={cn(
                          "w-full flex items-center pl-9 pr-3 py-2 text-sm rounded-md transition-colors",
                          "hover:bg-primary/10",
                          isActive(child.path) && "bg-primary/15 text-primary hover:bg-primary/20",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        )}
                      >
                        <span className="mr-2 text-current opacity-70">
                          {child.icon}
                        </span>
                        <span className="font-medium">
                          {child.title}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <Separator />

      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          © 2024 PoV Manager
        </p>
      </div>
    </div>
  );
};

export default SideNav;
