/**
 * RBAC Permission System
 * Defines roles, permissions, and utility functions for access control
 */

// User roles matching backend
export type Role = 'admin' | 'event_manager' | 'team_manager' | 'scorekeeper' | 'spectator';

// Permission actions for each module
export type PermissionAction = 'view' | 'add' | 'change' | 'delete' | 'manage';

// Module names
export type PermissionModule =
  | 'dashboard'
  | 'events'
  | 'games'
  | 'teams'
  | 'players'
  | 'spirit'
  | 'analytics'
  | 'admin'
  | 'settings'
  | 'users';

// Combined permission type
export type Permission =
  // Dashboard
  | 'view_dashboard'
  // Events
  | 'view_events'
  | 'add_events'
  | 'change_events'
  | 'delete_events'
  | 'manage_events'
  // Games
  | 'view_games'
  | 'add_games'
  | 'change_games'
  | 'delete_games'
  | 'manage_games'
  | 'record_scores'
  // Teams
  | 'view_teams'
  | 'add_teams'
  | 'change_teams'
  | 'delete_teams'
  | 'manage_teams'
  // Players
  | 'view_players'
  | 'add_players'
  | 'change_players'
  | 'delete_players'
  | 'manage_players'
  // Spirit
  | 'view_spirit'
  | 'submit_spirit'
  | 'change_spirit'
  | 'manage_spirit'
  // Analytics
  | 'view_analytics'
  | 'export_analytics'
  // Admin
  | 'view_admin'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_settings'
  // Settings
  | 'view_settings'
  | 'change_settings';

// Role permission mappings
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // All permissions
    'view_dashboard',
    'view_events', 'add_events', 'change_events', 'delete_events', 'manage_events',
    'view_games', 'add_games', 'change_games', 'delete_games', 'manage_games', 'record_scores',
    'view_teams', 'add_teams', 'change_teams', 'delete_teams', 'manage_teams',
    'view_players', 'add_players', 'change_players', 'delete_players', 'manage_players',
    'view_spirit', 'submit_spirit', 'change_spirit', 'manage_spirit',
    'view_analytics', 'export_analytics',
    'view_admin', 'manage_users', 'manage_roles', 'manage_settings',
    'view_settings', 'change_settings',
  ],

  event_manager: [
    'view_dashboard',
    'view_events', 'add_events', 'change_events', 'manage_events',
    'view_games', 'add_games', 'change_games', 'manage_games', 'record_scores',
    'view_teams', 'add_teams', 'change_teams', 'manage_teams',
    'view_players', 'add_players', 'change_players',
    'view_spirit', 'submit_spirit',
    'view_analytics', 'export_analytics',
    'view_settings',
  ],

  team_manager: [
    'view_dashboard',
    'view_events',
    'view_games',
    'view_teams', 'change_teams',
    'view_players', 'add_players', 'change_players', 'delete_players', 'manage_players',
    'view_spirit', 'submit_spirit',
    'view_analytics',
    'view_settings',
  ],

  scorekeeper: [
    'view_dashboard',
    'view_events',
    'view_games', 'record_scores',
    'view_teams',
    'view_players',
    'view_spirit', 'submit_spirit',
    'view_settings',
  ],

  spectator: [
    'view_dashboard',
    'view_events',
    'view_games',
    'view_teams',
    'view_players',
    'view_spirit',
    'view_analytics',
    'view_settings',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role | undefined | null, permissions: Permission[]): boolean {
  if (!role || !permissions.length) return false;
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role | undefined | null, permissions: Permission[]): boolean {
  if (!role || !permissions.length) return false;
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role can access a specific module
 */
export function canAccessModule(role: Role | undefined | null, module: PermissionModule): boolean {
  const viewPermission = `view_${module}` as Permission;
  return hasPermission(role, viewPermission);
}

/**
 * Check if a role can manage a specific module
 */
export function canManageModule(role: Role | undefined | null, module: PermissionModule): boolean {
  const managePermission = `manage_${module}` as Permission;
  return hasPermission(role, managePermission);
}

/**
 * Role hierarchy for comparison
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 100,
  event_manager: 80,
  team_manager: 60,
  scorekeeper: 40,
  spectator: 20,
};

/**
 * Check if role1 has equal or higher privileges than role2
 */
export function isRoleEqualOrHigher(role1: Role | undefined | null, role2: Role): boolean {
  if (!role1) return false;
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    admin: 'Administrator',
    event_manager: 'Event Manager',
    team_manager: 'Team Manager',
    scorekeeper: 'Scorekeeper',
    spectator: 'Spectator',
  };
  return displayNames[role] || role;
}
