'use client';

import { DivisionDialog } from '@/components/dashboard/divisions/DivisionDialog';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { eventsApi } from '@/lib/api/events';
import { divisionKeys, useDivisionsQuery } from '@/lib/hooks/useDivisionsQuery';
import { useEventsQuery } from '@/lib/hooks/useEventsQuery';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    CircleDot,
    Edit,
    MoreVertical,
    Plus,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export default function DivisionsPage() {
    const queryClient = useQueryClient();
    const [eventFilter, setEventFilter] = React.useState<string>('');
    const [editingDivision, setEditingDivision] = React.useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Fetch all events for the filter
    const { data: eventsResponse, isLoading: loadingEvents } = useEventsQuery();
    const events = (eventsResponse as any)?.data || [];

    // Set default event if none selected and events are loaded
    React.useEffect(() => {
        if (!eventFilter && events.length > 0) {
            setEventFilter(events[0].id);
        }
    }, [events, eventFilter]);

    // Fetch divisions for selected event
    const {
        data: divisionsResponse,
        isLoading: loadingDivisions,
        isError,
        error,
        isFetching,
        refetch,
    } = useDivisionsQuery(eventFilter);
    const divisions = (divisionsResponse as any)?.data || (Array.isArray(divisionsResponse) ? divisionsResponse : []);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => eventsApi.deleteDivision(eventFilter, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: divisionKeys.all });
            toast.success('Division deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete division');
        },
    });

    const handleDelete = (id: string) => {
        setDeleteId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            await deleteMutation.mutateAsync(deleteId);
        } finally {
            setIsDeleting(false);
            setDeleteConfirmOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <PageHeader title="Divisions" description="Manage tournament divisions and pools">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching || loadingDivisions}
                    >
                        <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                        <span className="hidden sm:inline ml-2">Refresh</span>
                    </Button>
                    {eventFilter && (
                        <DivisionDialog
                            eventId={eventFilter}
                            onSuccess={() => refetch()}
                            trigger={
                                <Button size="sm">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-2">Add Division</span>
                                </Button>
                            }
                        />
                    )}
                </div>
            </PageHeader>

            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border">
                <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter by Event:</label>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger className="w-full max-w-md bg-background">
                        <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                        {events.map((ev: any) => (
                            <SelectItem key={ev.id} value={ev.id}>{ev.name} ({new Date(ev.startDate).getFullYear()})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{error instanceof Error ? error.message : 'Failed to load divisions'}</p>
                </div>
            )}

            {loadingDivisions ? (
                <Card className="p-0 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Division Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Teams</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3].map((i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            ) : divisions.length === 0 ? (
                <EmptyState
                    icon={<CircleDot className="h-12 w-12 text-muted-foreground" />}
                    title="No divisions found"
                    description={eventFilter ? "This event doesn't have any divisions yet." : "Select an event to see its divisions."}
                    action={eventFilter && (
                        <DivisionDialog
                            eventId={eventFilter}
                            onSuccess={() => refetch()}
                            trigger={
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create First Division
                                </Button>
                            }
                        />
                    )}
                />
            ) : (
                <Card className="p-0 overflow-hidden shadow-sm border-muted/60">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Division Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-center">Teams</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {divisions.map((div: any) => (
                                <TableRow key={div.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">{div.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {div.divisionType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm italic max-w-xs truncate">
                                        {div.description || 'No description'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-mono">
                                            {div.teamsCount || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon-sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => setEditingDivision(div)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Division
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                    onClick={() => handleDelete(div.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {/* Editing Dialog */}
            {editingDivision && (
                <DivisionDialog
                    eventId={eventFilter}
                    division={editingDivision}
                    open={!!editingDivision}
                    onOpenChange={(open) => !open && setEditingDivision(null)}
                    onSuccess={() => refetch()}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Division</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this division? This will also remove any pool assignments for teams in this division. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
