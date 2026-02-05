/**
 * React hooks for permission checking
 */

import { useMemo } from 'react';
import { useUser } from '@/stores/auth';
import {
  type Permission,
  type Role,
  type PermissionModule,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessModule,
  canManageModule,
  isRoleEqualOrHigher,
  getPermissionsForRole,
} from '@/lib/permissions';

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const user = useUser();
  return useMemo(
    () => hasPermission(user?.role as Role | undefined, permission),
    [user?.role, permission]
  );
}

/**
 * Hook that returns permission checking utilities for the current user
 */
export function usePermissions() {
  const user = useUser();
  const role = user?.role as Role | undefined;

  return useMemo(
    () => ({
      /** Current user's role */
      role,

      /** Check if user has a specific permission */
      can: (permission: Permission) => hasPermission(role, permission),

      /** Check if user has any of the given permissions */
      canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),

      /** Check if user has all of the given permissions */
      canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),

      /** Check if user can access a module (view permission) */
      canAccess: (module: PermissionModule) => canAccessModule(role, module),

      /** Check if user can manage a module (full control) */
      canManage: (module: PermissionModule) => canManageModule(role, module),

      /** Check if user's role is equal or higher than the given role */
      isAtLeast: (requiredRole: Role) => isRoleEqualOrHigher(role, requiredRole),

      /** Get all permissions for the current user */
      permissions: role ? getPermissionsForRole(role) : [],

      /** Check if user is an admin */
      isAdmin: role === 'admin',

      /** Check if user is authenticated */
      isAuthenticated: !!user,
    }),
    [role, user]
  );
}

/**
 * Hook to check if user can access a specific module
 */
export function useCanAccess(module: PermissionModule): boolean {
  const user = useUser();
  return useMemo(
    () => canAccessModule(user?.role as Role | undefined, module),
    [user?.role, module]
  );
}

/**
 * Hook to check if user can manage a specific module
 */
export function useCanManage(module: PermissionModule): boolean {
  const user = useUser();
  return useMemo(
    () => canManageModule(user?.role as Role | undefined, module),
    [user?.role, module]
  );
}

/**
 * Hook to check if user's role meets a minimum requirement
 */
export function useIsRoleAtLeast(requiredRole: Role): boolean {
  const user = useUser();
  return useMemo(
    () => isRoleEqualOrHigher(user?.role as Role | undefined, requiredRole),
    [user?.role, requiredRole]
  );
}
