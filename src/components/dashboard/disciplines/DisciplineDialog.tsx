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
import { disciplinesApi } from '@/lib/api/disciplines';
import { disciplineKeys } from '@/lib/hooks/useDisciplines';
import { useCountries } from '@/lib/hooks/useGeographic';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trophy } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const disciplineSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name must be at most 100 characters'),
  slug: z.string().min(1, 'Slug required').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  rulesPdfUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  countryId: z.string().min(1, 'Country is required'),
});

type DisciplineForm = z.infer<typeof disciplineSchema>;

interface DisciplineDialogProps {
  discipline?: { id: string; name: string; slug: string; description?: string; rulesPdfUrl?: string; countryId: string } | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (item: { id: string; name: string }) => void;
}

export function DisciplineDialog({ discipline, trigger, open: controlledOpen, onOpenChange, onSuccess }: DisciplineDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const isEdit = !!discipline;
  const queryClient = useQueryClient();

  const { data: countries = [], isLoading: loadingCountries } = useCountries();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DisciplineForm>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: { name: '', slug: '', description: '', rulesPdfUrl: '', countryId: '' },
  });

  // Sync form with discipline data
  React.useEffect(() => {
    if (discipline && open) {
      reset({
        name: discipline.name,
        slug: discipline.slug,
        description: discipline.description || '',
        rulesPdfUrl: discipline.rulesPdfUrl || '',
        countryId: discipline.countryId,
      });
    } else if (!discipline && open) {
      reset({ name: '', slug: '', description: '', rulesPdfUrl: '', countryId: '' });
    }
  }, [discipline, open, reset]);

  const createMutation = useMutation({
    mutationFn: (data: DisciplineForm) => disciplinesApi.create(data),
    onSuccess: (disc) => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.list() });
      toast.success('Discipline created successfully');
      setOpen(false);
      onSuccess?.({ id: disc.id, name: disc.name });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create discipline'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: DisciplineForm) => disciplinesApi.update(discipline!.id, data),
    onSuccess: (disc) => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.list() });
      toast.success('Discipline updated successfully');
      setOpen(false);
      onSuccess?.({ id: discipline!.id, name: disc.name });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update discipline'),
  });

  const name = watch('name');
  const slugWasManuallyEdited = React.useRef(false);

  // Auto-slug generation
  React.useEffect(() => {
    if (name && !isEdit && !slugWasManuallyEdited.current) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setValue('slug', slug, { shouldValidate: true });
    }
  }, [name, setValue, isEdit]);

  const onSubmit = (data: DisciplineForm) => {
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
            <DialogTitle>{isEdit ? 'Edit Discipline' : 'New Discipline'}</DialogTitle>
          </div>
          <DialogDescription>
            {isEdit ? `Update the details for "${discipline?.name}".` : 'Register a new sports discipline for tournaments.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="disc-name">Name *</Label>
              <Input
                id="disc-name"
                placeholder="e.g., Beach Volleyball"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="disc-slug">Slug *</Label>
              <Input
                id="disc-slug"
                placeholder="e.g., beach-volleyball"
                {...register('slug')}
                onChange={(e) => {
                  slugWasManuallyEdited.current = true;
                  register('slug').onChange(e);
                }}
                className={errors.slug ? 'border-destructive' : ''}
              />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="disc-country">Host Country *</Label>
              <Select
                value={watch('countryId')}
                onValueChange={(val) => setValue('countryId', val, { shouldValidate: true, shouldDirty: true })}
                disabled={loadingCountries}
              >
                <SelectTrigger id="disc-country" className={errors.countryId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.countryId && <p className="text-xs text-destructive">{errors.countryId.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="disc-rules">Rules PDF URL</Label>
              <Input
                id="disc-rules"
                placeholder="https://example.com/rules.pdf"
                {...register('rulesPdfUrl')}
                className={errors.rulesPdfUrl ? 'border-destructive' : ''}
              />
              {errors.rulesPdfUrl && <p className="text-xs text-destructive">{errors.rulesPdfUrl.message}</p>}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="disc-description">Description</Label>
              <Textarea
                id="disc-description"
                placeholder="Describe the discipline, rules overview, etc..."
                {...register('description')}
                className="resize-none min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
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
              {isEdit ? 'Save Changes' : 'Create Discipline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
