'use client';

import { PoVDetails, PoVFilters } from '@/lib/pov/types/core';
import { SalesTheatre } from '@prisma/client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { POVList } from '@/components/pov/POVList';
import { GeographicalFilter } from '@/components/pov/GeographicalFilter';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserRole } from '@/lib/types/auth';

export default function POVListPage() {
  const [povs, setPovs] = React.useState<PoVDetails[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [filters, setFilters] = React.useState<PoVFilters>({});
  const { user, hasRole } = useAuth();
  const isAdmin = user && hasRole(UserRole.ADMIN);

  // Initial fetch of POVs
  React.useEffect(() => {
    async function fetchPOVs() {
      try {
        setLoading(true);
        const response = await fetch('/api/pov');
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

    fetchPOVs();
  }, []);
  
  const handleFilterChange = (geoFilters: {
    salesTheatre?: SalesTheatre;
    regionId?: string;
    countryId?: string;
  }) => {
    // For now, just log the filters
    console.log('Filters changed:', geoFilters);
    
    // In a real implementation, we would update the filters state and fetch filtered POVs
    // setFilters(prevFilters => ({
    //   ...prevFilters,
    //   ...geoFilters
    // }));
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <GeographicalFilter onFilterChange={handleFilterChange} />
        </div>
        <div className="lg:col-span-3">
          <POVList povs={povs} />
        </div>
      </div>
    </div>
  );
}
