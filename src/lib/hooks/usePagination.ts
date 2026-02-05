// Pagination hooks for public API endpoints using TanStack Query
import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { publicApi } from '@/lib/api/public';
import type {
  Event,
  Game,
  Team,
  PlayerStat,
  TeamSpiritAverage,
  PaginationParams,
} from '@/types';
import type { ListEventsParams, ListGamesParams, ListTeamsParams, LeaderboardParams } from '@/lib/api/public';

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// Pagination state hook
export interface UsePaginationState {
  page: number;
  pageSize: number;
  offset: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

export function usePaginationState(initialPageSize = DEFAULT_PAGE_SIZE): UsePaginationState {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(Math.min(initialPageSize, MAX_PAGE_SIZE));

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(Math.min(size, MAX_PAGE_SIZE));
    setPage(1); // Reset to first page when page size changes
  }, []);

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const reset = useCallback(() => setPage(1), []);

  return {
    page,
    pageSize,
    offset,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    reset,
  };
}

// ============================================
// Events Hooks
// ============================================

export interface UseEventsOptions extends Omit<ListEventsParams, 'limit' | 'offset'> {
  enabled?: boolean;
}

export function useEvents(
  pagination: UsePaginationState,
  options?: UseEventsOptions
) {
  return useQuery({
    queryKey: ['events', pagination.page, pagination.pageSize, options],
    queryFn: () =>
      publicApi.listEvents({
        ...options,
        limit: pagination.pageSize,
        offset: pagination.offset,
      }),
    enabled: options?.enabled !== false,
  });
}

export function useEvent(eventId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => publicApi.getEvent(eventId),
    enabled: !!eventId && options?.enabled !== false,
  });
}

// ============================================
// Games Hooks
// ============================================

export interface UseGamesOptions extends Omit<ListGamesParams, 'limit' | 'offset'> {
  enabled?: boolean;
}

export function useGames(
  pagination: UsePaginationState,
  options?: UseGamesOptions
) {
  return useQuery({
    queryKey: ['games', pagination.page, pagination.pageSize, options],
    queryFn: () =>
      publicApi.listGames({
        ...options,
        limit: pagination.pageSize,
        offset: pagination.offset,
      }),
    enabled: options?.enabled !== false,
  });
}

export function useLiveGames(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['games', 'live'],
    queryFn: () => publicApi.getLiveGames(),
    enabled: options?.enabled !== false,
    refetchInterval: 30000, // Refetch every 30 seconds for live data
  });
}

export function useUpcomingGames(limit = 10, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['games', 'upcoming', limit],
    queryFn: () => publicApi.getUpcomingGames(limit),
    enabled: options?.enabled !== false,
  });
}

export function useGame(gameId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => publicApi.getGame(gameId),
    enabled: !!gameId && options?.enabled !== false,
  });
}

export function useGameTimeline(gameId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['game', gameId, 'timeline'],
    queryFn: () => publicApi.getGameTimeline(gameId),
    enabled: !!gameId && options?.enabled !== false,
  });
}

export function useGameScores(gameId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['game', gameId, 'scores'],
    queryFn: () => publicApi.getGameScores(gameId),
    enabled: !!gameId && options?.enabled !== false,
  });
}

// ============================================
// Teams Hooks
// ============================================

export interface UseTeamsOptions extends Omit<ListTeamsParams, 'limit' | 'offset'> {
  enabled?: boolean;
}

export function useTeams(
  pagination: UsePaginationState,
  options?: UseTeamsOptions
) {
  return useQuery({
    queryKey: ['teams', pagination.page, pagination.pageSize, options],
    queryFn: () =>
      publicApi.listTeams({
        ...options,
        limit: pagination.pageSize,
        offset: pagination.offset,
      }),
    enabled: options?.enabled !== false,
  });
}

export function useTeam(teamId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => publicApi.getTeam(teamId),
    enabled: !!teamId && options?.enabled !== false,
  });
}

export function useTeamSpiritAverage(teamId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['team', teamId, 'spirit-average'],
    queryFn: () => publicApi.getTeamSpiritAverage(teamId),
    enabled: !!teamId && options?.enabled !== false,
  });
}

// ============================================
// Leaderboard Hooks
// ============================================

export interface UseLeaderboardOptions extends Omit<LeaderboardParams, 'limit' | 'offset'> {
  enabled?: boolean;
}

export function usePlayerLeaderboard(
  pagination: UsePaginationState,
  options?: UseLeaderboardOptions
) {
  return useQuery({
    queryKey: ['leaderboard', 'players', pagination.page, pagination.pageSize, options],
    queryFn: () =>
      publicApi.getPlayerLeaderboard({
        ...options,
        limit: pagination.pageSize,
        offset: pagination.offset,
      }),
    enabled: options?.enabled !== false,
  });
}

export function useSpiritLeaderboard(
  pagination: UsePaginationState,
  options?: UseLeaderboardOptions
) {
  return useQuery({
    queryKey: ['leaderboard', 'spirit', pagination.page, pagination.pageSize, options],
    queryFn: () =>
      publicApi.getSpiritLeaderboard({
        ...options,
        limit: pagination.pageSize,
        offset: pagination.offset,
      }),
    enabled: options?.enabled !== false,
  });
}

// ============================================
// Infinite Query Hooks (for "load more" patterns)
// ============================================

export function useInfiniteEvents(options?: UseEventsOptions) {
  return useInfiniteQuery({
    queryKey: ['events', 'infinite', options],
    queryFn: ({ pageParam = 0 }) =>
      publicApi.listEvents({
        ...options,
        limit: DEFAULT_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < DEFAULT_PAGE_SIZE) {
        return undefined; // No more pages
      }
      return allPages.length * DEFAULT_PAGE_SIZE;
    },
    enabled: options?.enabled !== false,
  });
}

export function useInfiniteGames(options?: UseGamesOptions) {
  return useInfiniteQuery({
    queryKey: ['games', 'infinite', options],
    queryFn: ({ pageParam = 0 }) =>
      publicApi.listGames({
        ...options,
        limit: DEFAULT_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < DEFAULT_PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * DEFAULT_PAGE_SIZE;
    },
    enabled: options?.enabled !== false,
  });
}

export function useInfiniteTeams(options?: UseTeamsOptions) {
  return useInfiniteQuery({
    queryKey: ['teams', 'infinite', options],
    queryFn: ({ pageParam = 0 }) =>
      publicApi.listTeams({
        ...options,
        limit: DEFAULT_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < DEFAULT_PAGE_SIZE) {
        return undefined;
      }
      return allPages.length * DEFAULT_PAGE_SIZE;
    },
    enabled: options?.enabled !== false,
  });
}
