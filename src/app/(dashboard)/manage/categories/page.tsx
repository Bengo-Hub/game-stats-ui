'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import { categoriesApi } from '@/lib/api/categories';
import { categoryKeys, useCategories } from '@/lib/hooks/useCategories';
import { usePermissions } from '@/lib/hooks/usePermission';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

// simple zod schema
const categorySchema = z.object({
  name: z.string().min(1, 'Name required'),
  slug: z.string().min(1, 'Slug required'),
  description: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const router = useRouter();
  React.useEffect(() => {
    if (!can('manage_events')) {
      router.replace('/dashboard');
    }
  }, [can, router]);

  const { data: categories = [], isLoading } = useCategories();
  const [editing, setEditing] = React.useState<{id?: string} & CategoryForm | null>(null);

  const saveMutation = useMutation({
    mutationFn: (data: {id?: string} & CategoryForm) =>
      data.id ? categoriesApi.update(data.id, data) : categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
      toast.success('Saved');
      setEditing(null);
    },
    onError: err => {
      toast.error('Failed to save');
    },
  });
  const saving = (saveMutation as any).isLoading as boolean;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
      toast.success('Deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const onSubmit = (data: CategoryForm) => {
    saveMutation.mutate({ ...(editing || {}), ...data });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Categories" description="Manage event categories" />
      <div className="flex justify-end">
        <Button onClick={() => setEditing({} as any)}>New Category</Button>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className="border-t">
                <td>{c.name}</td>
                <td>{c.slug}</td>
                <td className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(c as any)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(c.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* modal form */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data: any = {};
              formData.forEach((value, key) => (data[key] = value));
              onSubmit(data as CategoryForm);
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editing?.name || ''}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={editing?.slug || ''}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editing?.description || ''}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
