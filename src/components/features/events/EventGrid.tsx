'use client';

import { cn } from '@/lib/utils';
import type { Event } from '@/types';
import { EventCard } from './EventCard';

interface EventGridProps {
  events: Event[];
  className?: string;
}

export function EventGrid({ events, className }: EventGridProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'grid gap-4 sm:gap-6',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
