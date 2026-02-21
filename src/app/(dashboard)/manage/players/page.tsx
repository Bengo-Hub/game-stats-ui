'use client';

import { GlobalAddPlayerDialog, GlobalMassUploadDialog, PlayerDialog, type PlayerFormData } from '@/components/dashboard/players';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { publicApi } from '@/lib/api/public';
import { teamsApi } from '@/lib/api/teams';
import { usePaginationState } from '@/lib/hooks/usePagination';
import type { Player } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Edit,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

export default function PlayersPage() {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);

  // Filters state
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>('all');
  const [selectedEventId, setSelectedEventId] = React.useState<string>('all');
  const [selectedGender, setSelectedGender] = React.useState<string>('all');

  // State for single player edit
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = React.useState(false);
  const [editingPlayer, setEditingPlayer] = React.useState<Player | undefined>(undefined);

  const pagination = usePaginationState(50); // Consistent page size
  const queryClient = useQueryClient();

  // Fetch teams for filter
  const { data: teams = [] } = useQuery({
    queryKey: ['teams', 'list', 'filter'],
    queryFn: () => publicApi.listTeams({ limit: 100 }),
  });

  // Fetch events for filter
  const { data: events = [] } = useQuery({
    queryKey: ['events', 'list', 'filter'],
    queryFn: () => publicApi.listEvents({ limit: 100 }),
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      pagination.reset();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, pagination]);

  // Fetch players logically
  const queryKey = ['dashboard', 'players', 'list', debouncedSearch, selectedTeamId, selectedEventId, selectedGender, pagination.pageSize, pagination.offset];
  const {
    data: players = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: () => publicApi.listPlayers({
      search: debouncedSearch,
      teamId: selectedTeamId === 'all' ? undefined : selectedTeamId,
      eventId: selectedEventId === 'all' ? undefined : selectedEventId,
      gender: selectedGender === 'all' ? undefined : (selectedGender === 'm' ? 'M' : selectedGender === 'f' ? 'F' : 'X'),
      limit: pagination.pageSize,
      offset: pagination.offset,
    }),
    staleTime: 1000 * 60, // 1 minute
  });

  // Calculate total pages for UI
  const hasMorePages = players.length === pagination.pageSize;
  const totalPages = hasMorePages ? pagination.page + 1 : pagination.page;

  // Edit Player Mutation
  const updatePlayerMutation = useMutation({
    mutationFn: (data: PlayerFormData) => {
      if (!editingPlayer?.teamId) {
        throw new Error("Cannot edit player without a team");
      }

      // Remove nulls to satisfy UpdatePlayerRequest
      const payload = {
        ...data,
        jerseyNumber: data.jerseyNumber === null ? undefined : data.jerseyNumber,
      };

      return teamsApi.updatePlayer(editingPlayer.teamId, editingPlayer.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'players'] });
      setIsPlayerDialogOpen(false);
      setEditingPlayer(undefined);
      toast.success('Player updated successfully');
    },
    onError: (err) => {
      toast.error('Failed to update player');
    },
  });

  // Delete Player Mutation
  const deletePlayerMutation = useMutation({
    mutationFn: (player: Player) => {
      if (!player.teamId) {
        throw new Error("Cannot delete player without a team");
      }
      return teamsApi.removePlayer(player.teamId, player.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'players'] });
      toast.success('Player deleted successfully');
    },
    onError: (err) => {
      toast.error('Failed to delete player');
    },
  });

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setIsPlayerDialogOpen(true);
  };

  const handleDeletePlayer = (player: Player) => {
    if (confirm(`Are you sure you want to delete ${player.name}?`)) {
      deletePlayerMutation.mutate(player);
    }
  };

  const handleDialogSubmit = (data: PlayerFormData) => {
    if (editingPlayer) {
      updatePlayerMutation.mutate(data);
    }
  };

  // Generate a consistent color from player name
  const getPlayerColor = (name: string) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#6366f1',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get initials from player name
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Players" description="Manage players across all teams and events">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Mass Upload
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search players by name..."
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Gender</SelectItem>
              <SelectItem value="m">Male (M)</SelectItem>
              <SelectItem value="f">Female (F)</SelectItem>
              <SelectItem value="x">Mixed (X)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(selectedGender !== 'all' || selectedTeamId !== 'all' || selectedEventId !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedGender('all');
                setSelectedTeamId('all');
                setSelectedEventId('all');
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load players'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <EmptyState
          icon={<UserCircle className="h-12 w-12" />}
          title="No players found"
          description={search ? 'Try adjusting your search terms' : 'Add players actively to see them here.'}
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch('')}>
                Clear Search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid gap-4 sm:hidden">
            {players.map((player) => (
              <Card key={player.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: getPlayerColor(player.name) }}
                      >
                        {getInitials(player.name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        <Link href={`/manage/players/${player.id}`} className="hover:underline hover:text-primary">
                          {player.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{player.teamName || 'No Team'}</p>
                    </div>
                    {player.teamId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPlayer(player)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeletePlayer(player)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t text-sm">
                    <Badge variant="outline">{player.gender}</Badge>
                    {player.jerseyNumber !== undefined && player.jerseyNumber !== null && <Badge variant="outline">#{player.jerseyNumber}</Badge>}
                    {player.isCaptain && <Badge variant="secondary">Captain</Badge>}
                    {player.isSpiritCaptain && <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">Spirit Capt</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: getPlayerColor(player.name) }}
                        >
                          {getInitials(player.name)}
                        </div>
                        <Link href={`/manage/players/${player.id}`} className="font-medium hover:underline hover:text-primary">
                          {player.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {player.teamId ? (
                        <Link href={`/manage/teams/${player.teamId}`} className="hover:underline">
                          {player.teamName}
                        </Link>
                      ) : (
                        <span className="italic">No Team</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">{player.gender}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {player.jerseyNumber !== undefined && player.jerseyNumber !== null && <Badge variant="outline">#{player.jerseyNumber}</Badge>}
                        {player.isCaptain && <Badge variant="secondary" className="text-xs">Captain</Badge>}
                        {player.isSpiritCaptain && <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs hover:bg-purple-200">Spirit</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {player.teamId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPlayer(player)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeletePlayer(player)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {players.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t">
              <Pagination
                currentPage={pagination.page}
                totalPages={totalPages}
                onPageChange={pagination.setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <GlobalAddPlayerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => refetch()}
      />
      <GlobalMassUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => refetch()}
      />
      <PlayerDialog
        open={isPlayerDialogOpen}
        onOpenChange={(open) => {
          setIsPlayerDialogOpen(open);
          if (!open) setEditingPlayer(undefined);
        }}
        title="Edit Player"
        description={`Update information for ${editingPlayer?.name}`}
        player={editingPlayer}
        onSubmit={handleDialogSubmit}
        isPending={updatePlayerMutation.isPending}
      />
    </div>
  );
}
