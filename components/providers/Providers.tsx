'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { NotificationProvider } from './NotificationProvider';
import { CookiesProvider } from 'next-client-cookies';

interface ProvidersProps {
  children: ReactNode;
  initialCookies: Array<{
    name: string;
    value: string;
  }>;
}

import { AuthProvider } from './AuthProvider'; // Import AuthProvider

export function Providers({ children, initialCookies }: ProvidersProps) {
  return (
    <CookiesProvider value={initialCookies}>
      <QueryProvider>
        <AuthProvider>
          <NotificationProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryProvider>
    </CookiesProvider>
  );
}
