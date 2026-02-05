'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, CalendarDays } from 'lucide-react';
import { eventsApi, type CreateEventRequest } from '@/lib/api/events';
import { eventKeys } from '@/lib/hooks/useEventsQuery';
import type { EventCategory } from '@/types';
import { cn } from '@/lib/utils';

// Validation schema
const createEventSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name must be less than 100 characters'),
  slug: z.string().optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  disciplineId: z.string().min(1, 'Please select a discipline'),
  locationId: z.string().optional(),
  categories: z.array(z.string()).optional(),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

// Available categories
const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'beach', label: 'Beach' },
  { value: 'hat', label: 'Hat Tournament' },
  { value: 'league', label: 'League' },
];

// Mock disciplines - replace with API call
const DISCIPLINES = [
  { id: 'ultimate', name: 'Ultimate' },
  { id: 'disc-golf', name: 'Disc Golf' },
  { id: 'freestyle', name: 'Freestyle' },
];

export function CreateEventDialog({ trigger, onSuccess }: CreateEventDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = React.useState<EventCategory[]>([]);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      startDate: '',
      endDate: '',
      disciplineId: '',
      locationId: '',
      categories: [],
      logoUrl: '',
      status: 'draft',
    },
  });

  // Auto-generate slug from name
  const name = watch('name');
  React.useEffect(() => {
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug);
    }
  }, [name, setValue]);

  // Mutation for creating event
  const createMutation = useMutation({
    mutationFn: (data: CreateEventRequest) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event created successfully');
      setOpen(false);
      reset();
      setSelectedCategories([]);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create event');
    },
  });

  const onSubmit = (data: CreateEventFormData) => {
    const request: CreateEventRequest = {
      ...data,
      categories: selectedCategories,
      logoUrl: data.logoUrl || undefined,
      slug: data.slug || undefined,
      description: data.description || undefined,
      locationId: data.locationId || undefined,
    };
    createMutation.mutate(request);
  };

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Create a new tournament or competition event.
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
                    placeholder="auto-generated"
                    {...register('slug')}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Discipline */}
              <div className="space-y-2">
                <Label htmlFor="disciplineId">Discipline *</Label>
                <Select onValueChange={(value) => setValue('disciplineId', value)}>
                  <SelectTrigger className={errors.disciplineId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCIPLINES.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.disciplineId && (
                  <p className="text-sm text-destructive">{errors.disciplineId.message}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => setValue('status', value as 'draft' | 'published')} defaultValue="draft">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
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
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => toggleCategory(cat.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedCategories.includes(cat.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              placeholder="https://example.com/logo.png"
              {...register('logoUrl')}
              className={errors.logoUrl ? 'border-destructive' : ''}
            />
            {errors.logoUrl && (
              <p className="text-sm text-destructive">{errors.logoUrl.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting || createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {(isSubmitting || createMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateEventDialog;
