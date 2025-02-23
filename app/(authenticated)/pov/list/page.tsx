'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { POVList } from '@/components/pov/POVList';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserRole } from '@/lib/types/auth';
import { SalesTheatre } from '@prisma/client';
import { GeographicalSelect } from '@/components/ui/GeographicalSelect';
import { Card, CardContent } from '@/components/ui/Card';

export default function POVListPage() {
  const [povs, setPovs] = React.useState([]);
  interface GeoFilters {
    salesTheatre?: SalesTheatre;
    regionId?: string;
    countryId?: string;
  }

  const [filters, setFilters] = React.useState<GeoFilters>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const { user, hasRole } = useAuth();
  const isAdmin = user && hasRole(UserRole.ADMIN);

  React.useEffect(() => {
    async function fetchPOVs(filters: GeoFilters) {
      try {
        const params = new URLSearchParams();
        if (filters.salesTheatre) params.append('salesTheatre', filters.salesTheatre);
        if (filters.regionId) params.append('regionId', filters.regionId);
        if (filters.countryId) params.append('countryId', filters.countryId);

        const response = await fetch(`/api/pov?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch POVs');
        }
        const result = await response.json();
        setPovs(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchPOVs(filters);
  }, [filters]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {isAdmin ? 'All POVs' : 'My POVs'}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'View and manage all POVs across teams'
            : 'View and manage your POVs and team collaborations'}
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <GeographicalSelect
            selectedTheatre={filters.salesTheatre}
            selectedRegion={filters.regionId}
            selectedCountry={filters.countryId}
            onChange={({ theatre, regionId, countryId }) => {
              setFilters({
                salesTheatre: theatre,
                regionId,
                countryId,
              });
            }}
          />
        </CardContent>
      </Card>

      <POVList povs={povs} />
    </div>
  );
}
