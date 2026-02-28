'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <Header
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setIsMobileOpen(!isMobileOpen)}
      />
      <main
        className={cn(
          "min-h-[calc(100vh-4rem)] p-4 md:p-6 transition-[margin] duration-300",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        {children}
      </main>
    </div>
  );
}
