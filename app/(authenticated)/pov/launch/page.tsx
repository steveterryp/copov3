'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Rocket, CheckCircle2, AlertCircle } from 'lucide-react';
import SelectPovDialog from '@/components/pov/SelectPovDialog';
import { cn } from '@/lib/utils';

interface LaunchItem {
  povId: string;
  povTitle: string;
  status: 'NOT_INITIATED' | 'IN_PROGRESS' | 'LAUNCHED';
  checklist: {
    items: Array<{
      key: string;
      label: string;
      completed: boolean;
    }>;
  } | null;
  launchedAt: string | null;
  launchedBy: string | null;
}

export default function LaunchManagementPage() {
  const router = useRouter();

  // Fetch POVs that are ready for launch or in the launch process
  const { data: launches, isLoading } = useQuery<LaunchItem[]>({
    queryKey: ['launches'],
    queryFn: async () => {
      const response = await fetch('/api/pov/launch');
      if (!response.ok) throw new Error('Failed to fetch launches');
      const data = await response.json();
      return data.data;
    }
  });

  const getStatusColor = (status: LaunchItem['status']) => {
    switch (status) {
      case 'LAUNCHED':
        return 'text-green-500';
      case 'IN_PROGRESS':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: LaunchItem['status']) => {
    switch (status) {
      case 'LAUNCHED':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'IN_PROGRESS':
        return <Rocket className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Launch Management</h1>
        <SelectPovDialog 
          onSelect={async (povId) => {
            try {
              const response = await fetch('/api/pov/launch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ povId })
              });
              if (!response.ok) throw new Error('Failed to initiate launch');
              const data = await response.json();
              router.push(`/pov/launch/${data.data.id}`);
            } catch (error) {
              console.error('Failed to initiate launch:', error);
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {launches?.map((launch) => (
          <Card key={launch.povId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {launch.povTitle}
              </CardTitle>
              <div className={cn("flex items-center", getStatusColor(launch.status))}>
                {getStatusIcon(launch.status)}
              </div>
            </CardHeader>
            <CardContent>
              {launch.checklist && (
                <div className="space-y-2">
                  {launch.checklist.items.map((item) => (
                    <div key={item.key} className="flex items-center">
                      <div className={cn(
                        "h-2 w-2 rounded-full mr-2",
                        item.completed ? "bg-green-500" : "bg-gray-300"
                      )} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {launch.status === 'LAUNCHED' && (
                <div className="mt-4 text-xs text-gray-500">
                  Launched on {new Date(launch.launchedAt!).toLocaleDateString()}
                </div>
              )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/pov/launch/${launch.povId}`)}
                >
                  Manage Launch
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
