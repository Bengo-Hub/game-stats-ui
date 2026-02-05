// API Types for Game Stats UI

// ============================================
// Pagination Types
// ============================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export const DEFAULT_PAGE_SIZE = 50;

// ============================================
// User and Auth Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'event_manager' | 'team_manager' | 'scorekeeper' | 'spectator';
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresAt: string;
}

// ============================================
// Reference Types (for nested objects)
// ============================================

export interface RefDTO {
  id: string;
  name: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface FieldSummary {
  id: string;
  name: string;
}

export interface GameRoundSummary {
  id: string;
  name: string;
  roundType: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

// ============================================
// Event Types (Tournament)
// ============================================

export type EventCategory = 'outdoor' | 'hat' | 'beach' | 'indoor' | 'league';

export interface EventCountry {
  id: string;
  name: string;
  code: string;
}

export interface EventLocation {
  id: string;
  name: string;
  city?: string;
  country?: EventCountry;
}

export interface EventDivision {
  id: string;
  name: string;
  divisionType: string;
  teamsCount: number;
}

export interface TeamPreview {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  year: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'canceled';
  description?: string;
  categories?: EventCategory[];
  logoUrl?: string;
  bannerUrl?: string;
  teamsCount: number;
  gamesCount: number;
  discipline?: RefDTO;
  location?: EventLocation;
  divisions?: EventDivision[];
  teamPreview?: TeamPreview[];
}

// ============================================
// Game Types
// ============================================

export interface Game {
  id: string;
  name: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  allocatedTimeMinutes: number;
  stoppageTimeSeconds: number;
  status: 'scheduled' | 'in_progress' | 'finished' | 'ended' | 'canceled';
  homeTeamScore: number;
  awayTeamScore: number;
  firstPullBy?: string;
  version: number;
  metadata?: Record<string, unknown>;
  homeTeam?: TeamSummary;
  awayTeam?: TeamSummary;
  fieldLocation?: FieldSummary;
  gameRound?: GameRoundSummary;
  scorekeeper?: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface GameEvent {
  id: string;
  eventType: string;
  minute: number;
  second: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface GameTimeline {
  events: GameEvent[];
}

// ============================================
// Player Types
// ============================================

export interface Player {
  id: string;
  name: string;
  gender: string;
  jerseyNumber?: number;
  profileImageUrl?: string;
  isCaptain: boolean;
  isSpiritCaptain: boolean;
}

// ============================================
// Team Types
// ============================================

export interface Team {
  id: string;
  name: string;
  initialSeed?: number;
  finalPlacement?: number;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  metadata?: Record<string, unknown>;
  divisionPoolId?: string;
  homeLocationId?: string;
  locationName?: string;
  divisionName?: string;
  players?: Player[];
  captain?: Player;
  spiritCaptain?: Player;
  playersCount?: number;
}

export interface PlayerStat {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  goals: number;
  assists: number;
  gamesPlayed: number;
}

// ============================================
// Division/Pool Types
// ============================================

export interface DivisionPool {
  id: string;
  name: string;
  eventId: string;
  roundType: string;
  roundNumber?: number;
  startDate?: string;
  endDate?: string;
  gamesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RankingCriteria {
  criteria: { field: string; order: 'asc' | 'desc' }[];
  autoAdvance: boolean;
  topNTeams: number;
}

// ============================================
// Spirit Score Types
// ============================================

export interface SpiritScore {
  id: string;
  gameId: string;
  scoredByTeam?: TeamSummary;
  team?: TeamSummary;
  submittedBy?: UserSummary;
  rulesKnowledge: number;
  foulsBodyContact: number;
  fairMindedness: number;
  attitude: number;
  communication: number;
  totalScore: number;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpiritBreakdown {
  rulesKnowledge: number;
  foulsBodyContact: number;
  fairMindedness: number;
  attitude: number;
  communication: number;
}

export interface GameSpiritScore {
  gameId: string;
  opponentId?: string;
  opponentName?: string;
  score: number;
  breakdown?: SpiritBreakdown;
}

export interface TeamSpiritAverage {
  teamId: string;
  teamName: string;
  averageScore: number;
  gamesPlayed: number;
  gamesRated?: number;
  breakdown?: SpiritBreakdown;
  gameScores?: GameSpiritScore[];
}

// ============================================
// Standings Types
// ============================================

export interface TeamStanding {
  teamId: string;
  teamName: string;
  rank: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  spiritAverage: number;
}

export interface DivisionStandings {
  divisionId: string;
  divisionName: string;
  standings: TeamStanding[];
  updatedAt: string;
}

// ============================================
// Bracket Types
// ============================================

export interface BracketNode {
  id: string;
  gameId?: string;
  game?: Game;
  round: number;
  position: number;
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore?: number;
  awayScore?: number;
  status: 'pending' | 'in_progress' | 'completed';
  children?: BracketNode[];
}

export interface Bracket {
  eventId: string;
  roundId: string;
  bracketType: 'single_elimination' | 'double_elimination';
  totalRounds: number;
  totalGames: number;
  bracketTree: BracketNode;
  updatedAt: string;
}

// ============================================
// Geographic Types
// ============================================

export interface Field {
  id: string;
  name: string;
  locationId: string;
  fieldNumber?: number;
  capacity?: number;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
}

export interface Continent {
  id: string;
  name: string;
  slug: string;
  worldId: string;
}

export interface World {
  id: string;
  name: string;
  slug: string;
}

// ============================================
// Analytics Types
// ============================================

export interface EventStatistics {
  eventId: string;
  totalGames: number;
  completedGames: number;
  scheduledGames: number;
  inProgressGames: number;
  totalTeams: number;
  totalPlayers: number;
  averageSpiritScore: number;
  topScorer?: PlayerStat;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// Scoring Types
// ============================================

export interface Scoring {
  id: string;
  playerId: string;
  playerName?: string;
  playerNumber?: number;
  teamId?: string;
  teamName?: string;
  goals: number;
  assists: number;
  blocks: number;
  turns: number;
  createdAt: string;
  updatedAt: string;
}
