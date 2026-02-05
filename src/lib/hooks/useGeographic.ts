// Geographic hooks using TanStack Query
import { useQuery } from '@tanstack/react-query';
import { publicApi, type Country } from '@/lib/api/public';
import type { Continent, World } from '@/types';

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
};

// Hooks
export function useWorlds() {
  return useQuery({
    queryKey: geographicKeys.worlds(),
    queryFn: () => publicApi.listWorlds(),
    staleTime: 1000 * 60 * 60, // 1 hour - geographic data rarely changes
  });
}

export function useContinents() {
  return useQuery({
    queryKey: geographicKeys.continents(),
    queryFn: () => publicApi.listContinents(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useContinent(continentId: string | undefined) {
  return useQuery({
    queryKey: geographicKeys.continent(continentId || ''),
    queryFn: () => publicApi.getContinent(continentId!),
    enabled: !!continentId,
    staleTime: 1000 * 60 * 60,
  });
}

export function useCountries(continentId?: string) {
  return useQuery({
    queryKey: geographicKeys.countries(continentId),
    queryFn: () => publicApi.listCountries(continentId),
    staleTime: 1000 * 60 * 60,
  });
}

// Export Country type for convenience
export type { Country };
