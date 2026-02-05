// Games hooks using TanStack Query
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { publicApi, type ListGamesParams } from '@/lib/api/public';
import type { Game } from '@/types';

// Query keys
export const gameKeys = {
  all: ['games'] as const,
  lists: () => [...gameKeys.all, 'list'] as const,
  list: (params: ListGamesParams) => [...gameKeys.lists(), params] as const,
  details: () => [...gameKeys.all, 'detail'] as const,
  detail: (id: string) => [...gameKeys.details(), id] as const,
  live: () => [...gameKeys.all, 'live'] as const,
  upcoming: () => [...gameKeys.all, 'upcoming'] as const,
  timeline: (id: string) => [...gameKeys.detail(id), 'timeline'] as const,
  scores: (id: string) => [...gameKeys.detail(id), 'scores'] as const,
  spirit: (id: string) => [...gameKeys.detail(id), 'spirit'] as const,
};

export interface UseGamesQueryOptions extends ListGamesParams {
  enabled?: boolean;
}

// Main games query hook
export function useGamesQuery(options?: UseGamesQueryOptions) {
  const { enabled = true, ...params } = options || {};

  return useQuery({
    queryKey: gameKeys.list(params),
    queryFn: () => publicApi.listGames(params),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Live games hook with auto-refresh
export function useLiveGamesQuery() {
  return useQuery({
    queryKey: gameKeys.live(),
    queryFn: () => publicApi.getLiveGames(),
    staleTime: 1000 * 30, // 30 seconds for live data
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
}

// Upcoming games hook
export function useUpcomingGamesQuery(limit = 10) {
  return useQuery({
    queryKey: [...gameKeys.upcoming(), limit],
    queryFn: () => publicApi.getUpcomingGames(limit),
    staleTime: 1000 * 60 * 5,
  });
}

// Single game detail hook
export function useGameDetail(gameId: string | undefined) {
  return useQuery({
    queryKey: gameKeys.detail(gameId || ''),
    queryFn: () => publicApi.getGame(gameId!),
    enabled: !!gameId,
    staleTime: 1000 * 60 * 2,
  });
}

// Game timeline hook
export function useGameTimelineQuery(gameId: string | undefined) {
  return useQuery({
    queryKey: gameKeys.timeline(gameId || ''),
    queryFn: () => publicApi.getGameTimeline(gameId!),
    enabled: !!gameId,
    staleTime: 1000 * 30, // 30 seconds for live data
  });
}

// Game scores hook
export function useGameScoresQuery(gameId: string | undefined) {
  return useQuery({
    queryKey: gameKeys.scores(gameId || ''),
    queryFn: () => publicApi.getGameScores(gameId!),
    enabled: !!gameId,
    staleTime: 1000 * 30,
  });
}

// Game spirit scores hook
export function useGameSpiritQuery(gameId: string | undefined) {
  return useQuery({
    queryKey: gameKeys.spirit(gameId || ''),
    queryFn: () => publicApi.getGameSpiritScores(gameId!),
    enabled: !!gameId,
    staleTime: 1000 * 60 * 5,
  });
}

// Infinite scroll hook for games
export function useInfiniteGamesQuery(params?: Omit<ListGamesParams, 'limit' | 'offset'>) {
  const pageSize = 20;

  return useInfiniteQuery({
    queryKey: [...gameKeys.lists(), 'infinite', params],
    queryFn: ({ pageParam = 0 }) =>
      publicApi.listGames({
        ...params,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.flat().length;
    },
    staleTime: 1000 * 60 * 2,
  });
}
