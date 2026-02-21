// Games API module

import type { Game, GameEvent } from '@/types';
import { apiClient } from './client';

export interface ListGamesParams {
  divisionPoolId?: string;
  status?: string;
  fieldId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateGameRequest {
  home_team_id: string;
  away_team_id: string;
  scheduled_time: string;
  allocated_time_minutes: number;
  field_location_id?: string;
  division_pool_id: string;
  game_round_id?: string;
}

export interface UpdateGameRequest {
  scheduled_time?: string;
  allocated_time_minutes?: number;
  field_location_id?: string;
  scorekeeper_id?: string;
}

export interface RecordScoreRequest {
  player_id: string;
  assist_player_id?: string;
  team_id: string;
  goals: number;
  assists?: number;
  blocks?: number;
  turns?: number;
  minute?: number;
  second?: number;
}

export const gamesApi = {
  /**
   * Get a list of games with optional filters
   */
  async list(params?: ListGamesParams): Promise<Game[]> {
    return apiClient.get<Game[]>('/games', params);
  },

  /**
   * Get a single game by ID
   */
  async get(id: string): Promise<Game> {
    return apiClient.get<Game>(`/games/${id}`);
  },

  /**
   * Create a new game
   */
  async create(data: CreateGameRequest): Promise<Game> {
    return apiClient.post<Game>('/games', data);
  },

  /**
   * Update a game
   */
  async update(id: string, data: UpdateGameRequest): Promise<Game> {
    return apiClient.put<Game>(`/games/${id}`, data);
  },

  /**
   * Cancel a game
   */
  async cancel(id: string): Promise<void> {
    return apiClient.delete(`/games/${id}`);
  },

  /**
   * Start a game
   */
  async start(id: string): Promise<Game> {
    return apiClient.post<Game>(`/games/${id}/start`, {});
  },

  /**
   * Finish a game (timer done)
   */
  async finish(id: string): Promise<Game> {
    return apiClient.post<Game>(`/games/${id}/finish`, {});
  },

  /**
   * End a game (final submission)
   */
  async end(id: string): Promise<Game> {
    return apiClient.post<Game>(`/games/${id}/end`, {});
  },

  /**
   * Record a score
   */
  async recordScore(id: string, data: RecordScoreRequest): Promise<Game> {
    return apiClient.post<Game>(`/games/${id}/score`, data);
  },

  /**
   * Get game scores
   */
  async getScores(id: string): Promise<GameEvent[]> {
    return apiClient.get<GameEvent[]>(`/games/${id}/scores`);
  },

  /**
   * Get game timeline
   */
  async getTimeline(id: string): Promise<{ game: Game; events: GameEvent[] }> {
    return apiClient.get(`/games/${id}/timeline`);
  },

  /**
   * Record stoppage time
   */
  async recordStoppage(id: string, durationSeconds: number, reason?: string): Promise<Game> {
    return apiClient.post<Game>(`/games/${id}/stoppage`, { duration_seconds: durationSeconds, reason });
  },

  /**
   * Submit spirit score
   */
  async submitSpiritScore(gameId: string, data: {
    scored_by_team_id: string;
    team_id: string;
    rules_knowledge: number;
    fouls_body_contact: number;
    fair_mindedness: number;
    attitude: number;
    communication: number;
    comments?: string;
    mvp_nomination?: string;
    spirit_nomination?: string;
  }): Promise<any> {
    return apiClient.post(`/games/${gameId}/spirit`, data);
  },
};

export default gamesApi;
