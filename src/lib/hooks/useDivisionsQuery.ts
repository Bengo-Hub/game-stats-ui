import { eventsApi } from '@/lib/api/events';
import { useQuery } from '@tanstack/react-query';

export const divisionKeys = {
    all: ['divisions'] as const,
    byEvent: (eventId: string) => [...divisionKeys.all, 'event', eventId] as const,
    detail: (id: string) => [...divisionKeys.all, 'detail', id] as const,
};

export function useDivisionsQuery(eventId: string | undefined) {
    return useQuery({
        queryKey: divisionKeys.byEvent(eventId || ''),
        queryFn: () => eventsApi.getDivisions(eventId!),
        enabled: !!eventId,
        staleTime: 1000 * 60 * 5,
    });
}
