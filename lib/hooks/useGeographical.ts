import { useQuery } from '@tanstack/react-query';
import { Region, Country, SalesTheatre } from '@prisma/client';

const QUERY_KEYS = {
  regions: ['geographical', 'regions'],
  countries: (regionId: string) => ['geographical', 'countries', regionId],
  countriesByTheatre: (theatre: SalesTheatre) => ['geographical', 'countries', 'theatre', theatre],
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

interface CountryWithRegion extends Country {
  region: {
    id: string;
    name: string;
  };
}

export function useCountriesByTheatre(theatre?: SalesTheatre) {
  return useQuery<CountryWithRegion[]>({
    queryKey: QUERY_KEYS.countriesByTheatre(theatre || 'NORTH_AMERICA'),
    queryFn: async () => {
      if (!theatre) return [];
      const response = await fetch(`/api/geographical/theatre/${theatre}/countries`);
      if (!response.ok) {
        throw new Error('Failed to fetch countries by theatre');
      }
      return response.json();
    },
    enabled: !!theatre,
  });
}
