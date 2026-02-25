import type { Continent, Country, Field, Location, World } from '@/types';
import { apiClient } from './client';

export interface CreateLocationRequest {
    name: string;
    slug?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    countryId: string;
}

export interface CreateCountryRequest {
    name: string;
    slug: string;
    code: string;
    continentId: string;
}

export interface CreateContinentRequest {
    name: string;
    slug: string;
    worldId: string;
}

export interface CreateWorldRequest {
    name: string;
    slug: string;
}

export const geographicApi = {
    // Locations
    listLocations: async () => {
        return apiClient.get<Location[]>('/geographic/locations');
    },
    createLocation: async (data: CreateLocationRequest) => {
        return apiClient.post<Location>('/geographic/locations', data);
    },

    // Countries
    createCountry: async (data: CreateCountryRequest) => {
        return apiClient.post<Country>('/geographic/countries', data);
    },

    // Continents
    createContinent: async (data: CreateContinentRequest) => {
        return apiClient.post<Continent>('/geographic/continents', data);
    },

    // Fields
    listFields: async (locationId?: string) => {
        return apiClient.get<Field[]>(`/geographic/fields${locationId ? `?location_id=${locationId}` : ''}`);
    },
    createField: async (data: { name: string; location_id: string; capacity?: number; surface_type?: string; metadata?: any }) => {
        return apiClient.post<Field>('/geographic/fields', data);
    },

    // Worlds
    createWorld: async (data: CreateWorldRequest) => {
        return apiClient.post<World>('/geographic/worlds', data);
    },
};
