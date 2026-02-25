'use client';

import { CategoryDialog } from '@/components/dashboard/categories/CategoryDialog';
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
import { categoriesApi } from '@/lib/api/categories';
import { categoryKeys, useCategories } from '@/lib/hooks/useCategories';
import { usePermissions } from '@/lib/hooks/usePermission';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  MoreVertical,
  Plus,
  RefreshCw,
  Tag,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const router = useRouter();

  React.useEffect(() => {
    if (!can('manage_events')) {
      router.replace('/dashboard');
    }
  }, [can, router]);

  const { data: categories = [], isLoading, isFetching, refetch } = useCategories();
  const [editingCategory, setEditingCategory] = React.useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.list() });
      toast.success('Category deleted successfully');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const canManage = can('manage_events');

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Manage event categories and classifications">
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
            <CategoryDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Category
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
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-12 w-12" />}
          title="No categories found"
          description="Categories help group and classify your tournament events."
          action={
            canManage && (
              <CategoryDialog
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Category
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
                <TableHead className="font-bold">Category Name</TableHead>
                <TableHead className="font-bold">Slug</TableHead>
                <TableHead className="font-bold hidden md:table-cell">Description</TableHead>
                <TableHead className="w-[80px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="font-mono text-xs">{category.slug}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[300px] truncate">
                    {category.description || <span className="italic opacity-50 text-xs">No description</span>}
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
                          <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(category.id)}
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
      <CategoryDialog
        category={editingCategory}
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category.
              Events using this category may no longer be correctly classified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => categoryToDelete && deleteMutation.mutate(categoryToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
