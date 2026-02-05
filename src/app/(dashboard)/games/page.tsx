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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Plus,
  Calendar,
  RefreshCw,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Filter,
  X,
  MapPin,
  Clock,
  Radio,
  XCircle,
} from 'lucide-react';
import { useGamesQuery, gameKeys } from '@/lib/hooks/useGamesQuery';
import { usePaginationState, DEFAULT_PAGE_SIZE } from '@/lib/hooks/usePagination';
import { usePermissions } from '@/lib/hooks/usePermission';
import { useQueryClient } from '@tanstack/react-query';
import type { Game } from '@/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

type GameStatus = 'scheduled' | 'in_progress' | 'finished' | 'ended' | 'canceled';
type ViewMode = 'table' | 'cards';

const GAME_STATUSES: { value: GameStatus | 'all'; label: string; icon?: React.ReactNode }[] = [
  { value: 'all', label: 'All Games' },
  { value: 'scheduled', label: 'Scheduled', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'in_progress', label: 'Live', icon: <Radio className="h-3.5 w-3.5 text-red-500" /> },
  { value: 'finished', label: 'Finished', icon: <Trophy className="h-3.5 w-3.5" /> },
  { value: 'canceled', label: 'Canceled', icon: <XCircle className="h-3.5 w-3.5" /> },
];

export default function GamesPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const pagination = usePaginationState(DEFAULT_PAGE_SIZE);

  // Filter state
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [status, setStatus] = React.useState<GameStatus | 'all'>('all');
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [showFilters, setShowFilters] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState<'today' | 'week' | 'all'>('all');

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      pagination.reset();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pagination]);

  // Reset pagination when filters change
  React.useEffect(() => {
    pagination.reset();
  }, [status, dateFilter]);

  // Calculate date range for filter
  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      return { startDate: start, endDate: end };
    }
    if (dateFilter === 'week') {
      const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      return { startDate: start, endDate: end };
    }
    return {};
  };

  // Build query params
  const queryParams = React.useMemo(() => {
    const dateRange = getDateRange();
    return {
      ...(status !== 'all' && { status }),
      ...dateRange,
      limit: pagination.pageSize,
      offset: pagination.offset,
    };
  }, [status, dateFilter, pagination.pageSize, pagination.offset]);

  // Fetch games using TanStack Query
  const {
    data: allGames = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useGamesQuery(queryParams);

  // Client-side search filter (since API might not support search)
  const games = React.useMemo(() => {
    if (!debouncedSearch) return allGames;
    const searchLower = debouncedSearch.toLowerCase();
    return allGames.filter(
      (game) =>
        game.homeTeam?.name?.toLowerCase().includes(searchLower) ||
        game.awayTeam?.name?.toLowerCase().includes(searchLower) ||
        game.fieldLocation?.name?.toLowerCase().includes(searchLower)
    );
  }, [allGames, debouncedSearch]);

  // Calculate total pages
  const hasMorePages = allGames.length === pagination.pageSize;
  const totalPages = hasMorePages ? pagination.page + 1 : pagination.page;

  // Live games count
  const liveCount = allGames.filter(g => g.status === 'in_progress').length;

  // Refresh games
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: gameKeys.all });
  };

  // Format time
  const formatTime = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, h:mm a');
    } catch {
      return dateStr;
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('all');
    setDateFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = status !== 'all' || dateFilter !== 'all' || debouncedSearch;

  // Handle delete game
  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to cancel this game?')) return;
    // TODO: Implement with authenticated API
    console.log('Cancel game:', gameId);
  };

  // Permission checks
  const canScheduleGames = can('manage_games');
  const canEditGames = can('manage_games');
  const canCancelGames = can('manage_games');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader title="Games" description="Manage and track all games">
        <div className="flex items-center gap-2">
          {liveCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">{liveCount} Live</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
          {canScheduleGames && (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Schedule Game</span>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <Tabs value={status} onValueChange={(v) => setStatus(v as GameStatus | 'all')} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-5 sm:w-auto sm:inline-flex h-10">
              {GAME_STATUSES.map(s => (
                <TabsTrigger key={s.value} value={s.value} className="gap-1.5 text-xs sm:text-sm">
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden">{s.value === 'all' ? 'All' : s.value === 'in_progress' ? 'Live' : s.label.slice(0, 4)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

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
            </Button>

            {/* View mode toggle */}
            <div className="hidden sm:flex border rounded-lg p-0.5">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setViewMode('cards')}
                aria-label="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search and additional filters */}
        <div className={cn(
          'flex flex-col sm:flex-row gap-3 sm:items-center',
          !showFilters && 'hidden sm:flex'
        )}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search teams or fields..."
            className="flex-1 max-w-md"
          />

          {/* Date filter */}
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as 'today' | 'week' | 'all')}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This week</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear
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
              {error instanceof Error ? error.message : 'Failed to load games'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {/* Results info */}
      {!isLoading && games.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{games.length}</span> games
            {pagination.page > 1 && ` (Page ${pagination.page})`}
          </span>
          {isFetching && <span className="text-xs">Updating...</span>}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : games.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-12 w-12" />}
          title="No games found"
          description={hasActiveFilters ? 'Try adjusting your filters' : 'Schedule your first game to get started'}
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canScheduleGames ? (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Game
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead className="hidden md:table-cell">Time</TableHead>
                <TableHead className="hidden sm:table-cell">Field</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id} className="group">
                  <TableCell>
                    <div className="font-medium">
                      {game.homeTeam?.name || 'TBD'} vs {game.awayTeam?.name || 'TBD'}
                    </div>
                    <div className="text-sm text-muted-foreground md:hidden">
                      {formatTime(game.scheduledTime)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatTime(game.scheduledTime)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {game.fieldLocation?.name ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {game.fieldLocation.name}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      'font-mono font-bold text-lg',
                      game.status === 'in_progress' && 'text-red-500'
                    )}>
                      {game.homeTeamScore} - {game.awayTeamScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={game.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/games/${game.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {canEditGames && game.status === 'scheduled' && (
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canCancelGames && game.status !== 'canceled' && game.status !== 'finished' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteGame(game.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancel Game
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Card View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              formatTime={formatTime}
              canEdit={canEditGames}
              canCancel={canCancelGames}
              onCancel={handleDeleteGame}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {games.length > 0 && (
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

// Game Card Component
interface GameCardProps {
  game: Game;
  formatTime: (dateStr: string) => string;
  canEdit: boolean;
  canCancel: boolean;
  onCancel: (id: string) => void;
}

function GameCard({ game, formatTime, canEdit, canCancel, onCancel }: GameCardProps) {
  const isLive = game.status === 'in_progress';

  return (
    <Card className={cn(
      'hover:border-primary/50 transition-colors group relative',
      isLive && 'border-red-500/50 bg-red-500/5'
    )}>
      <CardContent className="p-4">
        {/* Actions Menu */}
        {(canEdit || canCancel) && (
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
                <Link href={`/games/${game.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canEdit && game.status === 'scheduled' && (
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canCancel && game.status !== 'canceled' && game.status !== 'finished' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onCancel(game.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel Game
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center justify-between mb-3">
          <StatusBadge status={game.status} />
          {game.fieldLocation?.name && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {game.fieldLocation.name}
            </span>
          )}
        </div>

        <Link href={`/games/${game.id}`}>
          <div className="space-y-3">
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <span className="font-medium truncate flex-1">{game.homeTeam?.name || 'TBD'}</span>
              <span className={cn(
                'text-2xl font-bold tabular-nums ml-4',
                isLive && 'text-red-500'
              )}>
                {game.homeTeamScore}
              </span>
            </div>
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <span className="font-medium truncate flex-1">{game.awayTeam?.name || 'TBD'}</span>
              <span className={cn(
                'text-2xl font-bold tabular-nums ml-4',
                isLive && 'text-red-500'
              )}>
                {game.awayTeamScore}
              </span>
            </div>
          </div>
        </Link>

        <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatTime(game.scheduledTime)}
          </div>
          {isLive && (
            <div className="flex items-center gap-1.5 text-red-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="font-medium text-xs">LIVE</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
