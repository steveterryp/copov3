'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Rocket, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LaunchDetails {
  id: string;
  povId: string;
  povTitle: string;
  status: 'NOT_INITIATED' | 'IN_PROGRESS' | 'LAUNCHED';
  checklist: {
    items: Array<{
      key: string;
      label: string;
      completed: boolean;
    }>;
  };
  launchedAt: string | null;
  launchedBy: string | null;
  validation?: {
    valid: boolean;
    errors: string[];
  };
}

export default function LaunchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const launchId = params.id as string;

  // Fetch launch details
  const { data: launch, isLoading } = useQuery<LaunchDetails>({
    queryKey: ['launch', launchId],
    queryFn: async () => {
      const response = await fetch(`/api/pov/launch/${launchId}`);
      if (!response.ok) throw new Error('Failed to fetch launch details');
      const data = await response.json();
      return data.data;
    }
  });

  // Update checklist mutation
  const updateChecklistMutation = useMutation({
    mutationFn: async (updates: { key: string; completed: boolean }[]) => {
      const response = await fetch(`/api/pov/launch?launchId=${launchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update checklist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['launch', launchId] });
    }
  });

  // Validate launch mutation
  const validateLaunchMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/pov/launch?type=validate&launchId=${launchId}`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to validate launch');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['launch', launchId] });
    }
  });

  // Confirm launch mutation
  const confirmLaunchMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/pov/launch?type=confirm&launchId=${launchId}`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to confirm launch');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['launch', launchId] });
    }
  });

  const handleChecklistItemToggle = async (key: string, completed: boolean) => {
    await updateChecklistMutation.mutateAsync([{ key, completed }]);
  };

  const handleValidate = async () => {
    await validateLaunchMutation.mutateAsync();
  };

  const handleConfirm = async () => {
    await confirmLaunchMutation.mutateAsync();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!launch) {
    return <div>Launch not found</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/pov/launch')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Launches
        </Button>
        <h1 className="text-2xl font-bold">Launch: {launch.povTitle}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Launch Checklist</span>
              <div className={cn(
                "flex items-center px-2 py-1 rounded-full text-sm",
                launch.status === 'LAUNCHED' ? "bg-green-100 text-green-700" :
                launch.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                "bg-gray-100 text-gray-700"
              )}>
                {launch.status}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {launch.checklist.items.map((item) => (
                <div key={item.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.key}
                    checked={item.completed}
                    onCheckedChange={(checked) => 
                      handleChecklistItemToggle(item.key, checked as boolean)
                    }
                    disabled={launch.status === 'LAUNCHED'}
                  />
                  <label
                    htmlFor={item.key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <Button
                onClick={handleValidate}
                className="w-full"
                disabled={launch.status === 'LAUNCHED'}
              >
                Validate Launch
              </Button>

              <Button
                onClick={handleConfirm}
                className="w-full"
                variant="default"
                disabled={
                  launch.status === 'LAUNCHED' ||
                  !launch.validation?.valid
                }
              >
                <Rocket className="h-4 w-4 mr-2" />
                Confirm Launch
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {launch.validation && (
            <Alert variant={launch.validation.valid ? "default" : "destructive"}>
              <div className="flex items-center">
                {launch.validation.valid ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                <AlertTitle>
                  {launch.validation.valid
                    ? "Ready for Launch"
                    : "Launch Validation Failed"
                  }
                </AlertTitle>
              </div>
              {!launch.validation.valid && (
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2">
                    {launch.validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              )}
            </Alert>
          )}

          {launch.status === 'LAUNCHED' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Launch Confirmed</AlertTitle>
              <AlertDescription>
                Launched on {new Date(launch.launchedAt!).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
