// Events API module

import type { DivisionStandings, Event, EventCategory } from '@/types';
import { apiClient } from './client';

export interface GameRound {
  id: string;
  eventId: string;
  name: string;
  roundType: 'pool' | 'bracket' | 'crossover' | 'placement';
  roundOrder: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Event CRUD Types
export interface CreateEventRequest {
  name: string;
  slug?: string;
  description?: string;
  startDate: string;
  endDate: string;
  disciplineId: string;
  locationId?: string;
  categories?: EventCategory[];
  logoUrl?: string;
  bannerUrl?: string;
  status?: 'draft' | 'published';
}

export interface UpdateEventRequest {
  name?: string;
  slug?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  disciplineId?: string;
  locationId?: string;
  categories?: EventCategory[];
  logoUrl?: string;
  bannerUrl?: string;
  status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'canceled';
}

export interface ListEventsParams {
  status?: string;
  year?: number;
  temporal?: 'past' | 'upcoming' | 'live' | 'all';
  category?: EventCategory[];
  country?: string;
  search?: string;
  sortBy?: 'start_date' | 'name' | 'teams_count';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Division Types
export interface Division {
  id: string;
  eventId: string;
  name: string;
  divisionType: string;
  description?: string;
  createdAt: string;
}

export interface CreateDivisionRequest {
  name: string;
  divisionType: string;
  description?: string;
}

export interface UpdateDivisionRequest {
  name?: string;
  divisionType?: string;
  description?: string;
}

// Division Pool Types
export interface DivisionPool {
  id: string;
  divisionId: string;
  name: string;
  poolOrder: number;
  createdAt: string;
}

export interface CreateDivisionPoolRequest {
  name: string;
  poolOrder?: number;
}

export const eventsApi = {
  // ============================================
  // Event CRUD Operations
  // ============================================

  /**
   * List events with filters
   */
  async list(params?: ListEventsParams): Promise<Event[]> {
    return apiClient.get<Event[]>('/events', params as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get a single event by ID or slug
   */
  async get(idOrSlug: string): Promise<Event> {
    return apiClient.get<Event>(`/events/${idOrSlug}`);
  },

  /**
   * Create a new event
   */
  async create(data: CreateEventRequest): Promise<Event> {
    return apiClient.post<Event>('/events', data);
  },

  /**
   * Update an event
   */
  async update(id: string, data: UpdateEventRequest): Promise<Event> {
    return apiClient.put<Event>(`/events/${id}`, data);
  },

  /**
   * Delete (soft-delete) an event
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/events/${id}`);
  },

  /**
   * Publish an event (change status from draft to published)
   */
  async publish(id: string): Promise<Event> {
    return apiClient.post<Event>(`/events/${id}/publish`, {});
  },

  /**
   * Cancel an event
   */
  async cancel(id: string, reason?: string): Promise<Event> {
    return apiClient.post<Event>(`/events/${id}/cancel`, { reason });
  },

  // ============================================
  // Event Rounds/Pools
  // ============================================

  /**
   * Get event rounds
   */
  async getRounds(eventId: string): Promise<GameRound[]> {
    return apiClient.get<GameRound[]>(`/events/${eventId}/rounds`);
  },

  /**
   * Generate bracket for an event
   */
  async generateBracket(eventId: string, data: {
    roundId: string;
    bracketType: 'single_elimination' | 'double_elimination';
    teamSeeds: { teamId: string; seed: number }[];
  }): Promise<{ bracketTree: unknown; gamesCreated: number }> {
    return apiClient.post(`/events/${eventId}/generate-bracket`, data);
  },

  /**
   * Get event bracket
   */
  async getBracket(eventId: string, roundId: string): Promise<unknown> {
    return apiClient.get(`/events/${eventId}/bracket`, { round_id: roundId });
  },

  /**
   * Get event standings
   */
  async getStandings(eventId: string): Promise<DivisionStandings> {
    return apiClient.get<DivisionStandings>(`/events/${eventId}/standings`);
  },

  // ============================================
  // Division Management
  // ============================================

  /**
   * Get divisions for an event
   */
  async getDivisions(eventId: string): Promise<Division[]> {
    return apiClient.get<Division[]>(`/events/${eventId}/divisions`);
  },

  /**
   * Create a division for an event
   */
  async createDivision(eventId: string, data: CreateDivisionRequest): Promise<Division> {
    return apiClient.post<Division>(`/events/${eventId}/divisions`, data);
  },

  /**
   * Update a division
   */
  async updateDivision(eventId: string, divisionId: string, data: UpdateDivisionRequest): Promise<Division> {
    return apiClient.put<Division>(`/events/${eventId}/divisions/${divisionId}`, data);
  },

  /**
   * Delete a division
   */
  async deleteDivision(eventId: string, divisionId: string): Promise<void> {
    return apiClient.delete(`/events/${eventId}/divisions/${divisionId}`);
  },

  // ============================================
  // Division Pool Management
  // ============================================

  /**
   * Get pools for a division
   */
  async getDivisionPools(divisionId: string): Promise<DivisionPool[]> {
    return apiClient.get<DivisionPool[]>(`/divisions/${divisionId}/pools`);
  },

  /**
   * Create a pool for a division
   */
  async createDivisionPool(divisionId: string, data: CreateDivisionPoolRequest): Promise<DivisionPool> {
    return apiClient.post<DivisionPool>(`/divisions/${divisionId}/pools`, data);
  },
};

export const divisionsApi = {
  /**
   * Get division standings
   */
  async getStandings(divisionId: string): Promise<DivisionStandings> {
    return apiClient.get<DivisionStandings>(`/divisions/${divisionId}/standings`);
  },

  /**
   * Update ranking criteria
   */
  async updateRankingCriteria(divisionId: string, criteria: {
    criteria: { field: string; order: 'asc' | 'desc' }[];
    autoAdvance: boolean;
    topNTeams: number;
  }): Promise<void> {
    return apiClient.put(`/divisions/${divisionId}/criteria`, criteria);
  },

  /**
   * Advance teams to next round
   */
  async advanceTeams(data: {
    fromDivisionId: string;
    toRoundId: string;
    teamCount: number;
  }): Promise<{ advancedTeams: string[] }> {
    return apiClient.post('/divisions/advance', data);
  },
};

export const roundsApi = {
  /**
   * Create a game round
   */
  async create(data: {
    eventId: string;
    name: string;
    roundType: 'pool' | 'bracket' | 'crossover' | 'placement';
    roundOrder: number;
    startDate?: string;
    endDate?: string;
  }): Promise<GameRound> {
    return apiClient.post<GameRound>('/rounds', data);
  },

  /**
   * Get a game round
   */
  async get(id: string): Promise<GameRound> {
    return apiClient.get<GameRound>(`/rounds/${id}`);
  },

  /**
   * Update a game round
   */
  async update(id: string, data: Partial<GameRound>): Promise<GameRound> {
    return apiClient.put<GameRound>(`/rounds/${id}`, data);
  },

  /**
   * Delete a game round
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/rounds/${id}`);
  },

  /**
   * Get round bracket
   */
  async getBracket(id: string): Promise<unknown> {
    return apiClient.get(`/rounds/${id}/bracket`);
  },
};

export default eventsApi;
