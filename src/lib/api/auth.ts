// Auth API module

import type { AuthResponse, LoginCredentials, User } from '@/types';
import { apiClient } from './client';

export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const originalResponse = await apiClient.post<AuthResponse>('/auth/login', credentials);
    const response = {
      ...originalResponse,
      accessToken: originalResponse.access_token || originalResponse.accessToken,
      refreshToken: originalResponse.refresh_token || originalResponse.refreshToken,
    };

    // Store the access token
    if (response.accessToken) {
      apiClient.setAccessToken(response.accessToken);
    }

    return response;
  },

  /**
   * Refresh the access token
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const originalResponse = await apiClient.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken
    });
    const response = {
      ...originalResponse,
      accessToken: originalResponse.access_token || originalResponse.accessToken,
      refreshToken: originalResponse.refresh_token || originalResponse.refreshToken,
    };

    if (response.accessToken) {
      apiClient.setAccessToken(response.accessToken);
    }

    return response;
  },

  /**
   * Get current user info
   */
  async me(): Promise<User> {
    return apiClient.get<User>('/me');
  },

  /**
   * Logout (clear tokens)
   */
  logout(): void {
    apiClient.setAccessToken(null);
  },
};

export default authApi;
