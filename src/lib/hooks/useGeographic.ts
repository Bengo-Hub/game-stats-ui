import { geographicApi } from '@/lib/api/geographic';
import { publicApi } from '@/lib/api/public';
import type { Continent, Country, Field, World } from '@/types';
import { useQuery } from '@tanstack/react-query';

// Query keys
export const geographicKeys = {
  all: ['geographic'] as const,
  worlds: () => [...geographicKeys.all, 'worlds'] as const,
  continents: () => [...geographicKeys.all, 'continents'] as const,
  continent: (id: string) => [...geographicKeys.all, 'continent', id] as const,
  countries: (continentId?: string) =>
    continentId
      ? ([...geographicKeys.all, 'countries', continentId] as const)
      : ([...geographicKeys.all, 'countries'] as const),
  locations: () => [...geographicKeys.all, 'locations'] as const,
  fields: (locationId?: string) =>
    locationId
      ? ([...geographicKeys.all, 'fields', locationId] as const)
      : ([...geographicKeys.all, 'fields'] as const),
};

// Hooks
export function useWorlds() {
  return useQuery<World[]>({
    queryKey: geographicKeys.worlds(),
    queryFn: () => publicApi.listWorlds(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - geographic data rarely changes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useContinents() {
  return useQuery<Continent[]>({
    queryKey: geographicKeys.continents(),
    queryFn: () => publicApi.listContinents(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useContinent(continentId: string | undefined) {
  return useQuery<Continent & { countries?: Country[] }>({
    queryKey: geographicKeys.continent(continentId || ''),
    queryFn: () => publicApi.getContinent(continentId!),
    enabled: !!continentId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useCountries(continentId?: string) {
  return useQuery<Country[]>({
    queryKey: geographicKeys.countries(continentId),
    queryFn: () => publicApi.listCountries(continentId),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useLocations() {
  return useQuery({
    queryKey: geographicKeys.locations(),
    queryFn: () => geographicApi.listLocations(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFields(locationId?: string) {
  return useQuery<Field[]>({
    queryKey: geographicKeys.fields(locationId),
    queryFn: () => geographicApi.listFields(locationId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Export Country type for convenience
export type { Country };

