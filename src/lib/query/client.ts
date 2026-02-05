/**
 * TanStack Query Client Configuration
 * Centralized query client with optimized caching strategies
 */

import { QueryClient } from '@tanstack/react-query';

// Cache time constants (in milliseconds)
export const CACHE_TIMES = {
  // Real-time data - short cache
  LIVE: 10 * 1000, // 10 seconds

  // Dynamic data - medium cache
  GAMES: 30 * 1000, // 30 seconds
  EVENTS: 60 * 1000, // 1 minute

  // Semi-static data - longer cache
  TEAMS: 5 * 60 * 1000, // 5 minutes
  PLAYERS: 5 * 60 * 1000, // 5 minutes
  STANDINGS: 2 * 60 * 1000, // 2 minutes

  // Static data - long cache
  LEADERBOARDS: 5 * 60 * 1000, // 5 minutes
  SPIRIT: 5 * 60 * 1000, // 5 minutes

  // Reference data - very long cache
  DIVISIONS: 10 * 60 * 1000, // 10 minutes
  GEOGRAPHIC: 30 * 60 * 1000, // 30 minutes
};

// Stale time constants (when to refetch in background)
export const STALE_TIMES = {
  LIVE: 5 * 1000, // 5 seconds
  GAMES: 15 * 1000, // 15 seconds
  EVENTS: 30 * 1000, // 30 seconds
  TEAMS: 2 * 60 * 1000, // 2 minutes
  PLAYERS: 2 * 60 * 1000, // 2 minutes
  STANDINGS: 60 * 1000, // 1 minute
  LEADERBOARDS: 2 * 60 * 1000, // 2 minutes
  SPIRIT: 2 * 60 * 1000, // 2 minutes
  DIVISIONS: 5 * 60 * 1000, // 5 minutes
  GEOGRAPHIC: 15 * 60 * 1000, // 15 minutes
};

// Query key factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },

  // Events
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.events.lists(), params] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.events.details(), id] as const,
    rounds: (eventId: string) => [...queryKeys.events.all, 'rounds', eventId] as const,
    standings: (eventId: string) => [...queryKeys.events.all, 'standings', eventId] as const,
    bracket: (eventId: string) => [...queryKeys.events.all, 'bracket', eventId] as const,
  },

  // Games
  games: {
    all: ['games'] as const,
    lists: () => [...queryKeys.games.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.games.lists(), params] as const,
    details: () => [...queryKeys.games.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.games.details(), id] as const,
    live: () => [...queryKeys.games.all, 'live'] as const,
    upcoming: (limit?: number) => [...queryKeys.games.all, 'upcoming', limit] as const,
    timeline: (gameId: string) => [...queryKeys.games.all, 'timeline', gameId] as const,
    scores: (gameId: string) => [...queryKeys.games.all, 'scores', gameId] as const,
    spirit: (gameId: string) => [...queryKeys.games.all, 'spirit', gameId] as const,
  },

  // Teams
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.teams.lists(), params] as const,
    details: () => [...queryKeys.teams.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teams.details(), id] as const,
    spiritAverage: (teamId: string) => [...queryKeys.teams.all, 'spirit-average', teamId] as const,
  },

  // Divisions
  divisions: {
    all: ['divisions'] as const,
    standings: (divisionId: string) => [...queryKeys.divisions.all, 'standings', divisionId] as const,
  },

  // Rounds
  rounds: {
    all: ['rounds'] as const,
    detail: (id: string) => [...queryKeys.rounds.all, 'detail', id] as const,
    bracket: (roundId: string) => [...queryKeys.rounds.all, 'bracket', roundId] as const,
  },

  // Leaderboards
  leaderboards: {
    all: ['leaderboards'] as const,
    players: (params?: Record<string, unknown>) => [...queryKeys.leaderboards.all, 'players', params] as const,
    spirit: (params?: Record<string, unknown>) => [...queryKeys.leaderboards.all, 'spirit', params] as const,
  },

  // Geographic
  geographic: {
    all: ['geographic'] as const,
    continents: () => [...queryKeys.geographic.all, 'continents'] as const,
    worlds: () => [...queryKeys.geographic.all, 'worlds'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
};

// Create query client with default options
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time
        staleTime: STALE_TIMES.EVENTS,
        // Default cache time
        gcTime: CACHE_TIMES.EVENTS,
        // Retry failed queries
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        // Don't refetch on reconnect by default
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
}

// Singleton for client-side
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  }

  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
