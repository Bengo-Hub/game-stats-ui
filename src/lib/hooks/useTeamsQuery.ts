// Teams hooks using TanStack Query
import { publicApi, type ListTeamsParams } from '@/lib/api/public';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

// Query keys
export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (params: ListTeamsParams) => [...teamKeys.lists(), params] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
  spirit: (id: string) => [...teamKeys.detail(id), 'spirit'] as const,
};

export interface UseTeamsQueryOptions extends ListTeamsParams {
  enabled?: boolean;
}

// Main teams query hook
export function useTeamsQuery(options?: UseTeamsQueryOptions) {
  const { enabled = true, ...params } = options || {};

  return useQuery({
    queryKey: teamKeys.list(params),
    queryFn: () => publicApi.listTeams(params),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Single team detail hook
export function useTeamDetail(teamId: string | undefined) {
  return useQuery({
    queryKey: teamKeys.detail(teamId || ''),
    queryFn: () => publicApi.getTeam(teamId!),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });
}

// Team spirit average hook
export function useTeamSpiritQuery(teamId: string | undefined) {
  return useQuery({
    queryKey: teamKeys.spirit(teamId || ''),
    queryFn: () => publicApi.getTeamSpiritAverage(teamId!),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });
}

// Infinite scroll hook for teams
export function useInfiniteTeamsQuery(params?: Omit<ListTeamsParams, 'limit' | 'offset'>) {
  const pageSize = 20;

  return useInfiniteQuery({
    queryKey: [...teamKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam = 0 }) =>
      publicApi.listTeams({
        ...params,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      const itemsCount = lastPage.data ? lastPage.data.length : (lastPage.length || 0);
      if (itemsCount < pageSize) return undefined;
      return allPages.reduce((acc, page) => acc + (page.data ? page.data.length : (page.length || 0)), 0);
    },
    staleTime: 1000 * 60 * 5,
  });
}
