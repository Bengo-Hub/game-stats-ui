'use client';

import { FileUploader } from '@/components/shared/FileUploader';
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
import { publicApi } from '@/lib/api/public';
import type { Player } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, Upload } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
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
    gender: z.enum(['M', 'F', 'X']),
    profileImageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    playerId: z.string().optional(), // For reuse
    eventId: z.string().uuid('Invalid Event ID').optional().or(z.literal('')), // To ensure participation is created
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
    eventId, // Add eventId as optional prop
}: PlayerDialogProps & { eventId?: string }) {
    const [playerSearch, setPlayerSearch] = React.useState('');
    const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
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
                profileImageUrl: player.profileImageUrl || '',
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
                profileImageUrl: '',
                eventId: eventId,
            },
    });

    const { data: searchPlayers = [], isLoading: isLoadingSearch } = useQuery({
        queryKey: ['players', 'search', playerSearch],
        queryFn: () => publicApi.listPlayers({ search: playerSearch, limit: 10 }),
        enabled: open && !player && playerSearch.length > 2,
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
                    profileImageUrl: player.profileImageUrl || '',
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
                    profileImageUrl: '',
                } as any);
            }
        }
    }, [open, player, reset, eventId]);

    const handleSelectExistingPlayer = (p: any) => {
        setSelectedPlayerId(p.id);
        setValue('playerId', p.id);
        setValue('name', p.name, { shouldDirty: true });
        setValue('gender', p.gender || 'X', { shouldDirty: true });
        setValue('jerseyNumber', p.jerseyNumber ?? undefined, { shouldDirty: true }); // Ensure null becomes undefined for form
        setValue('email', p.email || '', { shouldDirty: true });
        setValue('phone', p.phone || '', { shouldDirty: true });
        setValue('position', p.position || '', { shouldDirty: true });
        setValue('profileImageUrl', p.profileImageUrl || '', { shouldDirty: true });
        setPlayerSearch('');
        toast.info(`Selected existing player: ${p.name}`);
    };

    const handleFormSubmit = (data: PlayerFormData) => {
        onSubmit(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
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

                        {!player && (
                            <div className="relative mt-1">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                                        <Input
                                            placeholder="Search existing players..."
                                            value={playerSearch}
                                            onChange={(e) => setPlayerSearch(e.target.value)}
                                            className="text-xs h-8 pl-8"
                                        />
                                    </div>
                                    {isLoadingSearch && <Loader2 className="h-3 w-3 animate-spin" />}
                                </div>
                                {((searchPlayers as any)?.data || []).length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden max-h-40 overflow-y-auto">
                                        {((searchPlayers as any)?.data || []).map((p: any) => (
                                            <div
                                                key={p.id}
                                                className="px-3 py-2 text-xs hover:bg-muted cursor-pointer flex items-center justify-between"
                                                onClick={() => handleSelectExistingPlayer(p)}
                                            >
                                                <div className="flex flex-col">
                                                    <span>{p.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{p.teamName || 'Free Agent'}</span>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase">{p.gender}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
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

                    <div className="space-y-4 pt-2">
                        <Label className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Profile Image
                        </Label>
                        <FileUploader
                            value={watch('profileImageUrl')}
                            onChange={(url) => setValue('profileImageUrl', url)}
                            onRemove={() => setValue('profileImageUrl', '')}
                            label=""
                            description="Upload profile photo (PNG, JPG or WEBP, max. 5MB)"
                        />
                        <div className="pt-2">
                            <Label htmlFor="profileImageUrlInput" className="text-xs text-muted-foreground mb-1 block">Or enter URL manually</Label>
                            <Input
                                id="profileImageUrlInput"
                                type="url"
                                placeholder="https://example.com/avatar.png"
                                {...register('profileImageUrl')}
                                className={errors.profileImageUrl ? 'border-destructive' : ''}
                            />
                        </div>
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
