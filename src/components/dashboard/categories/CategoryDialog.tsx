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
import { Textarea } from '@/components/ui/textarea';
import { categoriesApi } from '@/lib/api/categories';
import { categoryKeys } from '@/lib/hooks/useCategories';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Tag } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name must be at most 100 characters'),
  slug: z.string().min(1, 'Slug required').regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  category?: { id: string; name: string; slug: string; description?: string } | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (item: { id: string; name: string }) => void;
}

export function CategoryDialog({ category, trigger, open: controlledOpen, onOpenChange, onSuccess }: CategoryDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const isEdit = !!category;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '', description: '' },
  });

  // Sync form with category data
  React.useEffect(() => {
    if (category && open) {
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
      });
    } else if (!category && open) {
      reset({ name: '', slug: '', description: '' });
    }
  }, [category, open, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CategoryForm) => categoriesApi.create(data),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
      toast.success('Category created successfully');
      setOpen(false);
      onSuccess?.({ id: cat.id, name: cat.name });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CategoryForm) => categoriesApi.update(category!.id, data),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
      toast.success('Category updated successfully');
      setOpen(false);
      onSuccess?.({ id: category!.id, name: cat.name });
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update category'),
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

  const onSubmit = (data: CategoryForm) => {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <DialogTitle>{isEdit ? 'Edit Category' : 'New Category'}</DialogTitle>
          </div>
          <DialogDescription>
            {isEdit ? `Update the details for "${category?.name}".` : 'Create a new category for tournament events.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                placeholder="e.g., International"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input
                id="cat-slug"
                placeholder="e.g., international"
                {...register('slug')}
                onChange={(e) => {
                  slugWasManuallyEdited.current = true;
                  register('slug').onChange(e);
                }}
                className={errors.slug ? 'border-destructive' : ''}
              />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Used in URLs. Only lowercase, numbers and hyphens.</p>
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-description">Description</Label>
              <Textarea
                id="cat-description"
                placeholder="Brief description of this category..."
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
              {isEdit ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
