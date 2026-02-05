'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Event, EventCategory } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Check, Square } from 'lucide-react';
import { EventCategoryBadge } from './EventCategoryBadge';
import { getCountryFlag } from './EventFilters';

interface EventCalendarProps {
  events: Event[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

// Get category color for dot
function getCategoryDotColor(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    outdoor: 'bg-emerald-500',
    hat: 'bg-amber-500',
    beach: 'bg-sky-500',
    indoor: 'bg-violet-500',
    league: 'bg-rose-500',
  };
  return colors[category] || 'bg-indigo-500';
}

// Get days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Format date as YYYY-MM-DD
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Parse date string to Date
function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

// Check if date is today
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Group events by date
function groupEventsByDate(events: Event[]): Map<string, Event[]> {
  const grouped = new Map<string, Event[]>();

  events.forEach((event) => {
    const startDate = parseDate(event.startDate);
    const endDate = event.endDate ? parseDate(event.endDate) : startDate;

    // Add event to each day it spans
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = formatDateKey(current);
      const existing = grouped.get(key) || [];
      if (!existing.find(e => e.id === event.id)) {
        existing.push(event);
      }
      grouped.set(key, existing);
      current.setDate(current.getDate() + 1);
    }
  });

  return grouped;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function EventCalendar({ events, open, onOpenChange, trigger }: EventCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
  const [currentYear, setCurrentYear] = React.useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = React.useState<string | null>(formatDateKey(today));
  const [hideLeagues, setHideLeagues] = React.useState(false);

  // Filter events if hiding leagues
  const filteredEvents = React.useMemo(() => {
    if (!hideLeagues) return events;
    return events.filter(e => !e.categories?.includes('league'));
  }, [events, hideLeagues]);

  // Group events by date
  const eventsByDate = React.useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  // Get events for selected date
  const selectedDateEvents = selectedDate ? (eventsByDate.get(selectedDate) || []) : [];

  // Navigation
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(formatDateKey(today));
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  // Adjust to start week on Monday (0 = Monday)
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const calendarDays: (number | null)[] = [];

  // Empty cells before first day
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg p-0" showCloseButton={false}>
        <DialogHeader className="p-4 pb-0 flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">Event Calendar</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange?.(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-4 pt-2 space-y-4">
          {/* Hide leagues toggle */}
          <button
            onClick={() => setHideLeagues(!hideLeagues)}
            className="flex items-center justify-end gap-2 ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className={cn(
              'w-4 h-4 rounded border flex items-center justify-center transition-colors',
              hideLeagues ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-muted-foreground'
            )}>
              {hideLeagues && <Check className="h-3 w-3" />}
            </span>
            Hide Leagues
          </button>

          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {MONTHS[currentMonth]} {currentYear}
              </h3>
              <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
                Today
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 bg-muted/50">
              {WEEKDAYS.map((day, i) => (
                <div key={i} className="p-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                if (day === null) {
                  return <div key={`empty-${i}`} className="p-2 min-h-[60px] bg-muted/20" />;
                }

                const date = new Date(currentYear, currentMonth, day);
                const dateKey = formatDateKey(date);
                const dayEvents = eventsByDate.get(dateKey) || [];
                const isTodayDate = isToday(date);
                const isSelected = selectedDate === dateKey;

                // Get unique categories for dots (max 4)
                const categories = [...new Set(
                  dayEvents.flatMap(e => e.categories || [])
                )].slice(0, 4);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateKey)}
                    className={cn(
                      'p-2 min-h-[60px] text-left border-t hover:bg-muted/50 transition-colors relative',
                      isSelected && 'bg-indigo-50 dark:bg-indigo-950/30',
                      isTodayDate && 'font-bold'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm',
                        isTodayDate && 'bg-indigo-500 text-white',
                        isSelected && !isTodayDate && 'bg-muted'
                      )}
                    >
                      {day}
                    </span>

                    {/* Event dots */}
                    {categories.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap">
                        {categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className={cn('w-2 h-2 rounded-full', getCategoryDotColor(cat))}
                          />
                        ))}
                        {dayEvents.length > 4 && (
                          <span className="text-[10px] text-muted-foreground ml-0.5">
                            +{dayEvents.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected date events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                {selectedDate === formatDateKey(today) ? 'TODAY' : selectedDate?.split('-').reverse().join(' ')}
              </h4>
              <span className="text-sm text-muted-foreground">
                {selectedDateEvents.length} Event{selectedDateEvents.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedDateEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No events on this date
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedDateEvents.map((event) => (
                  <a
                    key={event.id}
                    href={`/discover/${event.slug || event.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm truncate">{event.name}</h5>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.startDate).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          {event.endDate && event.endDate !== event.startDate && (
                            <> - {new Date(event.endDate).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}</>
                          )}
                        </p>
                      </div>
                      {event.location?.country?.code && (
                        <span className="text-base">{getCountryFlag(event.location.country.code)}</span>
                      )}
                    </div>
                    {event.categories && event.categories.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {event.categories.map((cat) => (
                          <EventCategoryBadge key={cat} category={cat} size="sm" />
                        ))}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
