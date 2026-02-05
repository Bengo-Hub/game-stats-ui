'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Loader2, AlertTriangle } from 'lucide-react';
import { gamesApi } from '@/lib/api/games';
import { gameKeys } from '@/lib/hooks/useGamesQuery';
import type { Game } from '@/types';

interface CancelGameDialogProps {
  game: Game;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CancelGameDialog({ game, open, onOpenChange, onSuccess }: CancelGameDialogProps) {
  const queryClient = useQueryClient();

  // Mutation for canceling game
  const cancelMutation = useMutation({
    mutationFn: () => gamesApi.cancel(game.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(game.id) });
      toast.success('Game canceled successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel game');
    },
  });

  const handleCancel = () => {
    cancelMutation.mutate();
  };

  const isInProgress = game.status === 'in_progress';
  const hasScores = game.homeTeamScore > 0 || game.awayTeamScore > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Game
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to cancel this game?
            </p>

            <div className="p-3 bg-muted rounded-lg text-sm">
              <div className="font-medium text-foreground mb-1">
                {game.homeTeam?.name} vs {game.awayTeam?.name}
              </div>
              <div className="text-muted-foreground">
                {new Date(game.scheduledTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
              {game.fieldLocation && (
                <div className="text-muted-foreground">
                  Field: {game.fieldLocation.name}
                </div>
              )}
            </div>

            {isInProgress && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">
                  ⚠️ Game in Progress
                </p>
                <p className="text-muted-foreground">
                  This game is currently being played. Canceling will end the game without recording final results.
                </p>
              </div>
            )}

            {hasScores && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                <p className="font-medium text-destructive mb-1">
                  Score will be discarded
                </p>
                <p className="text-muted-foreground">
                  Current score: {game.homeTeamScore} - {game.awayTeamScore}
                </p>
              </div>
            )}

            <p className="text-muted-foreground">
              This action can be undone by an administrator if needed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelMutation.isPending}>
            Keep Game
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {cancelMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Cancel Game
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default CancelGameDialog;
