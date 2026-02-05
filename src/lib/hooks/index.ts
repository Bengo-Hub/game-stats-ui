// Custom hooks exports
export { useGameStream } from './useGameStream';
export type { SSEEventType, SSEEvent, GameStreamState } from './useGameStream';

// Pagination hooks
export {
  usePaginationState,
  useEvents,
  useEvent,
  useGames,
  useLiveGames,
  useUpcomingGames,
  useGame,
  useGameTimeline,
  useGameScores,
  useTeams,
  useTeam,
  useTeamSpiritAverage,
  usePlayerLeaderboard,
  useSpiritLeaderboard,
  useInfiniteEvents,
  useInfiniteGames,
  useInfiniteTeams,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from './usePagination';
export type {
  UsePaginationState,
  UseEventsOptions,
  UseGamesOptions,
  UseTeamsOptions,
  UseLeaderboardOptions,
} from './usePagination';

// Geographic hooks
export {
  useWorlds,
  useContinents,
  useContinent,
  useCountries,
  geographicKeys,
} from './useGeographic';

// Events query hooks (TanStack Query)
export {
  useEventsQuery,
  useUpcomingEvents,
  usePastEvents,
  useLiveEvents,
  useEventDetail,
  useInfiniteEventsQuery,
  eventKeys,
} from './useEventsQuery';

// Games query hooks (TanStack Query)
export {
  useGamesQuery,
  useLiveGamesQuery,
  useUpcomingGamesQuery,
  useGameDetail,
  useGameTimelineQuery,
  useGameScoresQuery,
  useGameSpiritQuery,
  useInfiniteGamesQuery,
  gameKeys,
} from './useGamesQuery';

// Teams query hooks (TanStack Query)
export {
  useTeamsQuery,
  useTeamDetail,
  useTeamSpiritQuery,
  useInfiniteTeamsQuery,
  teamKeys,
} from './useTeamsQuery';
