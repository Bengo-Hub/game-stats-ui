// Admin API module - requires admin role

import { apiClient } from './client';

// User Management Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'event_manager' | 'team_manager' | 'scorekeeper' | 'spectator';
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: AdminUser['role'];
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: AdminUser['role'];
  status?: AdminUser['status'];
}

export interface ListUsersParams {
  role?: AdminUser['role'];
  status?: AdminUser['status'];
  search?: string;
  limit?: number;
  offset?: number;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ListAuditLogsParams {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Score Edit Types
export interface ScoreEdit {
  id: string;
  gameId: string;
  gameName: string;
  requestedById: string;
  requestedByName: string;
  status: 'pending' | 'approved' | 'rejected';
  previousHomeScore: number;
  previousAwayScore: number;
  newHomeScore: number;
  newAwayScore: number;
  reason: string;
  rejectionReason?: string;
  reviewedById?: string;
  reviewedByName?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ListScoreEditsParams {
  status?: ScoreEdit['status'];
  gameId?: string;
  requestedById?: string;
  limit?: number;
  offset?: number;
}

// System Health Types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    status: 'up' | 'down';
    latencyMs: number;
  };
  redis?: {
    status: 'up' | 'down';
    latencyMs: number;
  };
  uptime: number;
  version: string;
  timestamp: string;
}

export const adminApi = {
  // ============================================
  // User Management
  // ============================================

  /**
   * List all users
   */
  async listUsers(params?: ListUsersParams): Promise<AdminUser[]> {
    return apiClient.get<AdminUser[]>('/admin/users', params as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get a single user
   */
  async getUser(id: string): Promise<AdminUser> {
    return apiClient.get<AdminUser>(`/admin/users/${id}`);
  },

  /**
   * Create a new user
   */
  async createUser(data: CreateUserRequest): Promise<AdminUser> {
    return apiClient.post<AdminUser>('/admin/users', data);
  },

  /**
   * Update a user
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<AdminUser> {
    return apiClient.put<AdminUser>(`/admin/users/${id}`, data);
  },

  /**
   * Delete a user (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    return apiClient.delete(`/admin/users/${id}`);
  },

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: AdminUser['role']): Promise<AdminUser> {
    return apiClient.put<AdminUser>(`/admin/users/${id}/role`, { role });
  },

  /**
   * Suspend a user
   */
  async suspendUser(id: string, reason?: string): Promise<AdminUser> {
    return apiClient.post<AdminUser>(`/admin/users/${id}/suspend`, { reason });
  },

  /**
   * Activate a user
   */
  async activateUser(id: string): Promise<AdminUser> {
    return apiClient.post<AdminUser>(`/admin/users/${id}/activate`, {});
  },

  /**
   * Reset user password (send reset email)
   */
  async resetUserPassword(id: string): Promise<void> {
    return apiClient.post(`/admin/users/${id}/reset-password`, {});
  },

  // ============================================
  // Audit Logs
  // ============================================

  /**
   * List audit logs
   */
  async listAuditLogs(params?: ListAuditLogsParams): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>('/admin/audit-logs', params as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get audit log details
   */
  async getAuditLog(id: string): Promise<AuditLog> {
    return apiClient.get<AuditLog>(`/admin/audit-logs/${id}`);
  },

  /**
   * Export audit logs
   */
  async exportAuditLogs(params?: ListAuditLogsParams): Promise<Blob> {
    const response = await fetch(
      `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')}/api/v1/admin/audit-logs/export`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiClient.getAccessToken()}`,
        },
        body: JSON.stringify(params),
      }
    );
    return response.blob();
  },

  // ============================================
  // Score Edit Approvals
  // ============================================

  /**
   * List pending score edits
   */
  async listScoreEdits(params?: ListScoreEditsParams): Promise<ScoreEdit[]> {
    return apiClient.get<ScoreEdit[]>('/admin/score-edits', params as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get score edit details
   */
  async getScoreEdit(id: string): Promise<ScoreEdit> {
    return apiClient.get<ScoreEdit>(`/admin/score-edits/${id}`);
  },

  /**
   * Approve a score edit
   */
  async approveScoreEdit(id: string): Promise<ScoreEdit> {
    return apiClient.post<ScoreEdit>(`/admin/score-edits/${id}/approve`, {});
  },

  /**
   * Reject a score edit
   */
  async rejectScoreEdit(id: string, reason: string): Promise<ScoreEdit> {
    return apiClient.post<ScoreEdit>(`/admin/score-edits/${id}/reject`, { reason });
  },

  // ============================================
  // Game Score Management (Admin override)
  // ============================================

  /**
   * Admin override for game score
   */
  async overrideGameScore(gameId: string, data: {
    homeTeamScore: number;
    awayTeamScore: number;
    reason: string;
  }): Promise<unknown> {
    return apiClient.put(`/admin/games/${gameId}/score`, data);
  },

  /**
   * Get game audit history
   */
  async getGameAuditHistory(gameId: string): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>(`/admin/games/${gameId}/audit`);
  },

  // ============================================
  // System Management
  // ============================================

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return apiClient.get<SystemHealth>('/admin/system/health');
  },

  /**
   * Export data (CSV/JSON)
   */
  async exportData(type: 'events' | 'games' | 'teams' | 'users', format: 'csv' | 'json'): Promise<Blob> {
    const response = await fetch(
      `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '')}/api/v1/admin/export/${type}?format=${format}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiClient.getAccessToken()}`,
        },
      }
    );
    return response.blob();
  },

  /**
   * Clear cache
   */
  async clearCache(key?: string): Promise<void> {
    return apiClient.post('/admin/system/clear-cache', { key });
  },
};

export default adminApi;
