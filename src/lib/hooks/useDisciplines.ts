import { disciplinesApi } from '@/lib/api/disciplines';
import { useQuery } from '@tanstack/react-query';

export const disciplineKeys = {
  all: ['disciplines'] as const,
  list: () => [...disciplineKeys.all, 'list'] as const,
  discipline: (id: string) => [...disciplineKeys.all, 'discipline', id] as const,
};

export function useDisciplines() {
  return useQuery({
    queryKey: disciplineKeys.list(),
    queryFn: () => disciplinesApi.list(),
    staleTime: 1000 * 60 * 60, // 1h
  });
}

export function useDiscipline(id: string) {
  return useQuery({
    queryKey: disciplineKeys.discipline(id),
    queryFn: () => disciplinesApi.get(id),
    enabled: !!id,
  });
}
