import { geographicApi } from '@/lib/api/geographic';
import { publicApi } from '@/lib/api/public';
import type { Country } from '@/types';
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
};

// Hooks
export function useWorlds() {
  return useQuery({
    queryKey: geographicKeys.worlds(),
    queryFn: () => publicApi.listWorlds(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - geographic data rarely changes
  });
}

export function useContinents() {
  return useQuery({
    queryKey: geographicKeys.continents(),
    queryFn: () => publicApi.listContinents(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useContinent(continentId: string | undefined) {
  return useQuery({
    queryKey: geographicKeys.continent(continentId || ''),
    queryFn: () => publicApi.getContinent(continentId!),
    enabled: !!continentId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useCountries(continentId?: string) {
  return useQuery({
    queryKey: geographicKeys.countries(continentId),
    queryFn: () => publicApi.listCountries(continentId),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

export function useLocations() {
  return useQuery({
    queryKey: geographicKeys.locations(),
    queryFn: () => geographicApi.listLocations(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Export Country type for convenience
export type { Country };

