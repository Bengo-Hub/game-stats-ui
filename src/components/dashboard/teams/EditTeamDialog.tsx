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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { publicApi } from '@/lib/api/public';
import { teamsApi, type UpdateTeamRequest } from '@/lib/api/teams';
import { eventKeys } from '@/lib/hooks/useEventsQuery';
import { teamKeys } from '@/lib/hooks/useTeamsQuery';
import { cn } from '@/lib/utils';
import type { Team } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Palette, Upload } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const editTeamSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    eventId: z.string().min(1, 'Please select an event'),
    divisionPoolId: z.string().min(1, 'Please select a division'),
    initialSeed: z.number().min(1).max(999).optional(),
    finalPlacement: z.number().min(1).max(999).optional(),
    logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    contactPhone: z.string().optional(),
    locationName: z.string().optional(),
});

type EditTeamFormData = z.infer<typeof editTeamSchema>;

interface EditTeamDialogProps {
    team: Team | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const PRESET_COLORS = [
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Emerald', value: '#10B981' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Sky', value: '#0EA5E9' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Rose', value: '#F43F5E' },
];

export function EditTeamDialog({ team, open, onOpenChange, onSuccess }: EditTeamDialogProps) {
    const [logoPreview, setLogoPreview] = React.useState<string>('');
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<EditTeamFormData>({
        resolver: zodResolver(editTeamSchema),
    });

    const selectedEventId = watch('eventId');
    const primaryColor = watch('primaryColor');
    const secondaryColor = watch('secondaryColor');
    const logoUrl = watch('logoUrl');

    // Initialize form when team changes
    React.useEffect(() => {
        if (team && open) {
            reset({
                name: team.name,
                eventId: team.eventId || '',
                divisionPoolId: team.divisionPoolId || '',
                initialSeed: team.initialSeed,
                finalPlacement: team.finalPlacement,
                logoUrl: team.logoUrl || '',
                primaryColor: team.primaryColor || '#3B82F6',
                secondaryColor: team.secondaryColor || '#FFFFFF',
                contactEmail: team.contactEmail || '',
                contactPhone: team.contactPhone || '',
                locationName: team.locationName || '',
            });
            setLogoPreview(team.logoUrl || '');
        }
    }, [team, open, reset]);

    // Update logo preview when URL changes
    React.useEffect(() => {
        if (logoUrl && logoUrl.startsWith('http')) {
            setLogoPreview(logoUrl);
        } else {
            setLogoPreview('');
        }
    }, [logoUrl]);

    // Fetch available events
    const { data: events = [] } = useQuery({
        queryKey: eventKeys.list({ status: 'published' }),
        queryFn: () => publicApi.listEvents({ status: 'published', limit: 100 }),
        enabled: open,
    });

    // Fetch selected event details (for divisions)
    const { data: eventDetails } = useQuery({
        queryKey: eventKeys.detail(selectedEventId),
        queryFn: () => publicApi.getEvent(selectedEventId),
        enabled: open && !!selectedEventId,
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateTeamRequest) => teamsApi.update(team!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.all });
            toast.success('Team updated successfully');
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update team');
        },
    });

    const onSubmit = (data: EditTeamFormData) => {
        const request: UpdateTeamRequest = {
            name: data.name,
            divisionPoolId: data.divisionPoolId,
            initialSeed: data.initialSeed,
            finalPlacement: data.finalPlacement,
            logoUrl: data.logoUrl || undefined,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
            contactEmail: data.contactEmail || undefined,
            contactPhone: data.contactPhone || undefined,
            locationName: data.locationName || undefined,
        };
        updateMutation.mutate(request);
    };

    const divisions = eventDetails?.divisions || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Team</DialogTitle>
                    <DialogDescription>
                        Update team information, colors, and contact details.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="name">Team Name *</Label>
                                <Input
                                    id="name"
                                    {...register('name')}
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="eventId">Event *</Label>
                                <Select
                                    value={selectedEventId}
                                    onValueChange={(value) => setValue('eventId', value)}
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

                            <div className="space-y-2">
                                <Label htmlFor="divisionPoolId">Division *</Label>
                                <Select
                                    value={watch('divisionPoolId')}
                                    onValueChange={(value) => setValue('divisionPoolId', value)}
                                    disabled={!selectedEventId || divisions.length === 0}
                                >
                                    <SelectTrigger className={errors.divisionPoolId ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Select division" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {divisions.map(div => (
                                            <SelectItem key={div.id} value={div.id}>
                                                {div.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.divisionPoolId && (
                                    <p className="text-sm text-destructive">{errors.divisionPoolId.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="initialSeed">Initial Seed</Label>
                                <Input
                                    id="initialSeed"
                                    type="number"
                                    {...register('initialSeed', { valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="locationName">Location/City</Label>
                                <Input
                                    id="locationName"
                                    {...register('locationName')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Team Colors
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Primary Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        {...register('primaryColor')}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {PRESET_COLORS.slice(0, 8).map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setValue('primaryColor', color.value)}
                                                className={cn(
                                                    'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                                                    primaryColor === color.value ? 'border-foreground' : 'border-transparent'
                                                )}
                                                style={{ backgroundColor: color.value }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Secondary Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="color"
                                        {...register('secondaryColor')}
                                        className="w-12 h-10 p-1 cursor-pointer"
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {PRESET_COLORS.slice(8, 16).map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setValue('secondaryColor', color.value)}
                                                className={cn(
                                                    'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                                                    secondaryColor === color.value ? 'border-foreground' : 'border-transparent'
                                                )}
                                                style={{ backgroundColor: color.value }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Team Logo
                        </h3>
                        <div className="flex items-start gap-4">
                            {logoPreview && (
                                <div className="w-20 h-20 rounded-lg border overflow-hidden flex-shrink-0">
                                    <img
                                        src={logoPreview}
                                        alt="Logo preview"
                                        className="w-full h-full object-cover"
                                        onError={() => setLogoPreview('')}
                                    />
                                </div>
                            )}
                            <div className="flex-1 space-y-2">
                                <Input
                                    id="logoUrl"
                                    type="url"
                                    placeholder="https://example.com/logo.png"
                                    {...register('logoUrl')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Contact Information</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    {...register('contactEmail')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Contact Phone</Label>
                                <Input
                                    id="contactPhone"
                                    type="tel"
                                    {...register('contactPhone')}
                                />
                            </div>
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

export default EditTeamDialog;
