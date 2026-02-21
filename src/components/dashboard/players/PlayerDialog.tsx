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
import { Label } from '@/components/ui/label';
import type { Player } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Validation schema for player
export const playerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    jerseyNumber: z.number().min(0).max(99).optional().nullable(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    position: z.string().optional(),
    isCaptain: z.boolean(),
    isSpiritCaptain: z.boolean(),
    gender: z.string().min(1, 'Gender is required'),
});

export type PlayerFormData = z.infer<typeof playerSchema>;

interface PlayerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    player?: Player;
    onSubmit: (data: any) => void;
    isPending: boolean;
    children?: React.ReactNode;
}

export function PlayerDialog({
    open,
    onOpenChange,
    title,
    description,
    player,
    onSubmit,
    isPending,
    children,
}: PlayerDialogProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PlayerFormData>({
        resolver: zodResolver(playerSchema),
        defaultValues: player
            ? {
                name: player.name,
                jerseyNumber: player.jerseyNumber,
                isCaptain: player.isCaptain,
                isSpiritCaptain: player.isSpiritCaptain,
                gender: player.gender || 'X',
            }
            : {
                name: '',
                jerseyNumber: undefined,
                email: '',
                phone: '',
                position: '',
                isCaptain: false,
                isSpiritCaptain: false,
                gender: 'X',
            },
    });

    React.useEffect(() => {
        if (open) {
            if (player) {
                reset({
                    name: player.name,
                    jerseyNumber: player.jerseyNumber,
                    isCaptain: player.isCaptain,
                    isSpiritCaptain: player.isSpiritCaptain,
                    gender: player.gender || 'X',
                });
            } else {
                reset({
                    name: '',
                    jerseyNumber: undefined,
                    id: undefined,
                    email: '',
                    phone: '',
                    position: '',
                    isCaptain: false,
                    isSpiritCaptain: false,
                    gender: 'X',
                } as any);
            }
        }
    }, [open, player, reset]);

    const handleFormSubmit = (data: PlayerFormData) => {
        onSubmit(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    {children}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            placeholder="Player name"
                            {...register('name')}
                            className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender *</Label>
                            <select
                                id="gender"
                                {...register('gender')}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="M">Male (M)</option>
                                <option value="F">Female (F)</option>
                                <option value="X">Mixed (X)</option>
                            </select>
                            {errors.gender && (
                                <p className="text-sm text-destructive">{errors.gender.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jerseyNumber">Jersey #</Label>
                            <Input
                                id="jerseyNumber"
                                type="number"
                                min={0}
                                max={99}
                                placeholder="0-99"
                                {...register('jerseyNumber', {
                                    setValueAs: (v: string) => v === "" ? undefined : parseInt(v, 10)
                                })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                            id="position"
                            placeholder="e.g., Handler"
                            {...register('position')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="player@example.com"
                            {...register('email')}
                            className={errors.email ? 'border-destructive' : ''}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" {...register('isCaptain')} className="rounded" />
                            <span className="text-sm">Captain</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" {...register('isSpiritCaptain')} className="rounded" />
                            <span className="text-sm">Spirit Captain</span>
                        </label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {player ? 'Save Changes' : 'Add Player'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
