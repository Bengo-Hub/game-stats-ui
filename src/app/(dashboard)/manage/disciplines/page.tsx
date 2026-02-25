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
import { disciplinesApi } from '@/lib/api/disciplines';
import { disciplineKeys, useDisciplines } from '@/lib/hooks/useDisciplines';
import { usePermissions } from '@/lib/hooks/usePermission';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

// simple zod schema
const disciplineSchema = z.object({
  name: z.string().min(1, 'Name required'),
  slug: z.string().min(1, 'Slug required'),
  description: z.string().optional(),
  rulesPdfUrl: z.string().url().optional().or(z.literal('')),
  countryId: z.string().min(1, 'Country is required'),
});

type DisciplineForm = z.infer<typeof disciplineSchema>;

export default function DisciplinesPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const router = useRouter();
  React.useEffect(() => {
    if (!can('manage_events')) {
      router.replace('/dashboard');
    }
  }, [can, router]);

  const { data: disciplines = [], isLoading } = useDisciplines();
  const [editing, setEditing] = React.useState<{id?: string} & DisciplineForm | null>(null);

  const saveMutation = useMutation({
    mutationFn: (data: {id?: string} & DisciplineForm) =>
      data.id ? disciplinesApi.update(data.id, data) : disciplinesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.list() });
      toast.success('Saved');
      setEditing(null);
    },
    onError: err => {
      toast.error('Failed to save');
    },
  });
  const saving = (saveMutation as any).isLoading as boolean;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => disciplinesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.list() });
      toast.success('Deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const onSubmit = (data: DisciplineForm) => {
    saveMutation.mutate({ ...(editing || {}), ...data });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Disciplines" description="Manage sports disciplines" />
      <div className="flex justify-end">
        <Button onClick={() => setEditing({} as any)}>New Discipline</Button>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Country ID</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {disciplines.map(d => (
              <tr key={d.id} className="border-t">
                <td>{d.name}</td>
                <td>{d.slug}</td>
                <td>{d.countryId}</td>
                <td className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(d as any)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(d.id)}>
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
            <DialogTitle>{editing?.id ? 'Edit Discipline' : 'New Discipline'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const data = Object.fromEntries(new FormData(form)) as DisciplineForm;
              onSubmit(data);
            }}
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editing?.name || ''} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" defaultValue={editing?.slug || ''} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="countryId">Country ID</Label>
                <Input id="countryId" name="countryId" defaultValue={editing?.countryId || ''} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editing?.description || ''} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rulesPdfUrl">Rules PDF URL</Label>
                <Input id="rulesPdfUrl" name="rulesPdfUrl" defaultValue={editing?.rulesPdfUrl || ''} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
