'use client';

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
import { geographicKeys, useContinents } from '@/lib/hooks/useGeographic';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const countrySchema = z.object({
    name: z.string().min(1, 'Name required'),
    slug: z.string().min(1, 'Slug required'),
    code: z.string().min(2, 'Code required (e.g. KE, US)').max(3, 'Code too long'),
    continentId: z.string().min(1, 'Continent selection required'),
});

type CountryFormData = z.infer<typeof countrySchema>;

interface CountryDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: (created: { id: string; name: string }) => void;
}

export function CountryDialog({ trigger, onSuccess }: CountryDialogProps) {
    const [open, setOpen] = React.useState(false);
    const queryClient = useQueryClient();
    const { data: continents = [], isLoading: loadingContinents } = useContinents();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CountryFormData>({
        resolver: zodResolver(countrySchema),
        defaultValues: {
            name: '',
            slug: '',
            code: '',
            continentId: '',
        },
    });

    // Auto-slug
    const name = watch('name');
    React.useEffect(() => {
        if (name) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            setValue('slug', slug);
        }
    }, [name, setValue]);

    const createMutation = useMutation({
        mutationFn: (data: CountryFormData) => geographicApi.createCountry(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: geographicKeys.countries() });
            toast.success('Country created successfully');
            setOpen(false);
            reset();
            onSuccess?.({ id: data.id, name: data.name });
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to create country');
        },
    });

    const onSubmit = (data: CountryFormData) => {
        createMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" type="button">
                        <Plus className="h-4 w-4 mr-2" />
                        New Country
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Country</DialogTitle>
                    <DialogDescription>
                        Create a new country entry for locations.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="country-name">Country Name *</Label>
                        <Input
                            id="country-name"
                            placeholder="e.g. Kenya"
                            {...register('name')}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="country-slug">Slug *</Label>
                            <Input
                                id="country-slug"
                                placeholder="kenya"
                                {...register('slug')}
                            />
                            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country-code">ISO Code *</Label>
                            <Input
                                id="country-code"
                                placeholder="KE"
                                {...register('code')}
                            />
                            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="continentId">Continent *</Label>
                        <Select
                            onValueChange={(val) => setValue('continentId', val)}
                            value={watch('continentId')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select continent" />
                            </SelectTrigger>
                            <SelectContent>
                                {loadingContinents ? (
                                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : (
                                    continents.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {errors.continentId && <p className="text-xs text-destructive">{errors.continentId.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create Country
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
