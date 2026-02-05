'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/lib/hooks/usePermission';
import type { Permission, Role } from '@/lib/permissions';

interface PermissionGuardProps {
  /** Single permission required */
  permission?: Permission;
  /** Multiple permissions - check based on requireAll */
  permissions?: Permission[];
  /** If true, requires ALL permissions; if false, requires ANY permission */
  requireAll?: boolean;
  /** Minimum role required */
  minRole?: Role;
  /** Content to show if access denied */
  fallback?: React.ReactNode;
  /** Redirect URL if access denied (overrides fallback) */
  redirectTo?: string;
  /** Children to render if access granted */
  children: React.ReactNode;
}

/**
 * Guard component that conditionally renders children based on user permissions
 */
export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  minRole,
  fallback = null,
  redirectTo,
  children,
}: PermissionGuardProps) {
  const router = useRouter();
  const { can, canAny, canAll, isAtLeast, isAuthenticated } = usePermissions();

  const hasAccess = React.useMemo(() => {
    // Must be authenticated
    if (!isAuthenticated) return false;

    // Check minimum role if specified
    if (minRole && !isAtLeast(minRole)) return false;

    // Check single permission
    if (permission && !can(permission)) return false;

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
      if (requireAll) {
        if (!canAll(permissions)) return false;
      } else {
        if (!canAny(permissions)) return false;
      }
    }

    return true;
  }, [isAuthenticated, minRole, permission, permissions, requireAll, can, canAny, canAll, isAtLeast]);

  // Handle redirect
  React.useEffect(() => {
    if (!hasAccess && redirectTo) {
      router.push(redirectTo);
    }
  }, [hasAccess, redirectTo, router]);

  // If redirecting, show nothing
  if (!hasAccess && redirectTo) {
    return null;
  }

  // If no access, show fallback
  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Guard that requires admin role
 */
export function AdminGuard({
  fallback,
  redirectTo = '/dashboard',
  children,
}: Omit<PermissionGuardProps, 'permission' | 'permissions' | 'requireAll' | 'minRole'>) {
  return (
    <PermissionGuard minRole="admin" fallback={fallback} redirectTo={redirectTo}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Guard that requires user to be authenticated
 */
export function AuthGuard({
  fallback,
  redirectTo = '/login',
  children,
}: Omit<PermissionGuardProps, 'permission' | 'permissions' | 'requireAll' | 'minRole'>) {
  const { isAuthenticated } = usePermissions();
  const router = useRouter();

  React.useEffect(() => {
    if (!isAuthenticated && redirectTo) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  if (!isAuthenticated) {
    if (redirectTo) return null;
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Access denied fallback component
 */
export function AccessDenied({
  title = 'Access Denied',
  message = 'You do not have permission to view this content.',
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
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
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}
