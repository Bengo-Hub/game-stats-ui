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
import { Switch } from '@/components/ui/switch';
import { roundsApi } from '@/lib/api/events';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const gameRoundSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    round_type: z.enum(['pool', 'crossover', 'bracket', 'semifinal', 'final']),
    round_number: z.number().min(1).optional(),
    start_date: z.string().optional().or(z.literal('')),
    end_date: z.string().optional().or(z.literal('')),
    auto_advance: z.boolean(),
    top_n_teams: z.number().min(1).optional(),
});

type GameRoundForm = z.infer<typeof gameRoundSchema>;

interface GameRoundDialogProps {
    eventId: string;
    round?: any | null;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

export function GameRoundDialog({ eventId, round, trigger, open: controlledOpen, onOpenChange, onSuccess }: GameRoundDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    const isEdit = !!round;
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<GameRoundForm>({
        resolver: zodResolver(gameRoundSchema),
        defaultValues: {
            name: '',
            round_type: 'pool',
            round_number: 1,
            auto_advance: false,
        },
    });

    // Sync form with round data
    React.useEffect(() => {
        if (round && open) {
            reset({
                name: round.name,
                round_type: round.roundType as any,
                round_number: round.roundNumber || 1,
                start_date: round.startDate ? new Date(round.startDate).toISOString().slice(0, 16) : '',
                end_date: round.endDate ? new Date(round.endDate).toISOString().slice(0, 16) : '',
                auto_advance: round.autoAdvance || false,
                top_n_teams: round.topNTeams,
            });
        } else if (!round && open) {
            reset({
                name: '',
                round_type: 'pool',
                round_number: 1,
                auto_advance: false,
                start_date: '',
                end_date: '',
            });
        }
    }, [round, open, reset]);

    const createMutation = useMutation({
        mutationFn: (data: GameRoundForm) => roundsApi.create({ ...data, event_id: eventId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rounds', 'list', eventId] });
            toast.success('Game round created successfully');
            setOpen(false);
            onSuccess?.();
            reset();
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to create game round'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: GameRoundForm) => {
            // Map frontend naming back to backend partial update if necessary
            // In events.ts update, I used: name, roundType, roundNumber, startDate, endDate, autoAdvance, topNTeams
            const updateData = {
                name: data.name,
                roundType: data.round_type,
                roundNumber: data.round_number,
                startDate: data.start_date ? new Date(data.start_date).toISOString() : undefined,
                endDate: data.end_date ? new Date(data.end_date).toISOString() : undefined,
                autoAdvance: data.auto_advance,
                topNTeams: data.top_n_teams,
            };
            return roundsApi.update(round!.id, updateData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rounds', 'list', eventId] });
            toast.success('Game round updated successfully');
            setOpen(false);
            onSuccess?.();
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to update game round'),
    });

    const onSubmit = (data: GameRoundForm) => {
        if (isEdit) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Layers className="h-5 w-5" />
                        </div>
                        <DialogTitle>{isEdit ? 'Edit Round' : 'Add Round'}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {isEdit ? `Update the settings for ${round?.name}.` : 'Create a new scoring round or stage for this event.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="round-name">Round Name *</Label>
                        <Input
                            id="round-name"
                            placeholder="e.g., Pool A, Quarter-Finals"
                            {...register('name')}
                            className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="round-type">Round Type *</Label>
                            <Select
                                value={watch('round_type')}
                                onValueChange={(val) => setValue('round_type', val as any, { shouldValidate: true, shouldDirty: true })}
                            >
                                <SelectTrigger id="round-type">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pool">Pool / Group</SelectItem>
                                    <SelectItem value="crossover">Crossover</SelectItem>
                                    <SelectItem value="bracket">Elimination Bracket</SelectItem>
                                    <SelectItem value="semifinal">Semi-Final</SelectItem>
                                    <SelectItem value="final">Final</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="round-number">Order (1...n)</Label>
                            <Input
                                id="round-number"
                                type="number"
                                {...register('round_number')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-date">Start Time</Label>
                            <Input
                                id="start-date"
                                type="datetime-local"
                                {...register('start_date')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">End Time</Label>
                            <Input
                                id="end-date"
                                type="datetime-local"
                                {...register('end_date')}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="auto-advance" className="text-sm font-medium">Auto-Advance Teams</Label>
                                <p className="text-xs text-muted-foreground">Automatically move top teams to next round</p>
                            </div>
                            <Switch
                                id="auto-advance"
                                checked={watch('auto_advance')}
                                onCheckedChange={(checked) => setValue('auto_advance', checked, { shouldDirty: true })}
                            />
                        </div>

                        {watch('auto_advance') && (
                            <div className="space-y-2 pt-2 border-t">
                                <Label htmlFor="top-n" className="text-xs">Number of Teams to Advance</Label>
                                <Input
                                    id="top-n"
                                    type="number"
                                    placeholder="2"
                                    {...register('top_n_teams')}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || (isEdit && !isDirty)}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isEdit ? 'Save Changes' : 'Create Round'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
