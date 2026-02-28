// Events hooks using TanStack Query
import { publicApi, type ListEventsParams } from '@/lib/api/public';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (params: ListEventsParams) => [...eventKeys.lists(), params] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (idOrSlug: string) => [...eventKeys.details(), idOrSlug] as const,
  upcoming: () => [...eventKeys.all, 'upcoming'] as const,
  past: () => [...eventKeys.all, 'past'] as const,
  live: () => [...eventKeys.all, 'live'] as const,
};

export interface UseEventsQueryOptions extends ListEventsParams {
  enabled?: boolean;
}

// Main events query hook
export function useEventsQuery(options?: UseEventsQueryOptions) {
  const { enabled = true, ...params } = options || {};

  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: async () => {
      const response = await publicApi.listEvents(params);
      return response.data || [];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Convenience hooks for different temporal filters
export function useUpcomingEvents(limit = 10) {
  return useQuery({
    queryKey: eventKeys.upcoming(),
    queryFn: async () => {
      const response = await publicApi.getUpcomingEvents(limit);
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
}

export function usePastEvents(limit = 10) {
  return useQuery({
    queryKey: eventKeys.past(),
    queryFn: async () => {
      const response = await publicApi.getPastEvents(limit);
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
}

export function useLiveEvents() {
  return useQuery({
    queryKey: eventKeys.live(),
    queryFn: async () => {
      const response = await publicApi.getLiveEvents();
      return response.data || [];
    },
    staleTime: 1000 * 60, // 1 minute for live data
    gcTime: 1000 * 60, // 1 minute for live data
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

// Single event detail hook
export function useEventDetail(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(idOrSlug || ''),
    queryFn: () => publicApi.getEvent(idOrSlug!),
    enabled: !!idOrSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Infinite scroll hook for events
export function useInfiniteEventsQuery(params?: Omit<ListEventsParams, 'limit' | 'offset'>) {
  const pageSize = 20;

  return useInfiniteQuery({
    queryKey: [...eventKeys.lists(), 'infinite', params],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await publicApi.listEvents({
        ...params,
        limit: pageSize,
        offset: pageParam,
      });
      return response.data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, allPages: any) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.flat().length;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}
