import { useQuery } from '@tanstack/react-query';
import { geographicalService } from '@/lib/services/geographicalService';

export function useGeographicalDistribution() {
  return useQuery({
    queryKey: ['geographical', 'distribution'],
    queryFn: async () => {
      return geographicalService.getGeographicalDistribution();
    },
  });
}
