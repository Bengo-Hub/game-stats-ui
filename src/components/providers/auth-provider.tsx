'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { hasPermission, isRoleEqualOrHigher, type Role } from '@/lib/permissions';
import { findRouteConfig, isDashboardRoute } from '@/lib/permissions/routes';

// Static public paths (exact matches and prefixes)
const PUBLIC_PATHS = [
  '/',           // Landing page
  '/login',
  '/register',
  '/forgot-password',
  '/discover',   // Public events listing
  '/live',       // Public live scores
  '/leaderboards', // Public leaderboards
  '/directory',  // Public teams directory
  '/offline',    // PWA offline page
];

// Auth-only paths (redirect to dashboard if already authenticated)
const AUTH_ONLY_PATHS = ['/login', '/register', '/forgot-password'];

// Dynamic public route patterns
const PUBLIC_PATH_PATTERNS = [
  /^\/discover\/[^/]+$/, // /discover/[slug]
  /^\/live\/[^/]+$/,     // /live/[id]
  /^\/directory\/[^/]+$/, // /directory/[slug]
];

// Check if a path is public
function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false;

  // Check exact match or prefix match
  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return true;
  }

  // Check dynamic patterns
  return PUBLIC_PATH_PATTERNS.some(pattern => pattern.test(pathname));
}

// Check if path is auth-only (login, register, etc.)
function isAuthOnlyRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return AUTH_ONLY_PATHS.some(path => pathname === path || pathname.startsWith(path));
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, fetchUser, accessToken, user } = useAuthStore();

  const isPublicPath = useMemo(() => isPublicRoute(pathname), [pathname]);
  const isAuthOnlyPath = useMemo(() => isAuthOnlyRoute(pathname), [pathname]);
  const isDashboardPath = useMemo(() => isDashboardRoute(pathname), [pathname]);

  // Check route permission
  const routeAccessResult = useMemo(() => {
    if (!pathname || isPublicPath || !isAuthenticated) {
      return { hasAccess: true, redirectTo: null };
    }

    const routeConfig = findRouteConfig(pathname);
    if (!routeConfig) {
      // No specific config - dashboard routes require authentication only
      if (isDashboardPath) {
        return { hasAccess: true, redirectTo: null };
      }
      return { hasAccess: true, redirectTo: null };
    }

    const userRole = user?.role as Role | undefined;

    // Check minimum role requirement
    if (routeConfig.minRole) {
      if (!isRoleEqualOrHigher(userRole, routeConfig.minRole)) {
        return { hasAccess: false, redirectTo: routeConfig.redirectTo || '/dashboard' };
      }
    }

    // Check specific permission requirement
    if (routeConfig.permission) {
      if (!hasPermission(userRole, routeConfig.permission)) {
        return { hasAccess: false, redirectTo: routeConfig.redirectTo || '/dashboard' };
      }
    }

    return { hasAccess: true, redirectTo: null };
  }, [pathname, isPublicPath, isAuthenticated, isDashboardPath, user?.role]);

  useEffect(() => {
    // If we have a token but no user, fetch the user
    if (accessToken && isAuthenticated) {
      fetchUser().catch(() => {
        // Token might be expired, redirect to login
        router.push('/login');
      });
    }
  }, [accessToken, isAuthenticated, fetchUser, router]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicPath) {
        // Redirect to login if not authenticated and not on public path
        router.push('/login');
      } else if (isAuthenticated && isAuthOnlyPath) {
        // Only redirect from auth pages (login/register) when authenticated
        // Allow authenticated users to view public pages
        router.push('/dashboard');
      } else if (isAuthenticated && !routeAccessResult.hasAccess && routeAccessResult.redirectTo) {
        // Redirect if user lacks permission for the current route
        router.push(routeAccessResult.redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, isPublicPath, isAuthOnlyPath, routeAccessResult, router]);

  // Show loading only for protected routes (not public pages)
  if (isLoading && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show access denied briefly before redirect
  if (isAuthenticated && !routeAccessResult.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
