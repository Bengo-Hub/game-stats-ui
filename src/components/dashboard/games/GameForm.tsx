'use client';

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
import { adminApi } from '@/lib/api/admin';
import { gamesApi, type CreateGameRequest, type UpdateGameRequest } from '@/lib/api/games';
import { publicApi } from '@/lib/api/public';
import { eventKeys } from '@/lib/hooks/useEventsQuery';
import { gameKeys } from '@/lib/hooks/useGamesQuery';
import { useFields } from '@/lib/hooks/useGeographic';
import { useRoundsQuery } from '@/lib/hooks/useRoundsQuery';
import { cn } from '@/lib/utils';
import type { Game, PaginatedResponse, Team } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
    Calendar,
    Clock,
    Loader2,
    MapPin,
    Plus,
    ShieldCheck,
    User as UserIcon
} from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { FieldDialog } from '../fields/FieldDialog';

// Common allocated time presets
const TIME_PRESETS = [
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hour' },
    { value: 75, label: '1h 15m' },
    { value: 90, label: '1h 30m' },
    { value: 120, label: '2 hours' },
];

const gameFormSchema = z.object({
    eventId: z.string().min(1, 'Please select an event'),
    divisionPoolId: z.string().min(1, 'Please select a division/pool'),
    gameRoundId: z.string().min(1, 'Please select a game round'),
    homeTeamId: z.string().min(1, 'Please select home team'),
    awayTeamId: z.string().min(1, 'Please select away team'),
    scheduledDate: z.string().min(1, 'Scheduled date is required'),
    scheduledTime: z.string().min(1, 'Scheduled time is required'),
    allocatedTimeMinutes: z.number().min(10, 'Minimum 10 minutes').max(180, 'Maximum 180 minutes'),
    fieldId: z.string().optional(),
    scorekeeperId: z.string().min(1, 'Please assign a scorekeeper'),
}).refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: 'Home and away teams must be different',
    path: ['awayTeamId'],
});

type GameFormData = z.infer<typeof gameFormSchema>;

interface GameFormProps {
    game?: Game; // If provided, enters edit mode
    initialEventId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function GameForm({ game, initialEventId, onSuccess, onCancel }: GameFormProps) {
    const isEdit = !!game;
    const queryClient = useQueryClient();

    // Initialize form with existing game data if in edit mode
    const defaultValues = React.useMemo(() => {
        if (game) {
            const date = new Date(game.scheduledTime);
            return {
                eventId: game.divisionPool?.id || '', // Note: game might need expanded relation
                divisionPoolId: game.divisionPool?.id || '',
                gameRoundId: game.gameRound?.id || '',
                homeTeamId: game.homeTeam?.id || '',
                awayTeamId: game.awayTeam?.id || '',
                scheduledDate: date.toISOString().split('T')[0],
                scheduledTime: date.toTimeString().slice(0, 5),
                allocatedTimeMinutes: game.allocatedTimeMinutes,
                fieldId: game.fieldLocation?.id || '',
                scorekeeperId: game.scorekeeper?.id || '',
            };
        }
        return {
            eventId: initialEventId || '',
            divisionPoolId: '',
            gameRoundId: '',
            homeTeamId: '',
            awayTeamId: '',
            scheduledDate: '',
            scheduledTime: '',
            allocatedTimeMinutes: 75,
            fieldId: '',
            scorekeeperId: '',
        };
    }, [game, initialEventId]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<GameFormData>({
        resolver: zodResolver(gameFormSchema),
        defaultValues,
    });

    const selectedEventId = watch('eventId');
    const selectedDivisionPoolId = watch('divisionPoolId');
    const homeTeamId = watch('homeTeamId');
    const selectedFieldId = watch('fieldId');
    const selectedScorekeeperId = watch('scorekeeperId');

    // Fetch available events (only if not editing)
    const { data: events = [] } = useQuery({
        queryKey: eventKeys.list({ status: 'published' }),
        queryFn: () => publicApi.listEvents({ status: 'published', limit: 100 }),
        staleTime: 1000 * 60 * 5,
        enabled: !isEdit,
    });

    // Fetch selected event details
    const { data: eventDetails } = useQuery({
        queryKey: eventKeys.detail(selectedEventId),
        queryFn: () => publicApi.getEvent(selectedEventId),
        enabled: !!selectedEventId,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch game rounds
    const { data: gameRounds = [] } = useRoundsQuery(selectedEventId);

    // Fetch teams (Paginated)
    const { data: teamsResult } = useQuery({
        queryKey: ['teams', 'divisionPool', selectedDivisionPoolId],
        queryFn: () => publicApi.listTeams({ divisionPoolId: selectedDivisionPoolId, limit: 100 }),
        enabled: !!selectedDivisionPoolId,
        staleTime: 1000 * 60 * 5,
    });

    const teams = (teamsResult as PaginatedResponse<Team>)?.data || [];

    // Fetch fields
    const { data: fieldsData = [] } = useFields(eventDetails?.location?.id);
    const fields = fieldsData || [];

    // Fetch scorekeepers
    const { data: scorekeepers = [] } = useQuery({
        queryKey: ['admin', 'users', 'scorekeepers'],
        queryFn: () => adminApi.listUsers({ role: 'scorekeeper', limit: 100 }),
        staleTime: 1000 * 60 * 10,
    });

    // Reset dependent fields when event/division changes (only in create mode)
    React.useEffect(() => {
        if (!isEdit && selectedEventId) {
            if (selectedEventId !== initialEventId) {
                setValue('divisionPoolId', '');
                setValue('gameRoundId', '');
                setValue('homeTeamId', '');
                setValue('awayTeamId', '');
            }
        }
    }, [selectedEventId, isEdit, setValue, initialEventId]);

    const createMutation = useMutation({
        mutationFn: (data: CreateGameRequest) => gamesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gameKeys.all });
            toast.success('Game scheduled successfully');
            reset();
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to schedule game');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateGameRequest) => gamesApi.update(game!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gameKeys.all });
            queryClient.invalidateQueries({ queryKey: gameKeys.detail(game!.id) });
            toast.success('Game updated successfully');
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update game');
        },
    });

    const onSubmit = (data: GameFormData) => {
        const scheduledTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString();

        if (isEdit) {
            const request: UpdateGameRequest = {
                scheduled_time: scheduledTime,
                allocated_time_minutes: data.allocatedTimeMinutes,
                field_location_id: data.fieldId === '__none__' ? undefined : data.fieldId,
                scorekeeper_id: data.scorekeeperId === '__none__' ? undefined : data.scorekeeperId,
            };
            updateMutation.mutate(request);
        } else {
            const request: CreateGameRequest = {
                home_team_id: data.homeTeamId,
                away_team_id: data.awayTeamId,
                scheduled_time: scheduledTime,
                allocated_time_minutes: data.allocatedTimeMinutes,
                division_pool_id: data.divisionPoolId,
                game_round_id: data.gameRoundId,
                field_location_id: data.fieldId === '__none__' ? undefined : data.fieldId,
                scorekeeper_id: data.scorekeeperId === '__none__' ? undefined : data.scorekeeperId,
            };
            createMutation.mutate(request);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const divisionPools = eventDetails?.divisions || [];

    // Game status locked check
    const isStarted = game && (game.status !== 'scheduled');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!isEdit ? (
                <>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="eventId">Event *</Label>
                            <Select
                                onValueChange={(value) => setValue('eventId', value)}
                                defaultValue={selectedEventId}
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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="divisionPoolId">Division/Pool *</Label>
                                <Select
                                    onValueChange={(value) => setValue('divisionPoolId', value)}
                                    disabled={!selectedEventId || divisionPools.length === 0}
                                    defaultValue={selectedDivisionPoolId}
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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gameRoundId">Round *</Label>
                                <Select
                                    onValueChange={(value) => setValue('gameRoundId', value)}
                                    disabled={!selectedEventId}
                                    defaultValue={watch('gameRoundId')}
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
                            </div>
                        </div>

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
                                        {teams.map((team: Team) => (
                                            <SelectItem key={team.id} value={team.id}>
                                                {team.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                            .filter((team: Team) => team.id !== homeTeamId)
                                            .map((team: Team) => (
                                                <SelectItem key={team.id} value={team.id}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="p-4 bg-muted/50 rounded-xl border flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Teams:</span>
                        <span className="font-semibold">{game.homeTeam?.name} vs {game.awayTeam?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Division/Round:</span>
                        <span>{game.divisionPool?.name} / {game.gameRound?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="capitalize">{game.status.replace('_', ' ')}</span>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule & Logistics
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="scheduledDate">Date *</Label>
                        <Input
                            id="scheduledDate"
                            type="date"
                            {...register('scheduledDate')}
                            disabled={isStarted}
                            className={errors.scheduledDate ? 'border-destructive' : ''}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="scheduledTime">Time *</Label>
                        <Input
                            id="scheduledTime"
                            type="time"
                            {...register('scheduledTime')}
                            disabled={isStarted}
                            className={errors.scheduledTime ? 'border-destructive' : ''}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Game Duration
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {TIME_PRESETS.map(preset => (
                            <button
                                key={preset.value}
                                type="button"
                                disabled={isStarted}
                                onClick={() => setValue('allocatedTimeMinutes', preset.value)}
                                className={cn(
                                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                                    watch('allocatedTimeMinutes') === preset.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                )}
                            >
                                {preset.label}
                            </button>
                        ))}
                        <Input
                            type="number"
                            disabled={isStarted}
                            {...register('allocatedTimeMinutes', { valueAsNumber: true })}
                            className="h-8 w-24 text-xs"
                            placeholder="Custom"
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="fieldId" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Field
                        </Label>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedFieldId || '__none__'}
                                onValueChange={(value) => setValue('fieldId', value)}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">No field assigned</SelectItem>
                                    {fields.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!isStarted && (
                                <FieldDialog
                                    defaultLocationId={eventDetails?.location?.id}
                                    onSuccess={(f) => setValue('fieldId', f.id)}
                                    trigger={
                                        <Button variant="outline" size="icon" type="button" className="shrink-0">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="scorekeeperId" className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Scorekeeper
                        </Label>
                        <Select
                            value={selectedScorekeeperId || '__none__'}
                            onValueChange={(value) => setValue('scorekeeperId', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Assign scorekeeper" />
                            </SelectTrigger>
                            <SelectContent>
                                {scorekeepers.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                    <ShieldCheck className="h-4 w-4" />
                    Schedule Summary
                </h4>
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Teams:</span>
                    <span className="font-medium text-right">
                        {!isEdit
                            ? `${(teams as Team[]).find(t => t.id === watch('homeTeamId'))?.name || 'Home'} vs ${(teams as Team[]).find(t => t.id === watch('awayTeamId'))?.name || 'Away'}`
                            : `${game.homeTeam?.name} vs ${game.awayTeam?.name}`
                        }
                    </span>
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="font-medium text-right">
                        {watch('scheduledDate') ? format(parseISO(watch('scheduledDate')), 'MMM d, yyyy') : '...'} at {watch('scheduledTime') || '...'}
                    </span>
                    <span className="text-muted-foreground">Field:</span>
                    <span className="font-medium text-right text-primary">
                        {fields.find(f => f.id === selectedFieldId)?.name || 'Not assigned'}
                    </span>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isPending} className="min-w-[120px]">
                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isEdit ? 'Save Changes' : 'Schedule Game'}
                </Button>
            </div>
        </form>
    );
}
