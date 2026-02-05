'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
  History,
  Radio,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import type { Event, EventCategory } from '@/types';
import type { ListEventsParams, TemporalFilter, EventSortField, SortOrder } from '@/lib/api/public';
import { useEventsQuery, useLiveEvents } from '@/lib/hooks';
import {
  EventGrid,
  EventFilters,
  EventCalendar,
  EventListSkeleton,
} from '@/components/features/events';
import {
  HeroWavePattern,
  FloatingOrbs,
  EmptyStateCalendar,
} from '@/components/illustrations';

type TabValue = 'upcoming' | 'past' | 'live';

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const tab = (searchParams.get('tab') as TabValue) || 'upcoming';

  // Filter state
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = React.useState<EventCategory[]>(
    (searchParams.get('category')?.split(',').filter(Boolean) as EventCategory[]) || []
  );
  const [continentId, setContinentId] = React.useState(searchParams.get('continent') || '');
  const [countryCode, setCountryCode] = React.useState(searchParams.get('country') || '');
  const [sortBy, setSortBy] = React.useState<EventSortField>(
    (searchParams.get('sortBy') as EventSortField) || 'start_date'
  );
  const [sortOrder, setSortOrder] = React.useState<SortOrder>(
    (searchParams.get('sortOrder') as SortOrder) || (tab === 'past' ? 'desc' : 'asc')
  );
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  // Map tab to temporal filter
  const getTemporalFilter = (tabValue: TabValue): TemporalFilter => {
    switch (tabValue) {
      case 'live':
        return 'live';
      case 'past':
        return 'past';
      case 'upcoming':
      default:
        return 'upcoming';
    }
  };

  // Build query params
  const queryParams: ListEventsParams = React.useMemo(() => ({
    temporal: getTemporalFilter(tab),
    sortBy,
    sortOrder,
    limit: 50,
    ...(search && { search }),
    ...(selectedCategories.length > 0 && { category: selectedCategories }),
    ...(countryCode && { country: countryCode }),
  }), [tab, sortBy, sortOrder, search, selectedCategories, countryCode]);

  // TanStack Query for events
  const {
    data: events = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEventsQuery(queryParams);

  // Get live count for badge
  const { data: liveEvents = [] } = useLiveEvents();
  const liveCount = tab !== 'live' ? liveEvents.length : 0;

  // Fetch ALL events for calendar view (not filtered by temporal)
  const { data: allEventsForCalendar = [] } = useEventsQuery({
    temporal: 'all',
    limit: 200,
    sortBy: 'start_date',
    sortOrder: 'asc',
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newTab = value as TabValue;
    const newSortOrder = newTab === 'past' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);

    const params = new URLSearchParams();
    if (newTab !== 'upcoming') params.set('tab', newTab);
    if (search) params.set('search', search);
    if (selectedCategories.length > 0) params.set('category', selectedCategories.join(','));
    if (continentId) params.set('continent', continentId);
    if (countryCode) params.set('country', countryCode);

    const queryString = params.toString();
    router.replace(`/discover${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  // Handler functions
  const handleSearchChange = React.useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleCategoriesChange = React.useCallback((categories: EventCategory[]) => {
    setSelectedCategories(categories);
  }, []);

  const handleContinentChange = React.useCallback((id: string) => {
    setContinentId(id);
    if (id === '') setCountryCode('');
  }, []);

  const handleCountryChange = React.useCallback((code: string) => {
    setCountryCode(code);
  }, []);

  const handleSortChange = React.useCallback((newSortBy: EventSortField, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="container mx-auto px-4 py-10 sm:py-14 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {/* Title section */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4" />
                Discover & Follow
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                Events &{' '}
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Tournaments
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Find tournaments, leagues, and competitions happening around you.
                Follow live scores, standings, and team updates in real-time.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex gap-6 text-center">
              <div className="px-4 py-2 rounded-xl bg-background/60 backdrop-blur border">
                <div className="text-2xl font-bold text-indigo-500">{events.length}</div>
                <div className="text-xs text-muted-foreground">Events Found</div>
              </div>
              {liveCount > 0 && (
                <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    <span className="text-2xl font-bold text-red-500">{liveCount}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Live Now</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Tabs and refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full sm:w-auto">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 h-12 p-1 bg-muted/50">
              <TabsTrigger
                value="upcoming"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Calendar className="h-4 w-4" />
                <span>Upcoming</span>
              </TabsTrigger>
              <TabsTrigger
                value="live"
                className="gap-2 relative data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Radio className="h-4 w-4" />
                <span>Live</span>
                {liveCount > 0 && tab !== 'live' && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                    {liveCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <History className="h-4 w-4" />
                <span>Past</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <EventCalendar
              events={allEventsForCalendar}
              open={calendarOpen}
              onOpenChange={setCalendarOpen}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar View</span>
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-muted/30 rounded-2xl border p-4 sm:p-6 mb-8">
          <EventFilters
            search={search}
            onSearchChange={handleSearchChange}
            selectedCategories={selectedCategories}
            onCategoriesChange={handleCategoriesChange}
            continentId={continentId}
            onContinentChange={handleContinentChange}
            countryCode={countryCode}
            onCountryChange={handleCountryChange}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Error State */}
        {isError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive">
                {error instanceof Error ? error.message : 'Failed to load events'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Events Grid */}
        {isLoading ? (
          <EventListSkeleton count={8} />
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 mx-auto mb-6 text-muted-foreground">
              <EmptyStateCalendar />
            </div>
            <h2 className="text-xl font-semibold mb-2">No events found</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {search || selectedCategories.length > 0 || countryCode
                ? 'Try adjusting your search or filters to find events'
                : tab === 'live'
                ? 'No events are currently live. Check upcoming events!'
                : tab === 'past'
                ? 'No past events match your criteria'
                : 'Check back later for upcoming events'}
            </p>
            {(search || selectedCategories.length > 0 || countryCode) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setSelectedCategories([]);
                  setContinentId('');
                  setCountryCode('');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{events.length}</span>{' '}
                {events.length === 1 ? 'event' : 'events'}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Sorted by {sortBy === 'start_date' ? 'date' : sortBy === 'name' ? 'name' : 'teams'}</span>
              </div>
            </div>
            <EventGrid events={events} />
          </>
        )}
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <EventListSkeleton count={8} />
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
