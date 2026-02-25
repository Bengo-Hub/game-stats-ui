import { eventsApi } from '@/lib/api/events';
import { useQuery } from '@tanstack/react-query';

export const roundKeys = {
    all: ['rounds'] as const,
    lists: (eventId: string) => [...roundKeys.all, 'list', eventId] as const,
    detail: (id: string) => [...roundKeys.all, 'detail', id] as const,
};

export function useRoundsQuery(eventId: string) {
    return useQuery({
        queryKey: roundKeys.lists(eventId),
        queryFn: () => eventsApi.getRounds(eventId),
        enabled: !!eventId,
        staleTime: 5 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}
