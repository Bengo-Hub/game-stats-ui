'use client';

import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
