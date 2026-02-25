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
import { Textarea } from '@/components/ui/textarea';
import { eventsApi } from '@/lib/api/events';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleDot, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const divisionSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
    divisionType: z.enum(['pool', 'bracket', 'mixed']),
    description: z.string().optional(),
});

type DivisionForm = z.infer<typeof divisionSchema>;

interface DivisionDialogProps {
    eventId: string;
    division?: { id: string; name: string; divisionType: string; description?: string } | null;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
}

export function DivisionDialog({ eventId, division, trigger, open: controlledOpen, onOpenChange, onSuccess }: DivisionDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    const isEdit = !!division;
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<DivisionForm>({
        resolver: zodResolver(divisionSchema),
        defaultValues: {
            name: '',
            divisionType: 'pool',
            description: '',
        },
    });

    // Sync form with division data
    React.useEffect(() => {
        if (division && open) {
            reset({
                name: division.name,
                divisionType: division.divisionType as any,
                description: division.description || '',
            });
        } else if (!division && open) {
            reset({ name: '', divisionType: 'pool', description: '' });
        }
    }, [division, open, reset]);

    const createMutation = useMutation({
        mutationFn: (data: DivisionForm) => eventsApi.createDivision(eventId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId, 'divisions'] });
            toast.success('Division created successfully');
            setOpen(false);
            onSuccess?.();
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to create division'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: DivisionForm) => eventsApi.updateDivision(eventId, division!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId, 'divisions'] });
            toast.success('Division updated successfully');
            setOpen(false);
            onSuccess?.();
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to update division'),
    });

    const onSubmit = (data: DivisionForm) => {
        if (isEdit) {
            updateMutation.mutate(data);
        } else {
            createMutation.mutate(data);
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || isSubmitting;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <CircleDot className="h-5 w-5" />
                        </div>
                        <DialogTitle>{isEdit ? 'Edit Division' : 'Add Division'}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {isEdit ? `Update the settings for ${division?.name}.` : 'Create a new division or pool for this tournament.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="div-name">Division Name *</Label>
                        <Input
                            id="div-name"
                            placeholder="e.g., Open Division, Pool A"
                            {...register('name')}
                            className={errors.name ? 'border-destructive' : ''}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="div-type">Division Type *</Label>
                        <Select
                            value={watch('divisionType')}
                            onValueChange={(val) => setValue('divisionType', val as any, { shouldValidate: true, shouldDirty: true })}
                        >
                            <SelectTrigger id="div-type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pool">Pool / Round Robin</SelectItem>
                                <SelectItem value="bracket">Elimination Bracket</SelectItem>
                                <SelectItem value="mixed">Mixed (Pool + Bracket)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.divisionType && <p className="text-xs text-destructive">{errors.divisionType.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="div-description">Description</Label>
                        <Textarea
                            id="div-description"
                            placeholder="Optional details about this division..."
                            {...register('description')}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || (isEdit && !isDirty)}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isEdit ? 'Save Changes' : 'Create Division'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
