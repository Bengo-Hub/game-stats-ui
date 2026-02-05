'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calendar, MapPin, Clock, User } from 'lucide-react';
import { gamesApi, type UpdateGameRequest } from '@/lib/api/games';
import { publicApi } from '@/lib/api/public';
import { gameKeys } from '@/lib/hooks/useGamesQuery';
import type { Game } from '@/types';
import { cn } from '@/lib/utils';

// Validation schema for editing
const editGameSchema = z.object({
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  allocatedTimeMinutes: z.number().min(10, 'Minimum 10 minutes').max(180, 'Maximum 180 minutes'),
  fieldId: z.string().optional(),
  scorekeeperId: z.string().optional(),
});

type EditGameFormData = z.infer<typeof editGameSchema>;

interface EditGameDialogProps {
  game: Game;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Common allocated time presets
const TIME_PRESETS = [
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 75, label: '1h 15m' },
  { value: 90, label: '1h 30m' },
  { value: 120, label: '2 hours' },
];

export function EditGameDialog({ game, open, onOpenChange, onSuccess }: EditGameDialogProps) {
  const queryClient = useQueryClient();

  // Parse existing scheduled time
  const existingDate = new Date(game.scheduledTime);
  const dateStr = existingDate.toISOString().split('T')[0];
  const timeStr = existingDate.toTimeString().slice(0, 5);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditGameFormData>({
    resolver: zodResolver(editGameSchema),
    defaultValues: {
      scheduledDate: dateStr,
      scheduledTime: timeStr,
      allocatedTimeMinutes: game.allocatedTimeMinutes,
      fieldId: game.fieldLocation?.id || '',
      scorekeeperId: game.scorekeeper?.id || '',
    },
  });

  // Fetch available scorekeepers (users with scorekeeper role)
  const { data: scorekeepers = [] } = useQuery({
    queryKey: ['scorekeepers'],
    queryFn: async () => {
      // This would typically be an admin endpoint to list users with scorekeeper role
      // For now, return empty or mock data
      return [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch fields (simplified - would need location context)
  const { data: fields = [] } = useQuery({
    queryKey: ['fields'],
    queryFn: async () => {
      // Would typically fetch fields based on event location
      return [];
    },
    staleTime: 1000 * 60 * 10,
  });

  // Mutation for updating game
  const updateMutation = useMutation({
    mutationFn: (data: UpdateGameRequest) => gamesApi.update(game.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(game.id) });
      toast.success('Game updated successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update game');
    },
  });

  const onSubmit = (data: EditGameFormData) => {
    const scheduledTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString();

    const request: UpdateGameRequest = {
      scheduledTime,
      allocatedTimeMinutes: data.allocatedTimeMinutes,
      fieldId: data.fieldId || undefined,
      scorekeeperId: data.scorekeeperId || undefined,
    };
    updateMutation.mutate(request);
  };

  const isLocked = game.status === 'in_progress' || game.status === 'finished' || game.status === 'ended';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
          <DialogDescription>
            {game.homeTeam?.name} vs {game.awayTeam?.name}
            {isLocked && (
              <span className="block mt-1 text-amber-500">
                Some fields are locked because the game has started.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  {...register('scheduledDate')}
                  className={errors.scheduledDate ? 'border-destructive' : ''}
                  disabled={isLocked}
                />
                {errors.scheduledDate && (
                  <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Time *</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  {...register('scheduledTime')}
                  className={errors.scheduledTime ? 'border-destructive' : ''}
                  disabled={isLocked}
                />
                {errors.scheduledTime && (
                  <p className="text-sm text-destructive">{errors.scheduledTime.message}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Game Duration
              </Label>
              <div className="flex flex-wrap gap-2">
                {TIME_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setValue('allocatedTimeMinutes', preset.value)}
                    disabled={isLocked}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      watch('allocatedTimeMinutes') === preset.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground',
                      isLocked && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                {...register('allocatedTimeMinutes', { valueAsNumber: true })}
                className={cn('mt-2 w-32', errors.allocatedTimeMinutes ? 'border-destructive' : '')}
                placeholder="Custom (min)"
                disabled={isLocked}
              />
              {errors.allocatedTimeMinutes && (
                <p className="text-sm text-destructive">{errors.allocatedTimeMinutes.message}</p>
              )}
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-2">
            <Label htmlFor="fieldId" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Field
            </Label>
            <Select
              onValueChange={(value) => setValue('fieldId', value)}
              defaultValue={game.fieldLocation?.id}
            >
              <SelectTrigger>
                <SelectValue placeholder={game.fieldLocation?.name || 'Select field'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No field assigned</SelectItem>
                {fields.map((field: { id: string; name: string }) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scorekeeper Assignment */}
          <div className="space-y-2">
            <Label htmlFor="scorekeeperId" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Scorekeeper
            </Label>
            <Select
              onValueChange={(value) => setValue('scorekeeperId', value)}
              defaultValue={game.scorekeeper?.id}
            >
              <SelectTrigger>
                <SelectValue placeholder={game.scorekeeper?.name || 'Assign scorekeeper'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No scorekeeper</SelectItem>
                {scorekeepers.map((user: { id: string; name: string }) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Game Info (read-only) */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <h4 className="font-medium mb-2">Game Info</h4>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Home Team:</span>
              <span className="font-medium text-foreground">{game.homeTeam?.name}</span>
              <span>Away Team:</span>
              <span className="font-medium text-foreground">{game.awayTeam?.name}</span>
              <span>Status:</span>
              <span className="font-medium text-foreground capitalize">{game.status.replace('_', ' ')}</span>
              {game.status !== 'scheduled' && (
                <>
                  <span>Score:</span>
                  <span className="font-medium text-foreground">
                    {game.homeTeamScore} - {game.awayTeamScore}
                  </span>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditGameDialog;
