'use client';

import { CategoryDialog } from '@/components/dashboard/categories/CategoryDialog';
import { DisciplineDialog } from '@/components/dashboard/disciplines/DisciplineDialog';
import { LocationDialog } from '@/components/dashboard/locations/LocationDialog';
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
import { Textarea } from '@/components/ui/textarea';
import { eventsApi, type CreateEventRequest, type UpdateEventRequest } from '@/lib/api/events';
import { useCategories } from '@/lib/hooks/useCategories';
import { useDisciplines } from '@/lib/hooks/useDisciplines';
import { eventKeys } from '@/lib/hooks/useEventsQuery';
import { useLocations } from '@/lib/hooks/useGeographic';
import { cn } from '@/lib/utils';
import type { Event } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CalendarDays, Loader2, Plus } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema
const eventSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
    slug: z.string().optional(),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    disciplineId: z.string().min(1, 'Please select a discipline'),
    locationId: z.string().min(1, 'Please select a location'),
    categoryIds: z.array(z.string()).optional(),
    logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    status: z.enum(['draft', 'published', 'in_progress', 'completed', 'canceled']),
}).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
}, {
    message: 'End date must be after start date',
    path: ['endDate'],
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventDialogProps {
    event?: Event; // If provided, we are in Edit mode
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

// Status options based on mode and current status
const getStatusOptions = (mode: 'create' | 'edit', currentStatus?: string) => {
    if (mode === 'create') {
        return [
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
        ];
    }

    switch (currentStatus) {
        case 'draft':
            return [
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'canceled', label: 'Canceled' },
            ];
        case 'published':
            return [
                { value: 'published', label: 'Published' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'canceled', label: 'Canceled' },
            ];
        case 'in_progress':
            return [
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
            ];
        case 'completed':
            return [{ value: 'completed', label: 'Completed' }];
        case 'canceled':
            return [{ value: 'canceled', label: 'Canceled' }];
        default:
            return [
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'canceled', label: 'Canceled' },
            ];
    }
};

export function EventDialog({ event, trigger, open: controlledOpen, onOpenChange, onSuccess }: EventDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    const isEdit = !!event;
    const queryClient = useQueryClient();

    const { data: disciplines = [], isLoading: loadingDisciplines } = useDisciplines();
    const { data: categories = [], isLoading: loadingCategories } = useCategories();
    const { data: locations = [], isLoading: loadingLocations } = useLocations();

    const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

    // Format date for input
    const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            return format(parseISO(dateStr), 'yyyy-MM-dd');
        } catch {
            return dateStr;
        }
    };

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            startDate: '',
            endDate: '',
            disciplineId: '',
            locationId: '',
            categoryIds: [],
            logoUrl: '',
            status: 'draft',
        },
    });

    // Sync form with event data when editing
    React.useEffect(() => {
        if (event && open) {
            reset({
                name: event.name,
                slug: event.slug || '',
                description: event.description || '',
                startDate: formatDateForInput(event.startDate),
                endDate: formatDateForInput(event.endDate),
                disciplineId: event.discipline?.id || '',
                locationId: event.location?.id || '',
                categoryIds: event.categories?.map(c => c.id) || [],
                logoUrl: event.logoUrl || '',
                status: event.status as EventFormData['status'],
            });
            setSelectedCategories(event.categories?.map(c => c.id) || []);
        } else if (!event && open) {
            reset({
                name: '',
                slug: '',
                description: '',
                startDate: '',
                endDate: '',
                disciplineId: '',
                locationId: '',
                categoryIds: [],
                logoUrl: '',
                status: 'draft',
            });
            setSelectedCategories([]);
        }
    }, [event, open, reset]);

    // Auto-generate slug from name in create mode
    const name = watch('name');
    React.useEffect(() => {
        if (!isEdit && name) {
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setValue('slug', slug);
        }
    }, [name, setValue, isEdit]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateEventRequest) => eventsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.all });
            toast.success('Event created successfully');
            setOpen(false);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create event');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateEventRequest) => eventsApi.update(event!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.all });
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(event!.id) });
            toast.success('Event updated successfully');
            setOpen(false);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update event');
        },
    });

    const onSubmit = (data: EventFormData) => {
        const payload = {
            ...data,
            categoryIds: selectedCategories,
            logoUrl: data.logoUrl || undefined,
            slug: data.slug || undefined,
            description: data.description || undefined,
            locationId: data.locationId || undefined,
        };

        if (isEdit) {
            updateMutation.mutate(payload as UpdateEventRequest);
        } else {
            createMutation.mutate(payload as CreateEventRequest);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    const statusOptions = getStatusOptions(isEdit ? 'edit' : 'create', event?.status);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? `Update details for "${event?.name}".` : 'Create a new tournament or competition event.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Name */}
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="name">Event Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., 2026 Ultimate Youth Tournament"
                                    {...register('name')}
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Slug */}
                            <div className="space-y-2 sm:col-span-2">
                                <Label htmlFor="slug">URL Slug</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">/discover/</span>
                                    <Input
                                        id="slug"
                                        placeholder={isEdit ? '' : 'auto-generated'}
                                        {...register('slug')}
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            {/* Discipline */}
                            <div className="space-y-2">
                                <Label htmlFor="disciplineId">Discipline *</Label>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={watch('disciplineId')}
                                        onValueChange={(value) => setValue('disciplineId', value, { shouldDirty: true })}
                                    >
                                        <SelectTrigger className={errors.disciplineId ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Select discipline" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loadingDisciplines ? (
                                                <SelectItem value="loading" disabled>Loading...</SelectItem>
                                            ) : (
                                                disciplines.map((d) => (
                                                    <SelectItem key={d.id} value={d.id}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <DisciplineDialog
                                        onSuccess={(d) => setValue('disciplineId', d.id, { shouldDirty: true })}
                                        trigger={
                                            <Button size="icon-sm" variant="ghost" type="button">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                </div>
                                {errors.disciplineId && (
                                    <p className="text-sm text-destructive">{errors.disciplineId.message}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={watch('status')}
                                    onValueChange={(value) => setValue('status', value as EventFormData['status'], { shouldDirty: true })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Location */}
                            <div className="space-y-2 sm:col-span-2 md:col-span-1">
                                <Label htmlFor="locationId">Location *</Label>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={watch('locationId')}
                                        onValueChange={(value) => setValue('locationId', value, { shouldDirty: true })}
                                    >
                                        <SelectTrigger className={errors.locationId ? 'border-destructive' : ''}>
                                            <SelectValue placeholder="Select location" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loadingLocations ? (
                                                <SelectItem value="loading" disabled>Loading...</SelectItem>
                                            ) : (
                                                locations.map((l) => (
                                                    <SelectItem key={l.id} value={l.id}>
                                                        {l.name} {l.city ? `(${l.city})` : ''}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <LocationDialog
                                        onSuccess={(l) => setValue('locationId', l.id, { shouldDirty: true })}
                                        trigger={
                                            <Button size="icon-sm" variant="ghost" type="button">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        }
                                    />
                                </div>
                                {errors.locationId && (
                                    <p className="text-sm text-destructive">{errors.locationId.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your event..."
                                rows={3}
                                {...register('description')}
                                className={errors.description ? 'border-destructive' : ''}
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">{errors.description.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Event Dates
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date *</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    {...register('startDate')}
                                    className={errors.startDate ? 'border-destructive' : ''}
                                />
                                {errors.startDate && (
                                    <p className="text-sm text-destructive">{errors.startDate.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date *</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    {...register('endDate')}
                                    className={errors.endDate ? 'border-destructive' : ''}
                                />
                                {errors.endDate && (
                                    <p className="text-sm text-destructive">{errors.endDate.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-4">
                        <Label>Categories</Label>
                        <div className="flex flex-wrap gap-2 items-center">
                            {loadingCategories ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            toggleCategory(cat.id);
                                            setValue('categoryIds', selectedCategories); // Trigger dirty state if needed, though we manage categories separately here
                                        }}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                                            selectedCategories.includes(cat.id)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                        )}
                                    >
                                        {cat.name}
                                    </button>
                                ))
                            )}
                            <CategoryDialog
                                onSuccess={(c) => setSelectedCategories(prev => [...prev, c.id])}
                                trigger={
                                    <Button size="sm" variant="outline" type="button">
                                        <Plus className="h-4 w-4 mr-1" />
                                        New
                                    </Button>
                                }
                            />
                        </div>
                    </div>

                    {/* Logo URL / Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="logoUrl">Event Logo</Label>
                        <FileUploader
                            value={watch('logoUrl')}
                            onChange={(url) => setValue('logoUrl', url, { shouldDirty: true })}
                            onRemove={() => setValue('logoUrl', '', { shouldDirty: true })}
                            label=""
                            description="Upload event logo (PNG, JPG or WEBP, max. 5MB)"
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
                            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending || (isEdit && !isDirty && selectedCategories.join(',') === event.categories?.map(c => c.id).join(','))}
                        >
                            {(isSubmitting || createMutation.isPending || updateMutation.isPending) && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {isEdit ? 'Save Changes' : 'Create Event'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default EventDialog;
