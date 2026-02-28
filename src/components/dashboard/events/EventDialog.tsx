'use client';

import { CategoryDialog } from '@/components/dashboard/categories/CategoryDialog';
import { DisciplineDialog } from '@/components/dashboard/disciplines/DisciplineDialog';
import { LocationSelector } from '@/components/features/locations/LocationSelector';
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
import { CalendarDays, CircleDot, Loader2, Plus } from 'lucide-react';
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
    divisions: z.array(z.object({
        name: z.string().min(1, 'Name is required'),
        divisionType: z.enum(['pool', 'bracket', 'mixed'])
    })).optional(),
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
            divisions: [],
        },
    });

    const [nestedDivisions, setNestedDivisions] = React.useState<{ name: string; divisionType: 'pool' | 'bracket' | 'mixed' }[]>([]);

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
                divisions: event.divisions?.map(d => ({ name: d.name, divisionType: d.divisionType as any })) || [],
            });
            setSelectedCategories(event.categories?.map(c => c.id) || []);
            setNestedDivisions(event.divisions?.map(d => ({ name: d.name, divisionType: d.divisionType as any })) || []);
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
                divisions: [],
            });
            setSelectedCategories([]);
            setNestedDivisions([]);
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
            divisions: nestedDivisions,
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

    const addNestedDivision = () => {
        setNestedDivisions(prev => [...prev, { name: '', divisionType: 'pool' }]);
    };

    const removeNestedDivision = (index: number) => {
        setNestedDivisions(prev => prev.filter((_, i) => i !== index));
    };

    const updateNestedDivision = (index: number, field: string, value: string) => {
        setNestedDivisions(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
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
                                <LocationSelector
                                    value={watch('locationId')}
                                    onValueChange={(value) => setValue('locationId', value, { shouldDirty: true })}
                                    className={errors.locationId ? 'border-destructive' : ''}
                                />
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

                    {/* Divisions Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <CircleDot className="h-4 w-4" />
                                Divisions & Pools
                            </h3>
                            <Button type="button" variant="outline" size="sm" onClick={addNestedDivision}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {nestedDivisions.map((div, index) => (
                                <div key={index} className="flex gap-3 items-start bg-muted/30 p-3 rounded-xl border group hover:border-primary/30 transition-colors">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            placeholder="Division Name (e.g. Open, Pool A)"
                                            value={div.name}
                                            onChange={(e) => updateNestedDivision(index, 'name', e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <Select
                                            value={div.divisionType}
                                            onValueChange={(val) => updateNestedDivision(index, 'divisionType', val)}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pool">Pool / Round Robin</SelectItem>
                                                <SelectItem value="bracket">Elimination Bracket</SelectItem>
                                                <SelectItem value="mixed">Mixed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => removeNestedDivision(index)}
                                    >
                                        <Plus className="h-4 w-4 rotate-45" />
                                    </Button>
                                </div>
                            ))}
                            {nestedDivisions.length === 0 && (
                                <p className="text-xs text-center py-2 text-muted-foreground italic">
                                    Optional: Add initial divisions now or manage them later from the event page.
                                </p>
                            )}
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
