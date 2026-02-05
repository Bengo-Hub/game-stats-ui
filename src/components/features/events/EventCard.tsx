'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Event } from '@/types';
import { format, parseISO } from 'date-fns';
import { Calendar, Users, Gamepad2 } from 'lucide-react';
import { EventCategoryBadge, getCategoryConfig } from './EventCategoryBadge';
import { EventLocationBadge } from './EventLocationBadge';
import { TeamAvatarStack } from './TeamAvatarStack';

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const primaryCategory = event.categories?.[0];
  const categoryConfig = primaryCategory ? getCategoryConfig(primaryCategory) : null;

  // Determine status colors
  const isLive = event.status === 'in_progress';
  const isPast = event.status === 'completed';
  const isUpcoming = event.status === 'published';

  return (
    <Link
      href={`/discover/${event.slug || event.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {/* Header with gradient based on primary category */}
      <div
        className={cn(
          'relative h-24 bg-gradient-to-br',
          categoryConfig
            ? `from-${primaryCategory === 'outdoor' ? 'emerald' : primaryCategory === 'hat' ? 'amber' : primaryCategory === 'beach' ? 'sky' : primaryCategory === 'indoor' ? 'violet' : 'rose'}-500/20 to-${primaryCategory === 'outdoor' ? 'emerald' : primaryCategory === 'hat' ? 'amber' : primaryCategory === 'beach' ? 'sky' : primaryCategory === 'indoor' ? 'violet' : 'rose'}-600/10`
            : 'from-primary/20 to-primary/5'
        )}
        style={
          categoryConfig
            ? {
                background: `linear-gradient(135deg, ${
                  primaryCategory === 'outdoor'
                    ? 'rgb(16 185 129 / 0.2), rgb(5 150 105 / 0.1)'
                    : primaryCategory === 'hat'
                    ? 'rgb(245 158 11 / 0.2), rgb(217 119 6 / 0.1)'
                    : primaryCategory === 'beach'
                    ? 'rgb(14 165 233 / 0.2), rgb(2 132 199 / 0.1)'
                    : primaryCategory === 'indoor'
                    ? 'rgb(139 92 246 / 0.2), rgb(124 58 237 / 0.1)'
                    : 'rgb(244 63 94 / 0.2), rgb(225 29 72 / 0.1)'
                })`,
              }
            : undefined
        }
      >
        {/* Event logo or banner */}
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        ) : event.logoUrl ? (
          <div className="absolute right-3 top-3 h-12 w-12 rounded-lg bg-background/80 p-1.5 backdrop-blur-sm">
            <img
              src={event.logoUrl}
              alt={event.name}
              className="h-full w-full object-contain"
            />
          </div>
        ) : null}

        {/* Date badge */}
        <div className="absolute left-3 top-3 flex flex-col items-center rounded-lg bg-background/90 px-2.5 py-1.5 backdrop-blur-sm shadow-sm">
          <span className="text-2xl font-bold leading-none">{format(startDate, 'd')}</span>
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {format(startDate, 'MMM')}
          </span>
        </div>

        {/* Live indicator */}
        {isLive && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
            </span>
            LIVE
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title and discipline */}
        <div>
          <h3 className="font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {event.name}
          </h3>
          {event.discipline && (
            <p className="mt-0.5 text-sm text-muted-foreground">{event.discipline.name}</p>
          )}
        </div>

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {event.categories.map((cat) => (
              <EventCategoryBadge key={cat} category={cat} size="sm" />
            ))}
          </div>
        )}

        {/* Location - Colorful badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/50 dark:border-indigo-800/30">
          <EventLocationBadge
            location={event.location}
            className="text-indigo-700 dark:text-indigo-300"
            iconClassName="text-indigo-500 dark:text-indigo-400"
          />
        </div>

        {/* Date range - Colorful badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30">
          <Calendar className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {format(startDate, 'MMM d')}
            {startDate.getTime() !== endDate.getTime() && ` - ${format(endDate, 'MMM d, yyyy')}`}
            {startDate.getTime() === endDate.getTime() && `, ${format(startDate, 'yyyy')}`}
          </span>
        </div>

        {/* Stats row - Colorful grid */}
        <div className="mt-auto grid grid-cols-2 gap-2 border-t pt-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{event.teamsCount}</span>
            <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">teams</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/50 dark:border-blue-800/30">
            <Gamepad2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{event.gamesCount}</span>
            <span className="text-xs text-blue-600/80 dark:text-blue-400/80">games</span>
          </div>
        </div>

        {/* Team preview - Enhanced with border */}
        {event.teamPreview && event.teamPreview.length > 0 && (
          <div className="pt-3 border-t border-dashed">
            <TeamAvatarStack
              teams={event.teamPreview}
              totalCount={event.teamsCount}
              size="sm"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
