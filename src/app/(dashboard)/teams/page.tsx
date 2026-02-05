'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import {
  Users,
  Plus,
  RefreshCw,
  AlertCircle,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  Filter,
  X,
  UserPlus,
} from 'lucide-react';
import { useTeamsQuery, teamKeys } from '@/lib/hooks/useTeamsQuery';
import { usePaginationState, DEFAULT_PAGE_SIZE } from '@/lib/hooks/usePagination';
import { usePermissions } from '@/lib/hooks/usePermission';
import { useQueryClient } from '@tanstack/react-query';
import type { Team } from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'table' | 'cards';

// Color palette for team avatars
const TEAM_COLORS = [
  'bg-gradient-to-br from-rose-400 to-red-500',
  'bg-gradient-to-br from-orange-400 to-amber-500',
  'bg-gradient-to-br from-emerald-400 to-green-500',
  'bg-gradient-to-br from-cyan-400 to-blue-500',
  'bg-gradient-to-br from-violet-400 to-purple-500',
  'bg-gradient-to-br from-pink-400 to-fuchsia-500',
  'bg-gradient-to-br from-indigo-400 to-blue-600',
  'bg-gradient-to-br from-teal-400 to-cyan-500',
];

function getTeamColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const pagination = usePaginationState(DEFAULT_PAGE_SIZE);

  // Filter state
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [viewMode, setViewMode] = React.useState<ViewMode>('table');
  const [showFilters, setShowFilters] = React.useState(false);
  const [divisionFilter, setDivisionFilter] = React.useState<string>('all');

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
  }, [divisionFilter]);

  // Build query params
  const queryParams = React.useMemo(() => ({
    ...(debouncedSearch && { search: debouncedSearch }),
    limit: pagination.pageSize,
    offset: pagination.offset,
  }), [debouncedSearch, pagination.pageSize, pagination.offset]);

  // Fetch teams using TanStack Query
  const {
    data: allTeams = [],
    isLoading,
    isError,
    error,
    isFetching,
  } = useTeamsQuery(queryParams);

  // Extract unique divisions for filter
  const divisions = React.useMemo(() => {
    const divSet = new Set<string>();
    allTeams.forEach(team => {
      if (team.divisionName) divSet.add(team.divisionName);
    });
    return Array.from(divSet).sort();
  }, [allTeams]);

  // Client-side division filter
  const teams = React.useMemo(() => {
    if (divisionFilter === 'all') return allTeams;
    return allTeams.filter(team => team.divisionName === divisionFilter);
  }, [allTeams, divisionFilter]);

  // Calculate total pages
  const hasMorePages = allTeams.length === pagination.pageSize;
  const totalPages = hasMorePages ? pagination.page + 1 : pagination.page;

  // Refresh teams
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: teamKeys.all });
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDivisionFilter('all');
  };

  // Check if any filters are active
  const hasActiveFilters = divisionFilter !== 'all' || debouncedSearch;

  // Handle delete team
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    // TODO: Implement with authenticated API
    console.log('Delete team:', teamId);
  };

  // Permission checks
  const canCreateTeams = can('manage_teams');
  const canEditTeams = can('manage_teams');
  const canDeleteTeams = can('manage_teams');

  // Get placement medal
  const getPlacementBadge = (placement: number | undefined) => {
    if (!placement) return null;
    if (placement === 1) return <span className="text-lg">🥇</span>;
    if (placement === 2) return <span className="text-lg">🥈</span>;
    if (placement === 3) return <span className="text-lg">🥉</span>;
    return <Badge variant="secondary">#{placement}</Badge>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader title="Teams" description="View and manage all teams">
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
          {canCreateTeams && (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Add Team</span>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search teams..."
            className="flex-1 max-w-md"
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

        {/* Additional filters */}
        <div className={cn(
          'flex flex-col sm:flex-row gap-3 sm:items-center',
          !showFilters && 'hidden sm:flex'
        )}>
          {/* Division filter */}
          {divisions.length > 0 && (
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All divisions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All divisions</SelectItem>
                {divisions.map(div => (
                  <SelectItem key={div} value={div}>{div}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
              {error instanceof Error ? error.message : 'Failed to load teams'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {/* Results info */}
      {!isLoading && teams.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{teams.length}</span> teams
            {pagination.page > 1 && ` (Page ${pagination.page})`}
          </span>
          {isFetching && <span className="text-xs">Updating...</span>}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No teams found"
          description={hasActiveFilters ? 'Try adjusting your filters' : 'Teams will appear here once events are created'}
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreateTeams ? (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              canEdit={canEditTeams}
              canDelete={canDeleteTeams}
              onDelete={handleDeleteTeam}
              getPlacementBadge={getPlacementBadge}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="hidden sm:table-cell">Division</TableHead>
                <TableHead className="hidden md:table-cell">Seed</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold',
                            getTeamColor(team.name)
                          )}
                        >
                          {team.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">{team.name}</span>
                        <div className="sm:hidden text-xs text-muted-foreground">
                          {team.divisionName || 'No division'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {team.divisionName ? (
                      <Badge variant="outline">{team.divisionName}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {team.initialSeed ? (
                      <span className="font-mono text-sm">#{team.initialSeed}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {team.locationName ? (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-sm">{team.locationName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getPlacementBadge(team.finalPlacement) || (
                      <span className="text-muted-foreground">-</span>
                    )}
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
                          <Link href={`/teams/${team.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {canEditTeams && (
                          <>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Manage Roster
                            </DropdownMenuItem>
                          </>
                        )}
                        {canDeleteTeams && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteTeam(team.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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
      )}

      {/* Pagination */}
      {teams.length > 0 && (
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

// Team Card Component
interface TeamCardProps {
  team: Team;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (id: string) => void;
  getPlacementBadge: (placement: number | undefined) => React.ReactNode;
}

function TeamCard({ team, canEdit, canDelete, onDelete, getPlacementBadge }: TeamCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors group relative">
      <CardContent className="p-4">
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
                <Link href={`/teams/${team.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Team
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Manage Roster
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(team.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center gap-3">
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={team.name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg',
                getTeamColor(team.name)
              )}
            >
              {team.name.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link href={`/teams/${team.id}`}>
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {team.name}
              </h3>
            </Link>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {team.divisionName && (
                <Badge variant="outline" className="text-xs">{team.divisionName}</Badge>
              )}
              {team.initialSeed && (
                <span className="text-xs text-muted-foreground font-mono">Seed #{team.initialSeed}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          {team.locationName ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{team.locationName}</span>
            </div>
          ) : (
            <div />
          )}
          {team.finalPlacement && (
            <div className="flex items-center gap-1.5">
              {getPlacementBadge(team.finalPlacement)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
