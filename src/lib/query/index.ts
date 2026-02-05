/**
 * TanStack Query Module Exports
 */

// Client and configuration
export { getQueryClient, createQueryClient, queryKeys, CACHE_TIMES, STALE_TIMES } from './client';

// All query hooks
export {
  // Events
  useEvents,
  useEvent,
  useEventRounds,
  useEventStandings,
  useEventBracket,
  // Games
  useGames,
  useLiveGames,
  useUpcomingGames,
  useGame,
  useGameTimeline,
  useGameScores,
  useGameSpiritScores,
  // Teams
  useTeams,
  useTeam,
  useTeamSpiritAverage,
  // Divisions
  useDivisionStandings,
  // Rounds
  useRound,
  useRoundBracket,
  // Leaderboards
  usePlayerLeaderboard,
  useSpiritLeaderboard,
  // Geographic
  useContinents,
  useWorlds,
  // Dashboard
  useDashboardStats,
  // Prefetch utilities
  usePrefetchEvent,
  usePrefetchGame,
  usePrefetchTeam,
  // Invalidation utilities
  useInvalidateQueries,
} from './hooks';
