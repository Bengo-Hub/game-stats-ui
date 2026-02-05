// Settings API module
import { apiClient } from './client';

// Profile Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
  phone?: string;
}

// Password Types
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Session Types
export interface Session {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

// Notification Settings Types
export interface NotificationSettings {
  gameUpdates: boolean;
  spiritScores: boolean;
  eventAnnouncements: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export const settingsApi = {
  // ============================================
  // Profile Management
  // ============================================

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/settings/profile');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/settings/profile', data);
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/profile/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiClient.getAccessToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }

    return response.json();
  },

  // ============================================
  // Password Management
  // ============================================

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.post('/settings/password', data);
  },

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  // ============================================
  // Session Management
  // ============================================

  /**
   * Get all active sessions
   */
  async getSessions(): Promise<Session[]> {
    return apiClient.get<Session[]>('/settings/sessions');
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    return apiClient.delete(`/settings/sessions/${sessionId}`);
  },

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessions(): Promise<void> {
    return apiClient.post('/settings/sessions/revoke-all', {});
  },

  // ============================================
  // Notification Settings
  // ============================================

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    return apiClient.get<NotificationSettings>('/settings/notifications');
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return apiClient.put<NotificationSettings>('/settings/notifications', data);
  },

  // ============================================
  // Account Management
  // ============================================

  /**
   * Delete account (requires password confirmation)
   */
  async deleteAccount(password: string): Promise<void> {
    return apiClient.post('/settings/delete-account', { password });
  },

  /**
   * Export user data (GDPR)
   */
  async exportData(): Promise<Blob> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/export`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiClient.getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.blob();
  },
};

export default settingsApi;
