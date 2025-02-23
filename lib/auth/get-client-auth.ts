import { useCookies } from 'next-client-cookies';
import { config } from '@/lib/config';
import { useCallback } from 'react';

export interface ClientAuthUser {
  userId: string;
  email: string;
  role: string;
}

export function useClientAuth() {
  const cookies = useCookies();

  const getAuthState = useCallback(async (): Promise<ClientAuthUser | null> => {
    try {
      console.log('[Client Auth] getAuthState START'); // Added log
      console.log('[Client Auth] Getting auth state');

      // Get token from cookie
      const token = cookies.get(config.cookie.accessToken);
      console.log('[Client Auth] Token found:', !!token);

      if (!token) {
        console.log('[Client Auth] No token found');
        // Try to refresh the token if we have a refresh token
        const refreshToken = cookies.get(config.cookie.refreshToken);
        if (refreshToken) {
          console.log('[Client Auth] Found refresh token, attempting refresh');
          try {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
              },
              credentials: 'include',
            });
            console.log('[Client Auth] Refresh response status:', refreshResponse.status); // Added log

            if (refreshResponse.ok) {
              console.log('[Client Auth] Token refresh successful');
              // The new access token will be set in cookies by the server
              // Retry the auth check
              return await getAuthState();
            } else {
              console.log('[Client Auth] Token refresh failed:', refreshResponse.status); // Added log
            }
          } catch (refreshError) {
            console.error('[Client Auth] Token refresh error:', refreshError); // Added log
          }
        }
        return null;
      }

      // Make request to verify token
      console.log('[Client Auth] Verifying token with /api/auth/me'); // Added log
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        credentials: 'include',
      });
      console.log('[Client Auth] Verification response status:', response.status); // Added log

      if (!response.ok) {
        console.log('[Client Auth] Token verification failed:', response.status);
        // Clear invalid token
        cookies.remove(config.cookie.accessToken);
        return null;
      }

      const data = await response.json();
      console.log('[Client Auth] User data:', data);

      if (!data.user) {
        console.log('[Client Auth] No user data in response');
        return null;
      }

      console.log('[Client Auth] getAuthState END - User authenticated'); // Added log
      return {
        userId: data.user.userId,
        email: data.user.email,
        role: data.user.role,
      };
    } catch (error) {
      console.error('[Client Auth] Generic error:', error); // Added log
      return null;
    } finally {
      console.log('[Client Auth] getAuthState FINALLY'); // Added log
    }
  }, [cookies]);

  return getAuthState;
}
