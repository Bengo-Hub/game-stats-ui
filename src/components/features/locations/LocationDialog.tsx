'use client';

import { CountryDialog } from '@/components/dashboard/countries/CountryDialog';
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
import { geographicApi } from '@/lib/api/geographic';
import { geographicKeys, useCountries } from '@/lib/hooks/useGeographic';
import { zodResolver } from '@hookform/resolvers/zod';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Search } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const libraries: ("places")[] = ["places"];

const locationSchema = z.object({
    name: z.string().min(1, 'Name required'),
    address: z.string().optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    countryId: z.string().min(1, 'Country selection required'),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface LocationDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    onSuccess?: (created: { id: string; name: string }) => void;
    defaultCountryId?: string;
}

export function LocationDialog({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger,
    onSuccess,
    defaultCountryId
}: LocationDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = controlledOnOpenChange ?? setInternalOpen;

    const [autocomplete, setAutocomplete] = React.useState<google.maps.places.Autocomplete | null>(null);
    const queryClient = useQueryClient();

    const { data: countries = [], isLoading: loadingCountries } = useCountries();

    // Load Google Maps script
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<LocationFormData>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            name: '',
            address: '',
            city: 'Nairobi',
            latitude: -1.286389,
            longitude: 36.817222,
            countryId: defaultCountryId || 'd3430594-7fee-4201-9cf3-4daa3c7ceba7' // Kenya Country ID
        },
    });

    const mutation = useMutation({
        mutationFn: (data: LocationFormData) => geographicApi.createLocation(data),
        onSuccess: (loc) => {
            queryClient.invalidateQueries({ queryKey: geographicKeys.locations() });
            toast.success('Location created');
            reset();
            setOpen(false);
            onSuccess?.({ id: loc.id, name: loc.name });
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to create location');
        },
    });

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setValue('latitude', lat);
                setValue('longitude', lng);
                setValue('address', place.formatted_address || '');

                // Try to extract city
                const cityObj = place.address_components?.find(c => c.types.includes('locality'));
                if (cityObj) setValue('city', cityObj.long_name);

                // If name is empty, use place name
                if (place.name) setValue('name', place.name);
            }
        }
    };

    const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
        setAutocomplete(autocompleteInstance);
    };

    const onSubmit = (data: LocationFormData) => mutation.mutate(data);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>New Location</DialogTitle>
                    <DialogDescription>
                        Search for a place or enter details manually.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
                        <div className="space-y-2">
                            <Label>Address Search (Google Maps)</Label>
                            {isLoaded ? (
                                <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search for a location..."
                                            className="pl-9"
                                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        />
                                    </div>
                                </Autocomplete>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input disabled placeholder={loadError ? "Maps Error" : "Loading Google Maps..."} className="pl-9" />
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">Search and select a place to auto-fill details.</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Location Name *</Label>
                        <Input id="name" {...register('name')} placeholder="e.g. Nyayo National Stadium" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" {...register('city')} placeholder="e.g. Nairobi" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="countryId">Country *</Label>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={watch('countryId')}
                                    onValueChange={(val) => setValue('countryId', val)}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {loadingCountries ? (
                                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                                        ) : (
                                            countries.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                <CountryDialog
                                    onSuccess={(c) => setValue('countryId', c.id)}
                                    trigger={
                                        <Button variant="ghost" size="icon" type="button" className="h-9 w-9">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                            </div>
                            {errors.countryId && <p className="text-sm text-destructive">{errors.countryId.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Full Address</Label>
                        <Input id="address" {...register('address')} placeholder="123 Stadium Way, Nairobi" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                {...register('latitude', { valueAsNumber: true })}
                                placeholder="-1.286"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                {...register('longitude', { valueAsNumber: true })}
                                placeholder="36.817"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending || isSubmitting}>
                            {(mutation.isPending || isSubmitting) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {mutation.isPending ? 'Creating...' : 'Create Location'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
