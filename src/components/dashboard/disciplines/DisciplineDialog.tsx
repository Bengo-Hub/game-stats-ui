'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { disciplinesApi } from '@/lib/api/disciplines';
import { disciplineKeys } from '@/lib/hooks/useDisciplines';
import { useCountries } from '@/lib/hooks/useGeographic';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// schema matches backend DTO
const disciplineSchema = z.object({
  name: z.string().min(1, 'Name required'),
  slug: z.string().min(1, 'Slug required'),
  description: z.string().optional(),
  rulesPdfUrl: z.string().url().optional().or(z.literal('')),
  countryId: z.string().min(1, 'Country is required'),
});

type DisciplineForm = z.infer<typeof disciplineSchema>;

interface DisciplineDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (created: { id: string; name: string } ) => void;
}

export function DisciplineDialog({ trigger, onSuccess }: DisciplineDialogProps) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: countries = [], isLoading: loadingCountries } = useCountries();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DisciplineForm>({
    resolver: zodResolver(disciplineSchema),
    defaultValues: { name: '', slug: '', description: '', rulesPdfUrl: '', countryId: '' },
  });

  const mutation = useMutation({
    mutationFn: (data: DisciplineForm) => disciplinesApi.create(data),
    onSuccess: (disc) => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.list() });
      toast.success('Discipline created');
      reset();
      setOpen(false);
      onSuccess?.({ id: disc.id, name: disc.name });
    },
    onError: () => toast.error('Failed to create discipline'),
  });

  // auto-generate slug from name
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

  const onSubmit = (data: DisciplineForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger>
          <Button size="icon-sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Discipline</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register('slug')} />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="countryId">Country</Label>
            <select
              id="countryId"
              {...register('countryId')}
              className="w-full border rounded px-2 py-1"
              disabled={loadingCountries}
            >
              <option value="">Select country</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.countryId && <p className="text-sm text-destructive">{errors.countryId.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rulesPdfUrl">Rules PDF URL</Label>
            <Input id="rulesPdfUrl" {...register('rulesPdfUrl')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending || isSubmitting}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
