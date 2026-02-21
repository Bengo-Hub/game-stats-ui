'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { gamesApi, type CreateGameRequest } from '@/lib/api/games';
import { publicApi } from '@/lib/api/public';
import { eventKeys } from '@/lib/hooks/useEventsQuery';
import { gameKeys } from '@/lib/hooks/useGamesQuery';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Loader2, MapPin, Plus, Users } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema
const scheduleGameSchema = z.object({
  eventId: z.string().min(1, 'Please select an event'),
  divisionPoolId: z.string().min(1, 'Please select a division/pool'),
  gameRoundId: z.string().min(1, 'Please select a game round'),
  homeTeamId: z.string().min(1, 'Please select home team'),
  awayTeamId: z.string().min(1, 'Please select away team'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  allocatedTimeMinutes: z.number().min(10, 'Minimum 10 minutes').max(180, 'Maximum 180 minutes'),
  fieldId: z.string().optional(),
}).refine((data) => data.homeTeamId !== data.awayTeamId, {
  message: 'Home and away teams must be different',
  path: ['awayTeamId'],
});

type ScheduleGameFormData = z.infer<typeof scheduleGameSchema>;

interface ScheduleGameDialogProps {
  trigger?: React.ReactNode;
  eventId?: string; // Pre-select event if provided
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

export function ScheduleGameDialog({ trigger, eventId, onSuccess }: ScheduleGameDialogProps) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduleGameFormData>({
    resolver: zodResolver(scheduleGameSchema),
    defaultValues: {
      eventId: eventId || '',
      divisionPoolId: '',
      gameRoundId: '',
      homeTeamId: '',
      awayTeamId: '',
      scheduledDate: '',
      scheduledTime: '',
      allocatedTimeMinutes: 75,
      fieldId: '',
    },
  });

  const selectedEventId = watch('eventId');
  const selectedDivisionPoolId = watch('divisionPoolId');

  // Fetch available events
  const { data: events = [] } = useQuery({
    queryKey: eventKeys.list({ status: 'published' }),
    queryFn: () => publicApi.listEvents({ status: 'published', limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch selected event details (for divisions/pools)
  const { data: eventDetails } = useQuery({
    queryKey: eventKeys.detail(selectedEventId),
    queryFn: () => publicApi.getEvent(selectedEventId),
    enabled: !!selectedEventId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch teams for selected division pool
  const { data: teams = [] } = useQuery({
    queryKey: ['teams', 'divisionPool', selectedDivisionPoolId],
    queryFn: () => publicApi.listTeams({ divisionPoolId: selectedDivisionPoolId, limit: 100 }),
    enabled: !!selectedDivisionPoolId,
    staleTime: 1000 * 60 * 5,
  });

  // Fields are loaded from event details if available
  // TODO: Add dedicated fields API endpoint when available
  const fields: { id: string; name: string }[] = [];

  // Reset dependent fields when event changes
  React.useEffect(() => {
    if (selectedEventId) {
      setValue('divisionPoolId', '');
      setValue('gameRoundId', '');
      setValue('homeTeamId', '');
      setValue('awayTeamId', '');
    }
  }, [selectedEventId, setValue]);

  // Reset team selections when division pool changes
  React.useEffect(() => {
    if (selectedDivisionPoolId) {
      setValue('homeTeamId', '');
      setValue('awayTeamId', '');
    }
  }, [selectedDivisionPoolId, setValue]);

  // Mutation for creating game
  const createMutation = useMutation({
    mutationFn: (data: CreateGameRequest) => gamesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameKeys.all });
      toast.success('Game scheduled successfully');
      setOpen(false);
      reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to schedule game');
    },
  });

  const onSubmit = (data: ScheduleGameFormData) => {
    // Combine date and time into ISO string
    const scheduledTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString();

    const request: CreateGameRequest = {
      home_team_id: data.homeTeamId,
      away_team_id: data.awayTeamId,
      scheduled_time: scheduledTime,
      allocated_time_minutes: data.allocatedTimeMinutes,
      division_pool_id: data.divisionPoolId,
      game_round_id: data.gameRoundId,
      field_location_id: data.fieldId || undefined,
    };
    createMutation.mutate(request);
  };

  // Get divisions/pools from event details
  const divisionPools = eventDetails?.divisions || [];

  // Game rounds - these would typically come from the event structure
  // TODO: Fetch actual rounds from event API when available
  const gameRounds = [
    { id: 'pool', name: 'Pool Play' },
    { id: 'crossover', name: 'Crossover' },
    { id: 'quarter', name: 'Quarterfinals' },
    { id: 'semi', name: 'Semifinals' },
    { id: 'final', name: 'Finals' },
  ];

  const homeTeamId = watch('homeTeamId');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Game
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Game</DialogTitle>
          <DialogDescription>
            Create a new game by selecting teams, time, and field.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Event Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eventId">Event *</Label>
              <Select
                onValueChange={(value) => setValue('eventId', value)}
                defaultValue={eventId}
              >
                <SelectTrigger className={errors.eventId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.eventId && (
                <p className="text-sm text-destructive">{errors.eventId.message}</p>
              )}
            </div>

            {/* Division/Pool Selection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="divisionPoolId">Division/Pool *</Label>
                <Select
                  onValueChange={(value) => setValue('divisionPoolId', value)}
                  disabled={!selectedEventId || divisionPools.length === 0}
                >
                  <SelectTrigger className={errors.divisionPoolId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisionPools.map(dp => (
                      <SelectItem key={dp.id} value={dp.id}>
                        {dp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.divisionPoolId && (
                  <p className="text-sm text-destructive">{errors.divisionPoolId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameRoundId">Round *</Label>
                <Select
                  onValueChange={(value) => setValue('gameRoundId', value)}
                  disabled={!selectedEventId}
                >
                  <SelectTrigger className={errors.gameRoundId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select round" />
                  </SelectTrigger>
                  <SelectContent>
                    {gameRounds.map(round => (
                      <SelectItem key={round.id} value={round.id}>
                        {round.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gameRoundId && (
                  <p className="text-sm text-destructive">{errors.gameRoundId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Team Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teams
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="homeTeamId">Home Team *</Label>
                <Select
                  onValueChange={(value) => setValue('homeTeamId', value)}
                  disabled={!selectedDivisionPoolId || teams.length === 0}
                >
                  <SelectTrigger className={errors.homeTeamId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          {team.logoUrl && (
                            <img src={team.logoUrl} alt="" className="w-4 h-4 rounded" />
                          )}
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.homeTeamId && (
                  <p className="text-sm text-destructive">{errors.homeTeamId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="awayTeamId">Away Team *</Label>
                <Select
                  onValueChange={(value) => setValue('awayTeamId', value)}
                  disabled={!selectedDivisionPoolId || teams.length === 0}
                >
                  <SelectTrigger className={errors.awayTeamId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(team => team.id !== homeTeamId)
                      .map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            {team.logoUrl && (
                              <img src={team.logoUrl} alt="" className="w-4 h-4 rounded" />
                            )}
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.awayTeamId && (
                  <p className="text-sm text-destructive">{errors.awayTeamId.message}</p>
                )}
              </div>
            </div>
          </div>

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
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      watch('allocatedTimeMinutes') === preset.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
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
              Field (Optional)
            </Label>
            <Select onValueChange={(value) => setValue('fieldId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select field (optional)" />
              </SelectTrigger>
              <SelectContent>
                {fields.length > 0 ? (
                  fields.map((field: { id: string; name: string }) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none__" disabled>
                    No fields available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Schedule Game
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ScheduleGameDialog;
