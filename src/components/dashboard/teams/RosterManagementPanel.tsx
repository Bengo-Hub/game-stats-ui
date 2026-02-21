'use client';

import { MassUploadPlayersDialog, PlayerDialog } from '@/components/dashboard/players';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { teamsApi, type CreatePlayerRequest, type UpdatePlayerRequest } from '@/lib/api/teams';
import { teamKeys } from '@/lib/hooks/useTeamsQuery';
import { cn } from '@/lib/utils';
import type { Player, Team } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Crown,
  Edit,
  Heart,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';


interface RosterManagementPanelProps {
  team: Team;
}

export function RosterManagementPanel({ team }: RosterManagementPanelProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [editingPlayer, setEditingPlayer] = React.useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = React.useState<Player | null>(null);

  // Fetch team roster
  const { data: roster = [], isLoading } = useQuery({
    queryKey: [...teamKeys.detail(team.id), 'roster'],
    queryFn: () => teamsApi.getRoster(team.id),
    staleTime: 1000 * 60 * 5,
  });

  // Filter players by search
  const filteredPlayers = React.useMemo(() => {
    if (!search) return roster;
    const searchLower = search.toLowerCase();
    return roster.filter(
      (player) =>
        player.name.toLowerCase().includes(searchLower) ||
        player.jerseyNumber?.toString().includes(searchLower)
    );
  }, [roster, search]);

  // Sort players: captain first, then spirit captain, then by jersey number
  const sortedPlayers = React.useMemo(() => {
    return [...filteredPlayers].sort((a, b) => {
      if (a.isCaptain !== b.isCaptain) return a.isCaptain ? -1 : 1;
      if (a.isSpiritCaptain !== b.isSpiritCaptain) return a.isSpiritCaptain ? -1 : 1;
      if (a.jerseyNumber !== undefined && b.jerseyNumber !== undefined) {
        return a.jerseyNumber - b.jerseyNumber;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredPlayers]);

  // Add player mutation
  const addMutation = useMutation({
    mutationFn: (data: CreatePlayerRequest) => teamsApi.addPlayer(team.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...teamKeys.detail(team.id), 'roster'] });
      toast.success('Player added to roster');
      setAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add player');
    },
  });

  // Update player mutation
  const updateMutation = useMutation({
    mutationFn: ({ playerId, data }: { playerId: string; data: UpdatePlayerRequest }) =>
      teamsApi.updatePlayer(team.id, playerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...teamKeys.detail(team.id), 'roster'] });
      toast.success('Player updated');
      setEditingPlayer(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update player');
    },
  });

  // Remove player mutation
  const removeMutation = useMutation({
    mutationFn: (playerId: string) => teamsApi.removePlayer(team.id, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...teamKeys.detail(team.id), 'roster'] });
      toast.success('Player removed from roster');
      setDeletingPlayer(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove player');
    },
  });

  // Set captain mutation
  const setCaptainMutation = useMutation({
    mutationFn: (playerId: string) => teamsApi.setCaptain(team.id, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...teamKeys.detail(team.id), 'roster'] });
      toast.success('Captain updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set captain');
    },
  });

  // Set spirit captain mutation
  const setSpiritCaptainMutation = useMutation({
    mutationFn: (playerId: string) => teamsApi.setSpiritCaptain(team.id, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...teamKeys.detail(team.id), 'roster'] });
      toast.success('Spirit captain updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set spirit captain');
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Roster</h3>
          <p className="text-sm text-muted-foreground">
            {roster.length} player{roster.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setUploadDialogOpen(true)} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Mass Upload
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Player List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedPlayers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{search ? 'No players found' : 'No players in roster yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              {/* Jersey Number */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                  player.isCaptain
                    ? 'bg-amber-500 text-white'
                    : player.isSpiritCaptain
                      ? 'bg-sky-500 text-white'
                      : 'bg-primary/10 text-primary'
                )}
              >
                {player.jerseyNumber !== undefined ? `#${player.jerseyNumber}` : <User className="h-4 w-4" />}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{player.name}</span>
                  {player.isCaptain && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Captain
                    </span>
                  )}
                  {player.isSpiritCaptain && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-600 flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      Spirit
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {player.gender}
                  {player.profileImageUrl && ' • Has profile photo'}
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingPlayer(player)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Player
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!player.isCaptain && (
                    <DropdownMenuItem onClick={() => setCaptainMutation.mutate(player.id)}>
                      <Crown className="h-4 w-4 mr-2" />
                      Make Captain
                    </DropdownMenuItem>
                  )}
                  {!player.isSpiritCaptain && (
                    <DropdownMenuItem onClick={() => setSpiritCaptainMutation.mutate(player.id)}>
                      <Heart className="h-4 w-4 mr-2" />
                      Make Spirit Captain
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeletingPlayer(player)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove from Roster
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Add Player Dialog */}
      <PlayerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        title="Add Player"
        description="Add a new player to the team roster."
        onSubmit={(data) => addMutation.mutate(data as CreatePlayerRequest)}
        isPending={addMutation.isPending}
      />

      {/* Mass Upload Dialog */}
      <MassUploadPlayersDialog
        teamId={team.id}
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: [...teamKeys.detail(team.id), 'roster'] })}
      />

      {/* Edit Player Dialog */}
      {editingPlayer && (
        <PlayerDialog
          open={!!editingPlayer}
          onOpenChange={() => setEditingPlayer(null)}
          title="Edit Player"
          description="Update player information."
          player={editingPlayer}
          onSubmit={(data) =>
            updateMutation.mutate({ playerId: editingPlayer.id, data })
          }
          isPending={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPlayer} onOpenChange={() => setDeletingPlayer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deletingPlayer?.name}</strong> from the roster?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlayer && removeMutation.mutate(deletingPlayer.id)}
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


export default RosterManagementPanel;
