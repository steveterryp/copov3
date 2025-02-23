import { useQuery } from '@tanstack/react-query';
import { Region, Country } from '@prisma/client';

const QUERY_KEYS = {
  regions: ['geographical', 'regions'],
  countries: (regionId: string) => ['geographical', 'countries', regionId],
};

export function useRegions() {
  return useQuery<Region[]>({
    queryKey: QUERY_KEYS.regions,
    queryFn: async () => {
      const response = await fetch('/api/geographical');
      if (!response.ok) {
        throw new Error('Failed to fetch regions');
      }
      return response.json();
    },
  });
}

export function useCountriesByRegion(regionId?: string) {
  return useQuery<Country[]>({
    queryKey: QUERY_KEYS.countries(regionId || ''),
    queryFn: async () => {
      if (!regionId) return [];
      const response = await fetch(`/api/geographical/${regionId}/countries`);
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      return response.json();
    },
    enabled: !!regionId,
  });
}
