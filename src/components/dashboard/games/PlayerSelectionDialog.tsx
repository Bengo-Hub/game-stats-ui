'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { gamesApi, type RecordScoreRequest } from '@/lib/api/games';
import { teamsApi } from '@/lib/api/teams';
import { gameKeys } from '@/lib/hooks/useGamesQuery';
import { cn } from '@/lib/utils';
import type { Game, Player, TeamSummary } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Disc, HandHelping, Loader2, Search, User } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

interface PlayerSelectionDialogProps {
  game: Game;
  scoringTeam: TeamSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PlayerSelectionDialog({
  game,
  scoringTeam,
  open,
  onOpenChange,
  onSuccess,
}: PlayerSelectionDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [selectedScorer, setSelectedScorer] = React.useState<Player | null>(null);
  const [selectedAssist, setSelectedAssist] = React.useState<Player | null>(null);
  const [step, setStep] = React.useState<'scorer' | 'assist'>('scorer');

  // Fetch team roster
  const { data: roster = [], isLoading: rosterLoading } = useQuery({
    queryKey: ['teams', scoringTeam.id, 'roster'],
    queryFn: () => teamsApi.getRoster(scoringTeam.id),
    enabled: !!scoringTeam.id && open,
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

  // Record score mutation
  const recordScoreMutation = useMutation({
    mutationFn: (data: RecordScoreRequest) => gamesApi.recordScore(game.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(game.id) });
      queryClient.invalidateQueries({ queryKey: gameKeys.scores(game.id) });
      toast.success('Score recorded!');
      handleClose();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record score');
    },
  });

  const handleSelectScorer = (player: Player) => {
    setSelectedScorer(player);
    setStep('assist');
    setSearch('');
  };

  const handleSelectAssist = (player: Player | null) => {
    setSelectedAssist(player);
  };

  const handleConfirm = () => {
    if (!selectedScorer) return;

    const request: RecordScoreRequest = {
      player_id: selectedScorer.id,
      assist_player_id: selectedAssist?.id,
      team_id: scoringTeam.id,
      goals: 1,
    };
    recordScoreMutation.mutate(request);
  };

  const handleClose = () => {
    setSelectedScorer(null);
    setSelectedAssist(null);
    setStep('scorer');
    setSearch('');
    onOpenChange(false);
  };

  const handleBack = () => {
    setStep('scorer');
    setSelectedAssist(null);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'scorer' ? (
              <>
                <Disc className="h-5 w-5 text-primary" />
                Select Scorer
              </>
            ) : (
              <>
                <HandHelping className="h-5 w-5 text-primary" />
                Select Assist (Optional)
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'scorer' ? (
              <>Recording goal for <strong>{scoringTeam.name}</strong></>
            ) : (
              <>Who assisted {selectedScorer?.name}?</>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Player Grid */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px]">
          {rosterLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <User className="h-8 w-8 mb-2" />
              <p>{search ? 'No players found' : 'No players in roster'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
              {step === 'assist' && (
                <button
                  onClick={() => handleSelectAssist(null)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-left',
                    selectedAssist === null
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent bg-muted hover:border-muted-foreground/20'
                  )}
                >
                  <div className="font-medium text-sm">No Assist</div>
                  <div className="text-xs text-muted-foreground">Unassisted goal</div>
                </button>
              )}
              {filteredPlayers
                .filter((player) => step === 'scorer' || player.id !== selectedScorer?.id)
                .map((player) => (
                  <button
                    key={player.id}
                    onClick={() =>
                      step === 'scorer'
                        ? handleSelectScorer(player)
                        : handleSelectAssist(player)
                    }
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all text-left',
                      (step === 'scorer' && selectedScorer?.id === player.id) ||
                        (step === 'assist' && selectedAssist?.id === player.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-muted hover:border-muted-foreground/20'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {player.jerseyNumber !== undefined && (
                        <span className="text-lg font-bold text-primary">
                          #{player.jerseyNumber}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{player.name}</div>
                        <div className="flex gap-1">
                          {player.isCaptain && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-600">
                              C
                            </span>
                          )}
                          {player.isSpiritCaptain && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-sky-500/20 text-sky-600">
                              SC
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Selection Summary */}
        {step === 'assist' && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-muted-foreground">Scorer: </span>
                <span className="font-medium">
                  {selectedScorer?.jerseyNumber && `#${selectedScorer.jerseyNumber} `}
                  {selectedScorer?.name}
                </span>
              </div>
              {selectedAssist && (
                <div>
                  <span className="text-muted-foreground">Assist: </span>
                  <span className="font-medium">
                    {selectedAssist.jerseyNumber && `#${selectedAssist.jerseyNumber} `}
                    {selectedAssist.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2">
          {step === 'assist' && (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={recordScoreMutation.isPending}
          >
            Cancel
          </Button>
          {step === 'assist' && (
            <Button
              onClick={handleConfirm}
              disabled={!selectedScorer || recordScoreMutation.isPending}
            >
              {recordScoreMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm Goal
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PlayerSelectionDialog;
