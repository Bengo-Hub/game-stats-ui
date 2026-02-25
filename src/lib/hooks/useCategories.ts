import { categoriesApi } from '@/lib/api/categories';
import { useQuery } from '@tanstack/react-query';

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
  category: (id: string) => [...categoryKeys.all, 'category', id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoriesApi.list(),
    staleTime: 1000 * 60 * 60, // 1h
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.category(id),
    queryFn: () => categoriesApi.get(id),
    enabled: !!id,
  });
}
