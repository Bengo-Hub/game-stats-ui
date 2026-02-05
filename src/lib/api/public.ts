// Public API Client for unauthenticated access
// These endpoints are rate-limited and provide read-only access

import type {
  Game,
  GameTimeline,
  Team,
  Event,
  EventCategory,
  DivisionPool,
  DivisionStandings,
  Bracket,
  SpiritScore,
  PlayerStat,
  TeamSpiritAverage,
  World,
  Continent,
  PaginationParams,
  Scoring,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const PUBLIC_BASE = `${API_BASE_URL}/public`;

type QueryParams = Record<string, string | number | boolean | string[] | undefined>;

interface RequestOptions {
  params?: QueryParams;
  signal?: AbortSignal;
}

// Default pagination
const DEFAULT_LIMIT = 50;

// Helper to convert snake_case to camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Helper to recursively transform object keys from snake_case to camelCase
function transformKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }

  if (typeof obj === 'object') {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const camelKey = snakeToCamel(key);
      transformed[camelKey] = transformKeys(value);
    }
    return transformed;
  }

  return obj;
}

// Helper to build URL with query params (supports arrays for multi-value params)
function buildUrl(endpoint: string, params?: QueryParams): string {
  const url = new URL(`${PUBLIC_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // For array values, append each as separate query param with same key
          value.forEach(v => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
  }
  return url.toString();
}

// Generic fetch wrapper for public endpoints
async function publicFetch<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(endpoint, options.params);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP error ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.message || error.error || 'Request failed');
  }

  const text = await response.text();
  if (!text) {
    return [] as unknown as T;
  }

  const data = JSON.parse(text);
  // Transform snake_case keys to camelCase
  return transformKeys(data) as T;
}

// ============================================
// Events / Discover API
// ============================================

export type TemporalFilter = 'past' | 'upcoming' | 'live' | 'all';
export type EventSortField = 'start_date' | 'name' | 'teams_count';
export type SortOrder = 'asc' | 'desc';

export interface ListEventsParams extends PaginationParams {
  status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'canceled';
  year?: number;
  temporal?: TemporalFilter;
  category?: EventCategory[];
  country?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: EventSortField;
  sortOrder?: SortOrder;
}

export async function listEvents(params?: ListEventsParams): Promise<Event[]> {
  return publicFetch<Event[]>('/events', {
    params: {
      status: params?.status,
      year: params?.year,
      temporal: params?.temporal,
      category: params?.category,
      country: params?.country,
      search: params?.search,
      startDateFrom: params?.startDateFrom,
      startDateTo: params?.startDateTo,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      limit: params?.limit ?? DEFAULT_LIMIT,
      offset: params?.offset ?? 0,
    },
  });
}

export async function getUpcomingEvents(limit: number = 10): Promise<Event[]> {
  return listEvents({ temporal: 'upcoming', limit, sortBy: 'start_date', sortOrder: 'asc' });
}

export async function getPastEvents(limit: number = 10): Promise<Event[]> {
  return listEvents({ temporal: 'past', limit, sortBy: 'start_date', sortOrder: 'desc' });
}

export async function getLiveEvents(): Promise<Event[]> {
  return listEvents({ temporal: 'live', sortBy: 'start_date', sortOrder: 'asc' });
}

export async function getEvent(eventId: string): Promise<Event> {
  return publicFetch<Event>(`/events/${eventId}`);
}

export async function getEventRounds(eventId: string): Promise<DivisionPool[]> {
  return publicFetch<DivisionPool[]>(`/events/${eventId}/rounds`);
}

export async function getEventBracket(eventId: string, roundId?: string): Promise<Bracket> {
  return publicFetch<Bracket>(`/events/${eventId}/bracket`, {
    params: roundId ? { round_id: roundId } : undefined,
  });
}

export async function getEventStandings(eventId: string): Promise<DivisionStandings> {
  return publicFetch<DivisionStandings>(`/events/${eventId}/standings`);
}

// Crew/Staff types
export interface CrewMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface EventCrew {
  eventId: string;
  eventName: string;
  admins: CrewMember[];
  scorekeepers: CrewMember[];
}

export async function getEventCrew(eventId: string): Promise<EventCrew> {
  return publicFetch<EventCrew>(`/events/${eventId}/crew`);
}

// ============================================
// Live Games API
// ============================================

export interface ListGamesParams extends PaginationParams {
  status?: 'scheduled' | 'in_progress' | 'finished' | 'ended' | 'canceled';
  divisionPoolId?: string;
  fieldId?: string;
  startDate?: string;
  endDate?: string;
}

export async function listGames(params?: ListGamesParams): Promise<Game[]> {
  return publicFetch<Game[]>('/games', {
    params: {
      status: params?.status,
      divisionPoolId: params?.divisionPoolId,
      fieldId: params?.fieldId,
      startDate: params?.startDate,
      endDate: params?.endDate,
      limit: params?.limit ?? DEFAULT_LIMIT,
      offset: params?.offset ?? 0,
    } as QueryParams,
  });
}

export async function getLiveGames(): Promise<Game[]> {
  return publicFetch<Game[]>('/games', {
    params: { status: 'in_progress', limit: DEFAULT_LIMIT },
  });
}

export async function getUpcomingGames(limit: number = 10): Promise<Game[]> {
  return publicFetch<Game[]>('/games', {
    params: {
      status: 'scheduled',
      limit,
    },
  });
}

export async function getGame(gameId: string): Promise<Game> {
  return publicFetch<Game>(`/games/${gameId}`);
}

export async function getGameTimeline(gameId: string): Promise<GameTimeline> {
  return publicFetch<GameTimeline>(`/games/${gameId}/timeline`);
}

export async function getGameScores(gameId: string): Promise<Scoring[]> {
  return publicFetch<Scoring[]>(`/games/${gameId}/scores`);
}

export async function getGameSpiritScores(gameId: string): Promise<SpiritScore[]> {
  return publicFetch<SpiritScore[]>(`/games/${gameId}/spirit`);
}

// ============================================
// SSE Stream for Live Game Updates
// ============================================

export interface GameStreamEvent {
  type: 'score_updated' | 'game_started' | 'game_finished' | 'game_ended' | 'stoppage' | 'heartbeat';
  data: unknown;
  timestamp: string;
}

export function createGameStream(
  gameId: string,
  onEvent: (event: GameStreamEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const eventSource = new EventSource(`${PUBLIC_BASE}/games/${gameId}/stream`);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    if (onError) {
      onError(new Error('Stream connection error'));
    }
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}

// ============================================
// Divisions & Standings API
// ============================================

export async function getDivisionStandings(divisionId: string): Promise<DivisionStandings> {
  return publicFetch<DivisionStandings>(`/divisions/${divisionId}/standings`);
}

// ============================================
// Rounds & Brackets API
// ============================================

export async function getRound(roundId: string): Promise<DivisionPool> {
  return publicFetch<DivisionPool>(`/rounds/${roundId}`);
}

export async function getRoundBracket(roundId: string): Promise<Bracket> {
  return publicFetch<Bracket>(`/rounds/${roundId}/bracket`);
}

// ============================================
// Teams API
// ============================================

export interface ListTeamsParams extends PaginationParams {
  divisionPoolId?: string;
  eventId?: string;
  search?: string;
}

export async function listTeams(params?: ListTeamsParams): Promise<Team[]> {
  return publicFetch<Team[]>('/teams', {
    params: {
      divisionPoolId: params?.divisionPoolId,
      eventId: params?.eventId,
      search: params?.search,
      limit: params?.limit ?? DEFAULT_LIMIT,
      offset: params?.offset ?? 0,
    } as QueryParams,
  });
}

export async function getTeam(teamId: string): Promise<Team> {
  return publicFetch<Team>(`/teams/${teamId}`);
}

export async function getTeamSpiritAverage(teamId: string): Promise<TeamSpiritAverage> {
  return publicFetch<TeamSpiritAverage>(`/teams/${teamId}/spirit-average`);
}

// ============================================
// Leaderboards API
// ============================================

export interface LeaderboardParams extends PaginationParams {
  eventId?: string;
  divisionPoolId?: string;
  category?: 'goals' | 'assists';
}

export async function getPlayerLeaderboard(params?: LeaderboardParams): Promise<PlayerStat[]> {
  return publicFetch<PlayerStat[]>('/leaderboards/players', {
    params: {
      eventId: params?.eventId,
      divisionPoolId: params?.divisionPoolId,
      category: params?.category,
      limit: params?.limit ?? DEFAULT_LIMIT,
      offset: params?.offset ?? 0,
    } as QueryParams,
  });
}

export async function getSpiritLeaderboard(params?: LeaderboardParams): Promise<TeamSpiritAverage[]> {
  return publicFetch<TeamSpiritAverage[]>('/leaderboards/spirit', {
    params: {
      eventId: params?.eventId,
      divisionPoolId: params?.divisionPoolId,
      limit: params?.limit ?? DEFAULT_LIMIT,
      offset: params?.offset ?? 0,
    } as QueryParams,
  });
}

// ============================================
// Geographic API
// ============================================

export interface Country {
  id: string;
  name: string;
  code: string;
  slug: string;
  continentId?: string;
}

export async function listContinents(): Promise<Continent[]> {
  return publicFetch<Continent[]>('/geographic/continents');
}

export async function listWorlds(): Promise<World[]> {
  return publicFetch<World[]>('/geographic/worlds');
}

export async function listCountries(continentId?: string): Promise<Country[]> {
  return publicFetch<Country[]>('/geographic/countries', {
    params: continentId ? { continentId } : undefined,
  });
}

export async function getContinent(continentId: string): Promise<Continent & { countries?: Country[] }> {
  return publicFetch<Continent & { countries?: Country[] }>(`/geographic/continents/${continentId}`);
}

// ============================================
// Export all as publicApi
// ============================================

export const publicApi = {
  // Events
  listEvents,
  getUpcomingEvents,
  getPastEvents,
  getLiveEvents,
  getEvent,
  getEventRounds,
  getEventBracket,
  getEventStandings,
  getEventCrew,

  // Games
  listGames,
  getLiveGames,
  getUpcomingGames,
  getGame,
  getGameTimeline,
  getGameScores,
  getGameSpiritScores,
  createGameStream,

  // Divisions
  getDivisionStandings,

  // Rounds
  getRound,
  getRoundBracket,

  // Teams
  listTeams,
  getTeam,
  getTeamSpiritAverage,

  // Leaderboards
  getPlayerLeaderboard,
  getSpiritLeaderboard,

  // Geographic
  listContinents,
  listWorlds,
  listCountries,
  getContinent,
};

export default publicApi;
