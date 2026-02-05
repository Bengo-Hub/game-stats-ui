// Analytics API module

import type { EventStatistics } from '@/types';
import { apiClient } from './client';

export interface Dashboard {
  id: string;
  title: string;
  slug: string;
  status: string;
}

export interface EmbedTokenRequest {
  userId: string;
  eventId?: string;
  teamIds?: string[];
  username: string;
  firstName: string;
  lastName: string;
}

export interface EmbedTokenResponse {
  token: string;
  dashboardId: string;
  expiresAt: string;
}

export interface NaturalLanguageQueryRequest {
  question: string;
  eventId?: string;
  userId: string;
  context?: string;
}

export interface NaturalLanguageQueryResponse {
  question: string;
  sql: string;
  results: Record<string, unknown>[];
  explanation: string;
  executionTime: number;
}

export const analyticsApi = {
  /**
   * Health check for analytics service
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    return apiClient.get('/analytics/health');
  },

  /**
   * List available dashboards
   */
  async listDashboards(): Promise<{ dashboards: Dashboard[] }> {
    return apiClient.get('/analytics/dashboards');
  },

  /**
   * Get dashboard by UUID
   */
  async getDashboard(dashboardUuid: string): Promise<Dashboard> {
    return apiClient.get<Dashboard>(`/analytics/dashboards/${dashboardUuid}`);
  },

  /**
   * Generate embed token for dashboard
   */
  async generateEmbedToken(dashboardUuid: string, data: EmbedTokenRequest): Promise<EmbedTokenResponse> {
    return apiClient.post<EmbedTokenResponse>(`/analytics/embed-token/${dashboardUuid}`, data);
  },

  /**
   * Get event statistics
   */
  async getEventStatistics(eventId: string): Promise<EventStatistics> {
    return apiClient.get<EventStatistics>(`/analytics/events/${eventId}/statistics`);
  },

  /**
   * Process natural language query
   */
  async query(data: NaturalLanguageQueryRequest): Promise<NaturalLanguageQueryResponse> {
    return apiClient.post<NaturalLanguageQueryResponse>('/analytics/query', data);
  },
};

export default analyticsApi;
