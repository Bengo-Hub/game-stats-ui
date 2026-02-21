'use client';

import { Button } from '@/components/ui/button';
import { usePermissions } from '@/lib/hooks/usePermission';
import type { Permission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Settings,
  Shield,
  Trophy,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: Permission;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, permission: 'view_dashboard' },
  { label: 'Events', href: '/manage/events', icon: <CalendarDays className="h-5 w-5" />, permission: 'view_events' },
  { label: 'Games', href: '/manage/games', icon: <Trophy className="h-5 w-5" />, permission: 'view_games' },
  { label: 'Teams', href: '/manage/teams', icon: <Users className="h-5 w-5" />, permission: 'view_teams' },
  { label: 'Players', href: '/manage/players', icon: <UserCircle className="h-5 w-5" />, permission: 'view_players' },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-5 w-5" />, permission: 'view_analytics' },
  { label: 'Admin', href: '/admin', icon: <Shield className="h-5 w-5" />, adminOnly: true },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { can, isAdmin } = usePermissions();

  // Filter nav items based on user permissions
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      // Admin-only items require admin role
      if (item.adminOnly) {
        return isAdmin;
      }
      // Items with permission requirements
      if (item.permission) {
        return can(item.permission);
      }
      // Items without permission requirements are always visible (e.g., Settings)
      return true;
    });
  }, [can, isAdmin]);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo area */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            {!isCollapsed && (
              <Link href="/dashboard" className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-sidebar-primary" />
                <span className="font-bold text-lg text-sidebar-foreground">
                  UltimateStats
                </span>
              </Link>
            )}
            {isCollapsed && (
              <Trophy className="h-6 w-6 mx-auto text-sidebar-primary" />
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    isCollapsed && "justify-center"
                  )}
                >
                  {item.icon}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Collapse toggle - desktop only */}
          <div className="hidden md:flex items-center justify-end p-2 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
