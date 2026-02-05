/**
 * Route Permission Configuration
 * Maps protected routes to required permissions
 */

import type { Permission, Role } from './index';

export interface RouteConfig {
  /** Exact path match */
  path?: string;
  /** Pattern for dynamic routes (use :param for path params) */
  pattern?: RegExp;
  /** Required permission to access this route */
  permission?: Permission;
  /** Required minimum role to access this route */
  minRole?: Role;
  /** Redirect URL if access denied */
  redirectTo?: string;
  /** Allow any authenticated user (no specific permission required) */
  authOnly?: boolean;
}

/**
 * Protected route configurations
 * Routes not listed here but under /dashboard require authentication only
 */
export const PROTECTED_ROUTES: RouteConfig[] = [
  // Dashboard - requires dashboard view permission
  {
    path: '/dashboard',
    permission: 'view_dashboard',
    redirectTo: '/login',
  },

  // Events management
  {
    path: '/events',
    permission: 'view_events',
    redirectTo: '/dashboard',
  },
  {
    pattern: /^\/events\/new$/,
    permission: 'add_events',
    redirectTo: '/events',
  },
  {
    pattern: /^\/events\/[^/]+\/edit$/,
    permission: 'change_events',
    redirectTo: '/events',
  },

  // Games management
  {
    path: '/games',
    permission: 'view_games',
    redirectTo: '/dashboard',
  },
  {
    pattern: /^\/games\/new$/,
    permission: 'add_games',
    redirectTo: '/games',
  },
  {
    pattern: /^\/games\/[^/]+$/,
    permission: 'view_games',
    redirectTo: '/games',
  },
  {
    pattern: /^\/games\/[^/]+\/edit$/,
    permission: 'change_games',
    redirectTo: '/games',
  },
  {
    pattern: /^\/games\/[^/]+\/score$/,
    permission: 'record_scores',
    redirectTo: '/games',
  },

  // Teams management
  {
    path: '/teams',
    permission: 'view_teams',
    redirectTo: '/dashboard',
  },
  {
    pattern: /^\/teams\/new$/,
    permission: 'add_teams',
    redirectTo: '/teams',
  },
  {
    pattern: /^\/teams\/[^/]+\/edit$/,
    permission: 'change_teams',
    redirectTo: '/teams',
  },

  // Players management
  {
    path: '/players',
    permission: 'view_players',
    redirectTo: '/dashboard',
  },
  {
    pattern: /^\/players\/new$/,
    permission: 'add_players',
    redirectTo: '/players',
  },
  {
    pattern: /^\/players\/[^/]+\/edit$/,
    permission: 'change_players',
    redirectTo: '/players',
  },

  // Analytics
  {
    path: '/analytics',
    permission: 'view_analytics',
    redirectTo: '/dashboard',
  },

  // Admin section - requires admin role
  {
    path: '/admin',
    minRole: 'admin',
    redirectTo: '/dashboard',
  },
  {
    pattern: /^\/admin\/.*/,
    minRole: 'admin',
    redirectTo: '/dashboard',
  },

  // Settings - any authenticated user
  {
    path: '/settings',
    permission: 'view_settings',
    redirectTo: '/dashboard',
  },
];

/**
 * Find the route configuration for a given path
 */
export function findRouteConfig(pathname: string): RouteConfig | undefined {
  // First check exact path matches
  const exactMatch = PROTECTED_ROUTES.find((route) => route.path === pathname);
  if (exactMatch) return exactMatch;

  // Then check pattern matches
  return PROTECTED_ROUTES.find((route) => route.pattern?.test(pathname));
}

/**
 * Check if a path is a protected dashboard route
 */
export function isDashboardRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/events' ||
    pathname.startsWith('/events/') ||
    pathname === '/games' ||
    pathname.startsWith('/games/') ||
    pathname === '/teams' ||
    pathname.startsWith('/teams/') ||
    pathname === '/players' ||
    pathname.startsWith('/players/') ||
    pathname === '/analytics' ||
    pathname.startsWith('/analytics/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/')
  );
}
