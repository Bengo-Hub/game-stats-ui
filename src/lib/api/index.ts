// API module exports

export { apiClient } from './client';
export { authApi } from './auth';
export { gamesApi } from './games';
export { eventsApi, divisionsApi, roundsApi } from './events';
export { teamsApi, spiritScoresApi } from './teams';
export { analyticsApi } from './analytics';
export { adminApi } from './admin';
export { settingsApi } from './settings';
export { publicApi, createGameStream } from './public';

// Re-export public API types
export type {
  ListEventsParams,
  TemporalFilter,
  EventSortField,
  SortOrder,
  ListGamesParams,
  GameStreamEvent,
  ListTeamsParams,
  LeaderboardParams,
} from './public';

// Re-export types from main types module
export type { TeamSpiritAverage, GameTimeline } from '@/types';
