'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import TaskCreate from '@/components/tasks/TaskCreate';
import { useQueryClient } from '@tanstack/react-query';

export default function NewTaskPage({ 
  params 
}: { 
  params: { povId: string; phaseId: string } 
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <div className="p-6">
      <Card className="p-6">
        <TaskCreate
          povId={params.povId}
          phaseId={params.phaseId}
          onSuccess={async () => {
            // Invalidate queries before navigating
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['phase', params.phaseId] }),
              queryClient.invalidateQueries({ queryKey: ['phase', params.phaseId, 'tasks'] }),
              queryClient.invalidateQueries({ queryKey: ['tasks', params.phaseId] })
            ]);
            router.push(`/pov/${params.povId}/phase/${params.phaseId}/tasks`);
          }}
          onCancel={() => router.push(`/pov/${params.povId}/phase/${params.phaseId}/tasks`)}
        />
      </Card>
    </div>
  );
}
