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
import { eventsApi } from '@/lib/api/events';
import { eventKeys } from '@/lib/hooks/useEventsQuery';
import type { Event } from '@/types';

interface DeleteEventDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteEventDialog({ event, open, onOpenChange, onSuccess }: DeleteEventDialogProps) {
  const queryClient = useQueryClient();

  // Mutation for deleting event
  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.delete(event.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event deleted successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete event');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Event
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete <strong>"{event.name}"</strong>?
            </p>
            {(event.teamsCount > 0 || event.gamesCount > 0) && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                <p className="font-medium text-destructive mb-1">This event has associated data:</p>
                <ul className="list-disc list-inside text-muted-foreground">
                  {event.teamsCount > 0 && (
                    <li>{event.teamsCount} team{event.teamsCount > 1 ? 's' : ''} registered</li>
                  )}
                  {event.gamesCount > 0 && (
                    <li>{event.gamesCount} game{event.gamesCount > 1 ? 's' : ''} scheduled</li>
                  )}
                </ul>
              </div>
            )}
            <p className="text-muted-foreground">
              This action will soft-delete the event. The data can be recovered by an administrator if needed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Delete Event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteEventDialog;
