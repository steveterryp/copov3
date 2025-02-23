import { cookies } from 'next/headers';
import { Providers as RootProviders } from '@/components/providers/Providers';

export function Providers({ children }: { children: React.ReactNode }) {
  // Get initial cookies from server
  const initialCookies = cookies().getAll().map(cookie => ({
    name: cookie.name,
    value: cookie.value
  }));

  return (
    <RootProviders initialCookies={initialCookies}>
      {children}
    </RootProviders>
  );
}
