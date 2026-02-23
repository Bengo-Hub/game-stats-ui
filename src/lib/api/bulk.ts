// Bulk Operations API module

import { apiClient } from './client';

export interface PlayerTransfer {
    playerId: string;
    toTeamId: string;
    role?: string;
    status?: string;
}

export interface BulkTransferRequest {
    eventId: string;
    transfers: PlayerTransfer[];
}

export interface ImportPlayer {
    name: string;
    jerseyNumber?: number;
    email?: string;
    phone?: string;
    teamId?: string;
}

export interface MassImportPlayersRequest {
    eventId: string;
    players: ImportPlayer[];
}

export const bulkApi = {
    /**
     * Bulk transfer players between teams
     */
    async transferPlayers(data: BulkTransferRequest): Promise<{ count: number }> {
        return apiClient.post<{ count: number }>('/bulk/players/transfer', data);
    },

    /**
     * Mass import players from structured data
     */
    async importPlayers(data: MassImportPlayersRequest): Promise<{ count: number }> {
        return apiClient.post<{ count: number }>('/bulk/players/import', data);
    },
};

export default bulkApi;
