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
import { publicApi } from '@/lib/api/public';
import { teamsApi, type CreateTeamRequest, type UpdateTeamRequest } from '@/lib/api/teams';
import { eventKeys } from '@/lib/hooks/useEventsQuery';
import { teamKeys } from '@/lib/hooks/useTeamsQuery';
import { cn } from '@/lib/utils';
import type { Team } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Palette, Upload, Users } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema
const teamSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
    eventId: z.string().min(1, 'Please select an event'),
    divisionPoolId: z.string().min(1, 'Please select a division'),
    initialSeed: z.number().min(0).max(999).optional(),
    finalPlacement: z.number().min(1).max(999).optional(),
    logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    contactPhone: z.string().optional(),
    locationName: z.string().optional(),
    teamId: z.string().optional(), // For reuse
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamDialogProps {
    team?: Team | null; // If provided, we are in Edit mode
    trigger?: React.ReactNode;
    eventId?: string; // Pre-selected event ID for create mode
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

// Common team colors
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
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Slate', value: '#475569' },
    { name: 'Zinc', value: '#3F3F46' },
    { name: 'Neutral', value: '#71717A' },
    { name: 'Stone', value: '#78716C' },
    { name: 'Stone', value: '#78716C' },
];

export function TeamDialog({ team, trigger, eventId: initialEventId, open: controlledOpen, onOpenChange, onSuccess }: TeamDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;
    const [teamSearch, setTeamSearch] = React.useState('');
    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);

    const isEdit = !!team;
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<TeamFormData>({
        resolver: zodResolver(teamSchema),
        defaultValues: {
            name: '',
            eventId: initialEventId || '',
            divisionPoolId: '',
            initialSeed: 0,
            finalPlacement: undefined,
            logoUrl: '',
            primaryColor: '#3B82F6',
            secondaryColor: '#FFFFFF',
            contactEmail: '',
            contactPhone: '',
            locationName: '',
        },
    });

    const selectedEventId = watch('eventId');
    const primaryColor = watch('primaryColor');
    const secondaryColor = watch('secondaryColor');

    // Sync form with team data when editing
    React.useEffect(() => {
        if (team && open) {
            reset({
                name: team.name,
                eventId: team.eventId || '',
                divisionPoolId: team.divisionPoolId || '',
                initialSeed: team.initialSeed ?? 0,
                finalPlacement: team.finalPlacement,
                logoUrl: team.logoUrl || '',
                primaryColor: team.primaryColor || '#3B82F6',
                secondaryColor: team.secondaryColor || '#FFFFFF',
                contactEmail: team.contactEmail || '',
                contactPhone: team.contactPhone || '',
                locationName: team.locationName || '',
            });
        } else if (!team && open) {
            reset({
                name: '',
                eventId: initialEventId || '',
                divisionPoolId: '',
                initialSeed: 0,
                finalPlacement: undefined,
                logoUrl: '',
                primaryColor: '#3B82F6',
                secondaryColor: '#FFFFFF',
                contactEmail: '',
                contactPhone: '',
                locationName: '',
            });
        }
    }, [team, open, reset, initialEventId]);

    // Fetch available events
    const { data: events = [] } = useQuery({
        queryKey: eventKeys.list({ status: isEdit ? undefined : 'published', limit: 100 }),
        queryFn: () => publicApi.listEvents({ status: isEdit ? undefined : 'published', limit: 100 }),
        enabled: open,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch selected event details (for divisions)
    const { data: eventDetails } = useQuery({
        queryKey: eventKeys.detail(selectedEventId),
        queryFn: () => publicApi.getEvent(selectedEventId),
        enabled: open && !!selectedEventId,
        staleTime: 1000 * 60 * 5,
    });

    // Fetch teams for search/reuse
    const { data: searchTeams = [], isLoading: isLoadingSearch } = useQuery({
        queryKey: ['teams', 'search', teamSearch],
        queryFn: () => publicApi.listTeams({ search: teamSearch, limit: 10 }),
        enabled: open && !isEdit && teamSearch.length > 2,
    });

    // Reset division when event changes in create mode
    React.useEffect(() => {
        if (!isEdit && selectedEventId) {
            setValue('divisionPoolId', '');
        }
    }, [selectedEventId, setValue, isEdit]);

    const handleSelectExistingTeam = (t: Team) => {
        setSelectedTeamId(t.id);
        setValue('teamId', t.id);
        setValue('name', t.name, { shouldDirty: true });
        setValue('logoUrl', t.logoUrl || '', { shouldDirty: true });
        setValue('primaryColor', t.primaryColor || '#3B82F6', { shouldDirty: true });
        setValue('secondaryColor', t.secondaryColor || '#FFFFFF', { shouldDirty: true });
        setValue('contactEmail', t.contactEmail || '', { shouldDirty: true });
        setValue('contactPhone', t.contactPhone || '', { shouldDirty: true });
        setValue('locationName', t.locationName || '', { shouldDirty: true });
        setTeamSearch('');
        toast.info(`Selected existing team: ${t.name}`);
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateTeamRequest) => teamsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.all });
            toast.success('Team created successfully');
            setOpen(false);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create team');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateTeamRequest) => teamsApi.update(team!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: teamKeys.all });
            queryClient.invalidateQueries({ queryKey: teamKeys.detail(team!.id) });
            toast.success('Team updated successfully');
            setOpen(false);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update team');
        },
    });

    const onSubmit = (data: TeamFormData) => {
        if (isEdit) {
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
        } else {
            const request: CreateTeamRequest = {
                name: data.name,
                eventId: data.eventId,
                divisionPoolId: data.divisionPoolId,
                initialSeed: data.initialSeed || 1,
                logoUrl: data.logoUrl || undefined,
                primaryColor: data.primaryColor,
                secondaryColor: data.secondaryColor,
                contactEmail: data.contactEmail || undefined,
                contactPhone: data.contactPhone || undefined,
                locationName: data.locationName || undefined,
                teamId: data.teamId,
            };
            createMutation.mutate(request);
        }
    };

    const divisions = eventDetails?.divisions || [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Team' : 'Add New Team'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? `Update information for "${team?.name}".` : 'Register a new team for a tournament event.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Team Name */}
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="name">Team Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Thunder Dragons"
                                    {...register('name')}
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}

                                {!isEdit && (
                                    <div className="relative mt-1">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                placeholder="Search existing teams to reuse..."
                                                value={teamSearch}
                                                onChange={(e) => setTeamSearch(e.target.value)}
                                                className="text-xs h-8"
                                            />
                                            {isLoadingSearch && <Loader2 className="h-3 w-3 animate-spin" />}
                                        </div>
                                        {searchTeams.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md overflow-hidden max-h-40 overflow-y-auto">
                                                {searchTeams.map((t) => (
                                                    <div
                                                        key={t.id}
                                                        className="px-3 py-2 text-xs hover:bg-muted cursor-pointer flex items-center justify-between"
                                                        onClick={() => handleSelectExistingTeam(t)}
                                                    >
                                                        <span>{t.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{t.locationName || 'Global'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Event Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="eventId">Event *</Label>
                                <Select
                                    value={watch('eventId')}
                                    onValueChange={(value) => setValue('eventId', value, { shouldDirty: true })}
                                    disabled={isEdit}
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
                                {isEdit && <p className="text-[10px] text-muted-foreground">Cannot change event after creation</p>}
                                {errors.eventId && (
                                    <p className="text-sm text-destructive">{errors.eventId.message}</p>
                                )}
                            </div>

                            {/* Division Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="divisionPoolId">Division *</Label>
                                <Select
                                    value={watch('divisionPoolId')}
                                    onValueChange={(value) => setValue('divisionPoolId', value, { shouldDirty: true })}
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

                        {/* Initial Seed & Location */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="initialSeed">Initial Seed</Label>
                                <Input
                                    id="initialSeed"
                                    type="number"
                                    min={0}
                                    max={999}
                                    placeholder="e.g., 0"
                                    {...register('initialSeed', { valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="locationName">Location/City</Label>
                                <Input
                                    id="locationName"
                                    placeholder="e.g., Hong Kong"
                                    {...register('locationName')}
                                />
                            </div>
                        </div>

                        {/* Final Placement (Edit only) */}
                        {isEdit && (
                            <div className="space-y-2">
                                <Label htmlFor="finalPlacement">Final Placement</Label>
                                <Input
                                    id="finalPlacement"
                                    type="number"
                                    min={1}
                                    max={999}
                                    placeholder="e.g., 1"
                                    {...register('finalPlacement', { valueAsNumber: true })}
                                />
                                <p className="text-xs text-muted-foreground">The actual rank achieved after the tournament</p>
                            </div>
                        )}
                    </div>

                    {/* Team Colors */}
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
                                                onClick={() => setValue('primaryColor', color.value, { shouldDirty: true })}
                                                className={cn(
                                                    'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                                                    primaryColor === color.value ? 'border-foreground' : 'border-transparent'
                                                )}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
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
                                                onClick={() => setValue('secondaryColor', color.value, { shouldDirty: true })}
                                                className={cn(
                                                    'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                                                    secondaryColor === color.value ? 'border-foreground' : 'border-transparent'
                                                )}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Color Preview */}
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-16 rounded-lg border flex items-center justify-center text-white font-bold"
                                style={{
                                    backgroundColor: primaryColor,
                                    color: secondaryColor,
                                }}
                            >
                                <Users className="h-8 w-8" />
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Preview of team colors
                            </div>
                        </div>
                    </div>

                    {/* Logo */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Team Logo
                        </h3>
                        <FileUploader
                            value={watch('logoUrl')}
                            onChange={(url) => setValue('logoUrl', url, { shouldDirty: true })}
                            onRemove={() => setValue('logoUrl', '', { shouldDirty: true })}
                            label=""
                            description="Upload team logo (PNG, JPG or WEBP, max. 5MB)"
                        />
                        <div className="pt-2">
                            <Label htmlFor="logoUrlInput" className="text-xs text-muted-foreground mb-1 block">Or enter URL manually</Label>
                            <Input
                                id="logoUrlInput"
                                type="url"
                                placeholder="https://example.com/logo.png"
                                {...register('logoUrl')}
                                className={errors.logoUrl ? 'border-destructive' : ''}
                            />
                        </div>
                        {errors.logoUrl && (
                            <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Contact Information</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    placeholder="team@example.com"
                                    {...register('contactEmail')}
                                    className={errors.contactEmail ? 'border-destructive' : ''}
                                />
                                {errors.contactEmail && (
                                    <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">Contact Phone</Label>
                                <Input
                                    id="contactPhone"
                                    type="tel"
                                    placeholder="+1 234 567 8900"
                                    {...register('contactPhone')}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending || (isEdit && !isDirty)}
                        >
                            {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {isEdit ? 'Save Changes' : 'Create Team'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default TeamDialog;
