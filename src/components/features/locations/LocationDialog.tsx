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
import { geographicApi, type CreateLocationRequest } from '@/lib/api/geographic';
import { useCountries } from '@/lib/hooks/useGeographic';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const locationSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    city: z.string().optional(),
    address: z.string().optional(),
    countryId: z.string().uuid('Please select a country'),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (location: any) => void;
}

export function LocationDialog({ open, onOpenChange, onSuccess }: LocationDialogProps) {
    const queryClient = useQueryClient();
    const { data: countries = [], isLoading: isLoadingCountries } = useCountries();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<LocationFormData>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            name: '',
            city: '',
            address: '',
            countryId: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateLocationRequest) => geographicApi.createLocation(data),
        onSuccess: (newLocation) => {
            queryClient.invalidateQueries({ queryKey: ['geographic', 'locations'] });
            toast.success('Location created successfully');
            onSuccess?.(newLocation);
            onOpenChange(false);
            reset();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create location');
        },
    });

    const onSubmit = (data: LocationFormData) => {
        createMutation.mutate(data as CreateLocationRequest);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Location</DialogTitle>
                    <DialogDescription>
                        Create a new venue or tournament location.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Location Name *</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Riverside Sports Complex"
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="countryId">Country *</Label>
                        <select
                            id="countryId"
                            {...register('countryId')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Select a country</option>
                            {countries.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.countryId && (
                            <p className="text-sm text-destructive">{errors.countryId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="e.g., Nairobi" {...register('city')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address / Details</Label>
                        <Input id="address" placeholder="e.g., 123 Sports Way" {...register('address')} />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending || isLoadingCountries}>
                            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Location
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
