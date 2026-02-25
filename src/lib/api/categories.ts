import { apiClient } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
}

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/categories');
  },
  get: async (id: string): Promise<Category> => {
    return apiClient.get<Category>(`/categories/${id}`);
  },
  create: async (data: CreateCategoryRequest): Promise<Category> => {
    return apiClient.post<Category>('/categories', data);
  },
  update: async (id: string, data: UpdateCategoryRequest): Promise<Category> => {
    return apiClient.put<Category>(`/categories/${id}`, data);
  },
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/categories/${id}`);
  },
};
