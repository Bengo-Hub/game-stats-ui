import type { PaginatedResponse } from '@/types';
import { apiClient } from './client';

export interface Discipline {
  id: string;
  name: string;
  slug: string;
  description?: string;
  rulesPdfUrl?: string;
  countryId: string;
}

export interface CreateDisciplineRequest {
  name: string;
  slug: string;
  description?: string;
  rulesPdfUrl?: string;
  countryId: string;
}

export interface UpdateDisciplineRequest {
  name?: string;
  slug?: string;
  description?: string;
  rulesPdfUrl?: string;
  countryId?: string;
}

export const disciplinesApi = {
  list: async (): Promise<PaginatedResponse<Discipline>> => {
    return apiClient.get<PaginatedResponse<Discipline>>('/disciplines');
  },
  get: async (id: string): Promise<Discipline> => {
    return apiClient.get<Discipline>(`/disciplines/${id}`);
  },
  create: async (data: CreateDisciplineRequest): Promise<Discipline> => {
    return apiClient.post<Discipline>('/disciplines', data);
  },
  update: async (id: string, data: UpdateDisciplineRequest): Promise<Discipline> => {
    return apiClient.put<Discipline>(`/disciplines/${id}`, data);
  },
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/disciplines/${id}`);
  },
};
