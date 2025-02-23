import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PoVFormData } from '@/components/pov/creation/PoVCreationForm';

interface UsePoVSubmitResult {
  isSubmitting: boolean;
  error: string | null;
  submitPoV: (data: PoVFormData) => Promise<void>;
}

export function usePoVSubmit(): UsePoVSubmitResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submitPoV = async (data: PoVFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/pov', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // In a real app, you would get this from your auth system
          'user-id': 'current-user-id'
        },
        body: JSON.stringify({
          basicInfo: {
            name: data.name,
            customer: data.customer,
            startDate: data.startDate,
            endDate: data.endDate,
            objective: data.objective,
            solution: data.solution,
            status: data.status
          },
          team: {
            projectManager: data.projectManager,
            salesEngineers: data.salesEngineers,
            technicalTeam: data.technicalTeam
          },
          workflow: {
            stages: data.stages
          },
          metrics: {
            kpis: data.kpis
          },
          resources: {
            budget: data.budget,
            resources: data.resources
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PoV');
      }

      const result = await response.json();
      
      // Navigate to the PoV details page
      router.push(`/pov/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    submitPoV
  };
}
