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
import { teamsApi, type CreateTeamRequest } from '@/lib/api/teams';
import { eventKeys } from '@/lib/hooks/useEventsQuery';
import { teamKeys } from '@/lib/hooks/useTeamsQuery';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Palette, Plus, Upload, Users } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema
const createTeamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  eventId: z.string().min(1, 'Please select an event'),
  divisionPoolId: z.string().min(1, 'Please select a division'),
  initialSeed: z.number().min(0).max(999).optional(),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  locationName: z.string().optional(),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamDialogProps {
  trigger?: React.ReactNode;
  eventId?: string;
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
];

export function CreateTeamDialog({ trigger, eventId, onSuccess }: CreateTeamDialogProps) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      eventId: eventId || '',
      divisionPoolId: '',
      initialSeed: 0,
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
  const logoUrl = watch('logoUrl');


  // Fetch available events
  const { data: events = [] } = useQuery({
    queryKey: eventKeys.list({ status: 'published' }),
    queryFn: () => publicApi.listEvents({ status: 'published', limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch selected event details (for divisions)
  const { data: eventDetails } = useQuery({
    queryKey: eventKeys.detail(selectedEventId),
    queryFn: () => publicApi.getEvent(selectedEventId),
    enabled: !!selectedEventId,
    staleTime: 1000 * 60 * 5,
  });

  // Reset division when event changes
  React.useEffect(() => {
    if (selectedEventId) {
      setValue('divisionPoolId', '');
    }
  }, [selectedEventId, setValue]);

  // Mutation for creating team
  const createMutation = useMutation({
    mutationFn: (data: CreateTeamRequest) => teamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      toast.success('Team created successfully');
      setOpen(false);
      reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create team');
    },
  });

  const onSubmit = (data: CreateTeamFormData) => {
    const request: CreateTeamRequest = {
      name: data.name,
      divisionPoolId: data.divisionPoolId,
      initialSeed: data.initialSeed,
      logoUrl: data.logoUrl || undefined,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      locationName: data.locationName || undefined,
    };
    createMutation.mutate(request);
  };

  const divisions = eventDetails?.divisions || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
          <DialogDescription>
            Register a new team for a tournament event.
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
              </div>

              {/* Event Selection */}
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

              {/* Division Selection */}
              <div className="space-y-2">
                <Label htmlFor="divisionPoolId">Division *</Label>
                <Select
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
                        onClick={() => setValue('primaryColor', color.value)}
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
                        onClick={() => setValue('secondaryColor', color.value)}
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
              onChange={(url) => setValue('logoUrl', url)}
              onRemove={() => setValue('logoUrl', '')}
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
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTeamDialog;
