'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import PoVList from '@/components/pov/PoVList';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserRole } from '@/lib/types/auth';

export default function PoVListPage() {
  const [povs, setPovs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const { user, hasRole } = useAuth();
  const isAdmin = user && hasRole(UserRole.ADMIN);

  React.useEffect(() => {
    async function fetchPoVs() {
      try {
        const response = await fetch('/api/pov');
        if (!response.ok) {
          throw new Error('Failed to fetch PoVs');
        }
        const result = await response.json();
        setPovs(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }

    fetchPoVs();
  }, []);

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
          {isAdmin ? 'All PoVs' : 'My PoVs'}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'View and manage all PoVs across teams'
            : 'View and manage your PoVs and team collaborations'}
        </p>
      </div>

      <PoVList povs={povs} />
    </div>
  );
}
