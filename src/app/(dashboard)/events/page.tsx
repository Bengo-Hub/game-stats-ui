'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CalendarDays,
  Plus,
  MapPin,
  Users,
  Trophy,
  RefreshCw,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Gamepad2,
} from 'lucide-react';
import { useEventsQuery, eventKeys } from '@/lib/hooks/useEventsQuery';
import { usePaginationState, DEFAULT_PAGE_SIZE } from '@/lib/hooks/usePagination';
import { usePermissions } from '@/lib/hooks/usePermission';
import { useQueryClient } from '@tanstack/react-query';
import type { Event, EventCategory } from '@/types';
import type { TemporalFilter, EventSortField, SortOrder } from '@/lib/api/public';
import { EventCategoryBadge, getCountryFlag } from '@/components/features/events';
import { cn } from '@/lib/utils';

type EventStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'canceled';
type ViewMode = 'grid' | 'list';

const EVENT_STATUSES: { value: EventStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
];

const TEMPORAL_FILTERS: { value: TemporalFilter | 'all'; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live Now' },
  { value: 'past', label: 'Past' },
];

const SORT_OPTIONS: { value: EventSortField; label: string }[] = [
  { value: 'start_date', label: 'Start Date' },
  { value: 'name', label: 'Name' },
  { value: 'teams_count', label: 'Team Count' },
];

const CATEGORIES: EventCategory[] = ['outdoor', 'indoor', 'beach', 'hat', 'league'];

export default function EventsPage() {
  const queryClient = useQueryClient();
  const { can, canManage } = usePermissions();
  const pagination = usePaginationState(DEFAULT_PAGE_SIZE);

  // Filter state
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [status, setStatus] = React.useState<EventStatus | 'all'>('all');
  const [temporal, setTemporal] = React.useState<TemporalFilter | 'all'>('all');
  const [selectedCategories, setSelectedCategories] = React.useState<EventCategory[]>([]);
  const [sortBy, setSortBy] = React.useState<EventSortField>('start_date');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = React.useState(false);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      pagination.reset(); // Reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pagination]);

  // Reset pagination when filters change
  React.useEffect(() => {
    pagination.reset();
  }, [status, temporal, selectedCategories, sortBy, sortOrder]);

  // Build query params
  const queryParams = React.useMemo(() => ({
    ...(status !== 'all' && { status }),
    ...(temporal !== 'all' && { temporal }),
    ...(selectedCategories.length > 0 && { category: selectedCategories }),
    ...(debouncedSearch && { search: debouncedSearch }),
    sortBy,
    sortOrder,
    limit: pagination.pageSize,
    offset: pagination.offset,
  }), [status, temporal, selectedCategories, debouncedSearch, sortBy, sortOrder, pagination.pageSize, pagination.offset]);

  // Fetch events using TanStack Query
  const {
    data: events = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useEventsQuery(queryParams);

  // Calculate total pages (estimate based on current page results)
  const hasMorePages = events.length === pagination.pageSize;
  const totalPages = hasMorePages ? pagination.page + 1 : pagination.page;

  // Refresh events
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: eventKeys.all });
  };

  // Format date range
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (start === end) {
      return `${startDate.toLocaleDateString('en-US', options)}, ${startDate.getFullYear()}`;
    }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${endDate.getFullYear()}`;
  };

  // Toggle category filter
  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('all');
    setTemporal('all');
    setSelectedCategories([]);
    setSortBy('start_date');
    setSortOrder('desc');
  };

  // Check if any filters are active
  const hasActiveFilters = status !== 'all' || temporal !== 'all' || selectedCategories.length > 0 || debouncedSearch;

  // Handle delete event (placeholder - will be implemented with CRUD API)
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    // TODO: Implement with authenticated API
    console.log('Delete event:', eventId);
  };

  // Permission checks
  const canCreateEvents = can('manage_events');
  const canEditEvents = can('manage_events');
  const canDeleteEvents = can('manage_events');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader title="Events" description="Manage tournaments and competitions">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
          {canCreateEvents && (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Create Event</span>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Search and Filters Bar */}
      <div className="space-y-4">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search events..."
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="sm"
              className="sm:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {(status !== 'all' ? 1 : 0) + (temporal !== 'all' ? 1 : 0) + selectedCategories.length}
                </span>
              )}
            </Button>

            {/* View mode toggle */}
            <div className="hidden sm:flex border rounded-lg p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Row - Desktop always visible, Mobile collapsible */}
        <div className={cn(
          'flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center',
          !showFilters && 'hidden sm:flex'
        )}>
          {/* Status filter */}
          <Select value={status} onValueChange={(v) => setStatus(v as EventStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Temporal filter */}
          <Select value={temporal} onValueChange={(v) => setTemporal(v as TemporalFilter | 'all')}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              {TEMPORAL_FILTERS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as EventSortField)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  selectedCategories.includes(cat)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load events'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {/* Results info */}
      {!isLoading && events.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{events.length}</span> events
            {pagination.page > 1 && ` (Page ${pagination.page})`}
          </span>
          {isFetching && <span className="text-xs">Updating...</span>}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className={cn(
          'gap-4',
          viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'
        )}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className={viewMode === 'grid' ? 'h-56' : 'h-24'} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" />}
          title="No events found"
          description={hasActiveFilters ? 'Try adjusting your filters' : 'Create your first event to get started'}
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreateEvents ? (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventGridCard
              key={event.id}
              event={event}
              formatDateRange={formatDateRange}
              canEdit={canEditEvents}
              canDelete={canDeleteEvents}
              onDelete={handleDeleteEvent}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="flex flex-col gap-2">
          {events.map((event) => (
            <EventListCard
              key={event.id}
              event={event}
              formatDateRange={formatDateRange}
              canEdit={canEditEvents}
              canDelete={canDeleteEvents}
              onDelete={handleDeleteEvent}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {events.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page:</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) => pagination.setPageSize(Number(v))}
            >
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(size => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={totalPages}
            onPageChange={pagination.setPage}
          />
        </div>
      )}
    </div>
  );
}

// Grid Card Component
interface EventCardProps {
  event: Event;
  formatDateRange: (start: string, end: string) => string;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

function EventGridCard({ event, formatDateRange, canEdit, canDelete, onDelete }: EventCardProps) {
  return (
    <Card className="h-full hover:border-primary/50 transition-colors group relative">
      <CardContent className="p-5">
        {/* Actions Menu */}
        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/discover/${event.slug || event.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-start justify-between mb-3">
          <StatusBadge status={event.status} />
          {event.categories && event.categories.length > 0 && (
            <div className="flex gap-1">
              {event.categories.slice(0, 2).map(cat => (
                <EventCategoryBadge key={cat} category={cat} size="sm" showIcon={false} />
              ))}
            </div>
          )}
        </div>

        <Link href={`/discover/${event.slug || event.id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {event.name}
          </h3>
        </Link>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 flex-shrink-0" />
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>
                {event.location.city || event.location.name}
                {event.location.country?.code && (
                  <span className="ml-1">{getCountryFlag(event.location.country.code)}</span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{event.teamsCount}</span>
            <span className="text-muted-foreground">teams</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{event.gamesCount}</span>
            <span className="text-muted-foreground">games</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// List Card Component
function EventListCard({ event, formatDateRange, canEdit, canDelete, onDelete }: EventCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors group">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={event.status} />
            {event.categories?.slice(0, 2).map(cat => (
              <EventCategoryBadge key={cat} category={cat} size="sm" showIcon={false} />
            ))}
          </div>
          <Link href={`/discover/${event.slug || event.id}`}>
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {event.name}
            </h3>
          </Link>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateRange(event.startDate, event.endDate)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location.city || event.location.name}
                {event.location.country?.code && ` ${getCountryFlag(event.location.country.code)}`}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{event.teamsCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{event.gamesCount}</span>
          </div>
        </div>

        {/* Actions */}
        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/discover/${event.slug || event.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
}
