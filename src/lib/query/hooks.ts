/**
 * TanStack Query Hooks
 * Custom hooks for data fetching with proper caching
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { publicApi, type ListEventsParams, type ListGamesParams, type ListTeamsParams, type LeaderboardParams, type TeamSpiritAverage } from '@/lib/api';
import type { Event, Game, Team, PlayerStat, DivisionPool, Bracket, DivisionStandings } from '@/types';
import { queryKeys, CACHE_TIMES, STALE_TIMES } from './client';

// ============================================
// Event Hooks
// ============================================

export function useEvents(params?: ListEventsParams) {
  return useQuery({
    queryKey: queryKeys.events.list(params as Record<string, unknown> | undefined),
    queryFn: () => publicApi.listEvents(params),
    staleTime: STALE_TIMES.EVENTS,
    gcTime: CACHE_TIMES.EVENTS,
  });
}

export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.detail(eventId!),
    queryFn: () => publicApi.getEvent(eventId!),
    enabled: !!eventId,
    staleTime: STALE_TIMES.EVENTS,
    gcTime: CACHE_TIMES.EVENTS,
  });
}

export function useEventRounds(eventId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.rounds(eventId!),
    queryFn: () => publicApi.getEventRounds(eventId!),
    enabled: !!eventId,
    staleTime: STALE_TIMES.DIVISIONS,
    gcTime: CACHE_TIMES.DIVISIONS,
  });
}

export function useEventStandings(eventId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.standings(eventId!),
    queryFn: () => publicApi.getEventStandings(eventId!),
    enabled: !!eventId,
    staleTime: STALE_TIMES.STANDINGS,
    gcTime: CACHE_TIMES.STANDINGS,
  });
}

export function useEventBracket(eventId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.bracket(eventId!),
    queryFn: () => publicApi.getEventBracket(eventId!),
    enabled: !!eventId,
    staleTime: STALE_TIMES.STANDINGS,
    gcTime: CACHE_TIMES.STANDINGS,
  });
}

// ============================================
// Game Hooks
// ============================================

export function useGames(params?: ListGamesParams) {
  return useQuery({
    queryKey: queryKeys.games.list(params as Record<string, unknown> | undefined),
    queryFn: () => publicApi.listGames(params),
    staleTime: STALE_TIMES.GAMES,
    gcTime: CACHE_TIMES.GAMES,
  });
}

export function useLiveGames() {
  return useQuery({
    queryKey: queryKeys.games.live(),
    queryFn: () => publicApi.getLiveGames(),
    staleTime: STALE_TIMES.LIVE,
    gcTime: CACHE_TIMES.LIVE,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export function useUpcomingGames(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.games.upcoming(limit),
    queryFn: () => publicApi.getUpcomingGames(limit),
    staleTime: STALE_TIMES.GAMES,
    gcTime: CACHE_TIMES.GAMES,
  });
}

export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.games.detail(gameId!),
    queryFn: () => publicApi.getGame(gameId!),
    enabled: !!gameId,
    staleTime: STALE_TIMES.GAMES,
    gcTime: CACHE_TIMES.GAMES,
  });
}

export function useGameTimeline(gameId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.games.timeline(gameId!),
    queryFn: () => publicApi.getGameTimeline(gameId!),
    enabled: !!gameId,
    staleTime: STALE_TIMES.LIVE,
    gcTime: CACHE_TIMES.LIVE,
    refetchInterval: 10000, // Auto-refresh every 10 seconds for live updates
  });
}

export function useGameScores(gameId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.games.scores(gameId!),
    queryFn: () => publicApi.getGameScores(gameId!),
    enabled: !!gameId,
    staleTime: STALE_TIMES.LIVE,
    gcTime: CACHE_TIMES.LIVE,
  });
}

export function useGameSpiritScores(gameId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.games.spirit(gameId!),
    queryFn: () => publicApi.getGameSpiritScores(gameId!),
    enabled: !!gameId,
    staleTime: STALE_TIMES.SPIRIT,
    gcTime: CACHE_TIMES.SPIRIT,
  });
}

// ============================================
// Team Hooks
// ============================================

export function useTeams(params?: ListTeamsParams) {
  return useQuery({
    queryKey: queryKeys.teams.list(params as Record<string, unknown> | undefined),
    queryFn: () => publicApi.listTeams(params),
    staleTime: STALE_TIMES.TEAMS,
    gcTime: CACHE_TIMES.TEAMS,
  });
}

export function useTeam(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.detail(teamId!),
    queryFn: () => publicApi.getTeam(teamId!),
    enabled: !!teamId,
    staleTime: STALE_TIMES.TEAMS,
    gcTime: CACHE_TIMES.TEAMS,
  });
}

export function useTeamSpiritAverage(teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.spiritAverage(teamId!),
    queryFn: () => publicApi.getTeamSpiritAverage(teamId!),
    enabled: !!teamId,
    staleTime: STALE_TIMES.SPIRIT,
    gcTime: CACHE_TIMES.SPIRIT,
  });
}

// ============================================
// Division Hooks
// ============================================

export function useDivisionStandings(divisionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.divisions.standings(divisionId!),
    queryFn: () => publicApi.getDivisionStandings(divisionId!),
    enabled: !!divisionId,
    staleTime: STALE_TIMES.STANDINGS,
    gcTime: CACHE_TIMES.STANDINGS,
  });
}

// ============================================
// Round Hooks
// ============================================

export function useRound(roundId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rounds.detail(roundId!),
    queryFn: () => publicApi.getRound(roundId!),
    enabled: !!roundId,
    staleTime: STALE_TIMES.DIVISIONS,
    gcTime: CACHE_TIMES.DIVISIONS,
  });
}

export function useRoundBracket(roundId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rounds.bracket(roundId!),
    queryFn: () => publicApi.getRoundBracket(roundId!),
    enabled: !!roundId,
    staleTime: STALE_TIMES.STANDINGS,
    gcTime: CACHE_TIMES.STANDINGS,
  });
}

// ============================================
// Leaderboard Hooks
// ============================================

export function usePlayerLeaderboard(params?: LeaderboardParams) {
  return useQuery({
    queryKey: queryKeys.leaderboards.players(params as Record<string, unknown> | undefined),
    queryFn: () => publicApi.getPlayerLeaderboard(params),
    staleTime: STALE_TIMES.LEADERBOARDS,
    gcTime: CACHE_TIMES.LEADERBOARDS,
  });
}

export function useSpiritLeaderboard(params?: LeaderboardParams) {
  return useQuery({
    queryKey: queryKeys.leaderboards.spirit(params as Record<string, unknown> | undefined),
    queryFn: () => publicApi.getSpiritLeaderboard(params),
    staleTime: STALE_TIMES.SPIRIT,
    gcTime: CACHE_TIMES.SPIRIT,
  });
}

// ============================================
// Geographic Hooks
// ============================================

export function useContinents() {
  return useQuery({
    queryKey: queryKeys.geographic.continents(),
    queryFn: () => publicApi.listContinents(),
    staleTime: STALE_TIMES.GEOGRAPHIC,
    gcTime: CACHE_TIMES.GEOGRAPHIC,
  });
}

export function useWorlds() {
  return useQuery({
    queryKey: queryKeys.geographic.worlds(),
    queryFn: () => publicApi.listWorlds(),
    staleTime: STALE_TIMES.GEOGRAPHIC,
    gcTime: CACHE_TIMES.GEOGRAPHIC,
  });
}

// ============================================
// Dashboard Hooks
// ============================================

export function useDashboardStats() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      // Fetch all data in parallel
      const [liveData, upcomingData, eventsData, teamsData] = await Promise.all([
        publicApi.getLiveGames().catch(() => []),
        publicApi.getUpcomingGames(5).catch(() => []),
        publicApi.listEvents({ status: 'in_progress' }).catch(() => []),
        publicApi.listTeams({ limit: 100 }).catch(() => []),
      ]);

      return {
        liveGames: liveData,
        upcomingGames: upcomingData,
        activeEvents: eventsData,
        totalTeams: teamsData.length,
        stats: {
          activeEvents: eventsData.length,
          liveGames: liveData.length,
          totalTeams: teamsData.length,
          upcomingGames: upcomingData.length,
        },
      };
    },
    staleTime: STALE_TIMES.LIVE,
    gcTime: CACHE_TIMES.LIVE,
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });
}

// ============================================
// Prefetch Utilities
// ============================================

export function usePrefetchEvent() {
  const queryClient = useQueryClient();

  return (eventId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.events.detail(eventId),
      queryFn: () => publicApi.getEvent(eventId),
      staleTime: STALE_TIMES.EVENTS,
    });
  };
}

export function usePrefetchGame() {
  const queryClient = useQueryClient();

  return (gameId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.games.detail(gameId),
      queryFn: () => publicApi.getGame(gameId),
      staleTime: STALE_TIMES.GAMES,
    });
  };
}

export function usePrefetchTeam() {
  const queryClient = useQueryClient();

  return (teamId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.teams.detail(teamId),
      queryFn: () => publicApi.getTeam(teamId),
      staleTime: STALE_TIMES.TEAMS,
    });
  };
}

// ============================================
// Invalidation Utilities
// ============================================

export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateEvents: () => queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
    invalidateGames: () => queryClient.invalidateQueries({ queryKey: queryKeys.games.all }),
    invalidateTeams: () => queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}
