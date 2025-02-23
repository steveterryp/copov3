'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { useClientAuth } from '@/lib/auth/get-client-auth';

export default function TestAuthPage() {
  const [authState, setAuthState] = React.useState<{
    isLoading: boolean;
    error: string | null;
    user: any | null;
    cookies: string[];
  }>({
    isLoading: true,
    error: null,
    user: null,
    cookies: [],
  });

  const getAuth = useClientAuth();

  React.useEffect(() => {
    async function checkAuth() {
      try {
        // Get all cookies
        const cookies = document.cookie.split(';').map(c => c.trim());
        console.log('[Test Auth] Current cookies:', cookies);

        // Check auth state
        const user = await getAuth();
        console.log('[Test Auth] Auth state:', { user });

        setAuthState({
          isLoading: false,
          error: null,
          user,
          cookies,
        });
      } catch (error) {
        console.error('[Test Auth] Error:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }

    checkAuth();
  }, [getAuth]);

  if (authState.isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Auth State</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify({ user: authState.user }, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Cookies</h2>
        <ul className="list-disc pl-5">
          {authState.cookies.map((cookie, index) => (
            <li key={index} className="mb-1">
              {cookie}
            </li>
          ))}
        </ul>
      </div>

      {authState.error && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-red-600">{authState.error}</p>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Debug Actions</h2>
        <Button
          onClick={async () => {
            try {
              const response = await fetch('/api/auth/me', {
                credentials: 'include',
              });
              const data = await response.json();
              console.log('[Test Auth] /me response:', data);
            } catch (error) {
              console.error('[Test Auth] /me error:', error);
            }
          }}
        >
          Test /me Endpoint
        </Button>
      </div>
    </div>
  );
}
