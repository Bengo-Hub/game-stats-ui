'use client';

import { DisciplineDialog } from '@/components/dashboard/disciplines/DisciplineDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { disciplinesApi } from '@/lib/api/disciplines';
import { disciplineKeys, useDisciplines } from '@/lib/hooks/useDisciplines';
import { useCountries } from '@/lib/hooks/useGeographic';
import { usePermissions } from '@/lib/hooks/usePermission';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Globe,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

export default function DisciplinesPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const router = useRouter();

  React.useEffect(() => {
    if (!can('manage_events')) {
      router.replace('/dashboard');
    }
  }, [can, router]);

  const { data: disciplinesResponse, isLoading, isFetching, refetch } = useDisciplines();
  const disciplines = (disciplinesResponse as any)?.data || [];
  const { data: countries = [] } = useCountries();

  const [editingDiscipline, setEditingDiscipline] = React.useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = React.useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => disciplinesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplineKeys.list() });
      toast.success('Discipline deleted successfully');
      setDeleteConfirmOpen(false);
      setDisciplineToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete discipline');
    },
  });

  const handleDeleteClick = (id: string) => {
    setDisciplineToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const getCountryName = (id: string) => {
    return countries.find(c => c.id === id)?.name || id;
  };

  const canManage = can('manage_events');

  return (
    <div className="space-y-6">
      <PageHeader title="Disciplines" description="Manage sports and athletic disciplines">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
          {canManage && (
            <DisciplineDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Discipline
                </Button>
              }
            />
          )}
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : disciplines.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-12 w-12" />}
          title="No disciplines found"
          description="Disciplines define the types of sports played in your events."
          action={
            canManage && (
              <DisciplineDialog
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Discipline
                  </Button>
                }
              />
            )
          }
        />
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Discipline Name</TableHead>
                <TableHead className="font-bold">Slug</TableHead>
                <TableHead className="font-bold">Host Country</TableHead>
                <TableHead className="font-bold hidden md:table-cell">Rules PDF</TableHead>
                <TableHead className="w-[80px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplines.map((discipline: any) => (
                <TableRow key={discipline.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{discipline.name}</TableCell>
                  <TableCell className="font-mono text-xs">{discipline.slug}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{getCountryName(discipline.countryId)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {discipline.rulesPdfUrl ? (
                      <Badge variant="outline" className="font-normal">
                        Available
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => setEditingDiscipline(discipline)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(discipline.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Editing Dialog */}
      <DisciplineDialog
        discipline={editingDiscipline}
        open={!!editingDiscipline}
        onOpenChange={(open) => !open && setEditingDiscipline(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the discipline.
              Tournament events and divisions associated with this discipline may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => disciplineToDelete && deleteMutation.mutate(disciplineToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Discipline'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
