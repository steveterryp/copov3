'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/hooks/useAuth';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function StatCard({ title, value, description, variant = 'default' }: StatCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant={variant} className="text-2xl px-3 py-1">
          {value}
        </Badge>
      </CardContent>
      {description && (
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}

export default function DashboardWidgets() {
  const { user } = useAuth();

  // Placeholder data - in a real app, this would come from an API
  const stats = {
    activePilots: 12,
    stalledPilots: 3,
    supportCases: 8,
    upcomingExpiry: 2,
  };

  return (
    <div className="flex-grow mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <StatCard
            title="Active Pilots"
            value={stats.activePilots}
            description="Currently running pilots"
            variant="default"
          />
        </div>
        <div>
          <StatCard
            title="Stalled Pilots"
            value={stats.stalledPilots}
            description="Pilots requiring attention"
            variant="destructive"
          />
        </div>
        <div>
          <StatCard
            title="Support Cases"
            value={stats.supportCases}
            description="Open support tickets"
            variant="secondary"
          />
        </div>
        <div>
          <StatCard
            title="License Expiry"
            value={stats.upcomingExpiry}
            description="Licenses expiring soon"
            variant="outline"
          />
        </div>
      </div>
    </div>
  );
}
