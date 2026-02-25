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

// Assuming these new interfaces are intended to be added or already exist elsewhere.
// For the purpose of making the provided Code Edit syntactically correct,
// we'll define them as simple types matching the previous return type.
export interface MassImportPlayersResponse {
    count: number;
}

export interface BulkTransferResponse {
    count: number;
}

export const bulkApi = {
    /**
     * Bulk transfer players between teams
     */
    async transferPlayers(data: BulkTransferRequest): Promise<BulkTransferResponse> {
        return apiClient.post<BulkTransferResponse>('/bulk/players/transfer', data);
    },

    /**
     * Mass import players from CSV
     */
    async importPlayers(data: MassImportPlayersRequest): Promise<MassImportPlayersResponse> {
        return apiClient.post<MassImportPlayersResponse>('/bulk/players/import', data);
    },
};

export default bulkApi;
