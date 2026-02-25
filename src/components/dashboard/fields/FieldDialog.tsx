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
import { geographicKeys, useLocations } from '@/lib/hooks/useGeographic';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { LocationDialog } from '../locations/LocationDialog';

const fieldSchema = z.object({
    name: z.string().min(1, 'Name required'),
    locationId: z.string().min(1, 'Location required'),
    capacity: z.number().optional(),
    surfaceType: z.string().optional(),
});

type FieldFormData = z.infer<typeof fieldSchema>;

interface FieldDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: (created: { id: string; name: string }) => void;
    defaultLocationId?: string;
}

export function FieldDialog({ trigger, onSuccess, defaultLocationId }: FieldDialogProps) {
    const [open, setOpen] = React.useState(false);
    const queryClient = useQueryClient();

    const { data: locations = [], isLoading: loadingLocations } = useLocations();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FieldFormData>({
        resolver: zodResolver(fieldSchema),
        defaultValues: {
            name: '',
            locationId: defaultLocationId || '',
            capacity: undefined,
            surfaceType: '',
        },
    });

    // Handle defaultLocationId changes
    React.useEffect(() => {
        if (defaultLocationId) {
            setValue('locationId', defaultLocationId);
        }
    }, [defaultLocationId, setValue]);

    const mutation = useMutation({
        mutationFn: (data: FieldFormData) => geographicApi.createField({
            name: data.name,
            location_id: data.locationId,
            capacity: data.capacity,
            surface_type: data.surfaceType,
        }),
        onSuccess: (field) => {
            queryClient.invalidateQueries({ queryKey: geographicKeys.fields() });
            toast.success('Field created');
            reset();
            setOpen(false);
            onSuccess?.({ id: field.id, name: field.name });
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to create field');
        },
    });

    const onSubmit = (data: FieldFormData) => mutation.mutate(data);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" type="button">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Playing Field</DialogTitle>
                    <DialogDescription>
                        Add a new field to a location.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="locationId">Location *</Label>
                        <div className="flex items-center gap-2">
                            <Select
                                value={watch('locationId')}
                                onValueChange={(val) => setValue('locationId', val)}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingLocations ? (
                                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                                    ) : (
                                        locations.map(l => (
                                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <LocationDialog
                                onSuccess={(l) => setValue('locationId', l.id)}
                                trigger={
                                    <Button variant="ghost" size="icon" type="button" className="h-9 w-9">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                }
                            />
                        </div>
                        {errors.locationId && <p className="text-sm text-destructive">{errors.locationId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Field Name / Number *</Label>
                        <Input id="name" {...register('name')} placeholder="e.g. Field 1 or Main Pitch" />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="surfaceType">Surface Type</Label>
                            <Select
                                value={watch('surfaceType')}
                                onValueChange={(val) => setValue('surfaceType', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grass">Grass</SelectItem>
                                    <SelectItem value="turf">Artificial Turf</SelectItem>
                                    <SelectItem value="indoor">Indoor / Court</SelectItem>
                                    <SelectItem value="sand">Sand / Beach</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Capacity (Optional)</Label>
                            <Input
                                id="capacity"
                                type="number"
                                {...register('capacity', { valueAsNumber: true })}
                                placeholder="e.g. 500"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending || isSubmitting}>
                            {(mutation.isPending || isSubmitting) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {mutation.isPending ? 'Creating...' : 'Create Field'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
