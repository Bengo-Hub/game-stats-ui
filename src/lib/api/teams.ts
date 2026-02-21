// Teams API module

import type { Player, SpiritScore, Team } from '@/types';
import { apiClient } from './client';

export interface TeamSpiritAverage {
  teamId: string;
  teamName: string;
  gamesScored: number;
  averageTotal: number;
  averageRulesKnowledge: number;
  averageFoulsBodyContact: number;
  averageFairMindedness: number;
  averageAttitude: number;
  averageCommunication: number;
  mvpNominationsCount?: number;
  spiritNominationsCount?: number;
}

// Team CRUD Types
export interface CreateTeamRequest {
  name: string;
  divisionPoolId: string;
  initialSeed?: number;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  locationName?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  divisionPoolId?: string;
  initialSeed?: number;
  finalPlacement?: number;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  contactEmail?: string;
  contactPhone?: string;
  locationName?: string;
}

export interface ListTeamsParams {
  divisionPoolId?: string;
  eventId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Player/Roster Types
export interface CreatePlayerRequest {
  name: string;
  jerseyNumber?: number;
  email?: string;
  phone?: string;
  isCaptain?: boolean;
  isSpiritCaptain?: boolean;
  position?: string;
}

export interface UpdatePlayerRequest {
  name?: string;
  jerseyNumber?: number;
  email?: string;
  phone?: string;
  isCaptain?: boolean;
  isSpiritCaptain?: boolean;
  position?: string;
}

export const teamsApi = {
  // ============================================
  // Team CRUD Operations
  // ============================================

  /**
   * List teams with filters
   */
  async list(params?: ListTeamsParams): Promise<Team[]> {
    return apiClient.get<Team[]>('/teams', params as Record<string, string | number | boolean | undefined>);
  },

  /**
   * Get a single team by ID
   */
  async get(id: string): Promise<Team> {
    return apiClient.get<Team>(`/teams/${id}`);
  },

  /**
   * Create a new team
   */
  async create(data: CreateTeamRequest): Promise<Team> {
    return apiClient.post<Team>('/teams', data);
  },

  /**
   * Update a team
   */
  async update(id: string, data: UpdateTeamRequest): Promise<Team> {
    return apiClient.put<Team>(`/teams/${id}`, data);
  },

  /**
   * Delete a team
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/teams/${id}`);
  },

  // ============================================
  // Roster Management
  // ============================================

  /**
   * Get team roster (players)
   */
  async getRoster(teamId: string): Promise<Player[]> {
    return apiClient.get<Player[]>(`/teams/${teamId}/players`);
  },

  /**
   * Add player to team
   */
  async addPlayer(teamId: string, data: CreatePlayerRequest): Promise<Player> {
    return apiClient.post<Player>(`/teams/${teamId}/players`, data);
  },

  /**
   * Update player
   */
  async updatePlayer(teamId: string, playerId: string, data: UpdatePlayerRequest): Promise<Player> {
    return apiClient.put<Player>(`/teams/${teamId}/players/${playerId}`, data);
  },

  /**
   * Remove player from team
   */
  async removePlayer(teamId: string, playerId: string): Promise<void> {
    return apiClient.delete(`/teams/${teamId}/players/${playerId}`);
  },

  /**
   * Bulk upload players for a team
   */
  async uploadRoster(teamId: string, file: File): Promise<{ count: number; errors?: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ count: number; errors?: string[] }>(`/teams/${teamId}/players/upload`, formData);
  },

  /**
   * Set team captain
   */
  async setCaptain(teamId: string, playerId: string): Promise<Team> {
    return apiClient.post<Team>(`/teams/${teamId}/captain`, { playerId });
  },

  /**
   * Set spirit captain
   */
  async setSpiritCaptain(teamId: string, playerId: string): Promise<Team> {
    return apiClient.post<Team>(`/teams/${teamId}/spirit-captain`, { playerId });
  },

  // ============================================
  // Spirit Scores
  // ============================================

  /**
   * Get team spirit average
   */
  async getSpiritAverage(teamId: string): Promise<TeamSpiritAverage> {
    return apiClient.get<TeamSpiritAverage>(`/teams/${teamId}/spirit-average`);
  },

  /**
   * Get team games
   */
  async getGames(teamId: string): Promise<unknown[]> {
    return apiClient.get(`/teams/${teamId}/games`);
  },
};

export const spiritScoresApi = {
  /**
   * Submit spirit score for a game
   */
  async submit(gameId: string, data: {
    teamId: string;
    scoredByTeamId: string;
    rulesKnowledge: number;
    foulsBodyContact: number;
    fairMindedness: number;
    attitude: number;
    communication: number;
    comments?: string;
  }): Promise<SpiritScore> {
    return apiClient.post<SpiritScore>(`/games/${gameId}/spirit`, data);
  },

  /**
   * Get spirit scores for a game
   */
  async getForGame(gameId: string): Promise<SpiritScore[]> {
    return apiClient.get<SpiritScore[]>(`/games/${gameId}/spirit`);
  },

  /**
   * Update spirit score
   */
  async update(gameId: string, spiritScoreId: string, data: {
    rulesKnowledge?: number;
    foulsBodyContact?: number;
    fairMindedness?: number;
    attitude?: number;
    communication?: number;
    comments?: string;
  }): Promise<SpiritScore> {
    return apiClient.put<SpiritScore>(`/games/${gameId}/spirit/${spiritScoreId}`, data);
  },
};

export default teamsApi;
