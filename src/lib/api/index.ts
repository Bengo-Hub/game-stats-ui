// API module exports

export { adminApi } from './admin';
export { analyticsApi } from './analytics';
export { authApi } from './auth';
export { bulkApi } from './bulk';
export { apiClient } from './client';
export { divisionsApi, eventsApi, roundsApi } from './events';
export { gamesApi } from './games';
export { createGameStream, publicApi } from './public';
export { settingsApi } from './settings';
export { spiritScoresApi, teamsApi } from './teams';

// Re-export public API types
export type {
  EventSortField, GameStreamEvent, LeaderboardParams, ListEventsParams, ListGamesParams, ListTeamsParams, SortOrder, TemporalFilter
} from './public';

// Re-export types from main types module
export type { GameTimeline, TeamSpiritAverage } from '@/types';

