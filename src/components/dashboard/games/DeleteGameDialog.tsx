'use client';

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
import { gamesApi } from '@/lib/api/games';
import { gameKeys } from '@/lib/hooks/useGamesQuery';
import type { Game } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteGameDialogProps {
    game: Game;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DeleteGameDialog({ game, open, onOpenChange, onSuccess }: DeleteGameDialogProps) {
    const queryClient = useQueryClient();

    // Mutation for deleting game
    const deleteMutation = useMutation({
        mutationFn: () => gamesApi.delete(game.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gameKeys.all });
            toast.success('Game deleted successfully');
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete game');
        },
    });

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    const isCompleted = game.status === 'completed' || game.status === 'ended';

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        Delete Game
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        <p>
                            Are you sure you want to <span className="font-bold text-destructive underline uppercase">permanently delete</span> this game?
                            This action cannot be undone.
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

                        {isCompleted && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                                <p className="font-medium text-destructive mb-1">
                                    ⚠️ Deleting Completed Game
                                </p>
                                <p className="text-muted-foreground">
                                    This game is already completed. Deleting it will remove the results from standings and leaderboards.
                                </p>
                            </div>
                        )}

                        <p className="text-sm font-medium text-destructive">
                            Warning: All scoring events, spirit scores, and media associated with this game will be permanently removed.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteMutation.isPending}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleteMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Delete Permanently
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default DeleteGameDialog;
