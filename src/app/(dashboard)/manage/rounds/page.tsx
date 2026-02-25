'use client';

import { GameRoundDialog } from '@/components/dashboard/rounds/GameRoundDialog';
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
import { eventsApi, roundsApi } from '@/lib/api/events';
import { useEventsQuery } from '@/lib/hooks/useEventsQuery';
import { useRoundsQuery } from '@/lib/hooks/useRoundsQuery';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    Calendar,
    Edit,
    Layers,
    Loader2,
    MoreVertical,
    Plus,
    RefreshCw,
    Sparkle,
    Trash2,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export default function RoundsPage() {
    const queryClient = useQueryClient();
    const [eventFilter, setEventFilter] = React.useState<string>('');
    const [editingRound, setEditingRound] = React.useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Fetch all events for the filter
    const { data: events = [], isLoading: loadingEvents } = useEventsQuery();

    // Set default event if none selected
    React.useEffect(() => {
        if (!eventFilter && events.length > 0) {
            setEventFilter(events[0].id);
        }
    }, [events, eventFilter]);

    // Fetch rounds for selected event
    const {
        data: rounds = [],
        isLoading: loadingRounds,
        isError,
        error,
        isFetching,
        refetch,
    } = useRoundsQuery(eventFilter);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => roundsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rounds', 'list', eventFilter] });
            toast.success('Round deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete round');
        },
    });

    const seedMutation = useMutation({
        mutationFn: (eventId: string) => eventsApi.seedRounds(eventId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rounds', 'list', eventFilter] });
            toast.success('Standard rounds seeded successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to seed rounds');
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

    const handleSeed = () => {
        if (!eventFilter) return;
        seedMutation.mutate(eventFilter);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <PageHeader title="Game Rounds" description="Manage stages, pools, and playoff rounds for your event">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching || loadingRounds}
                    >
                        <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                        <span className="hidden sm:inline ml-2">Refresh</span>
                    </Button>

                    {eventFilter && rounds.length === 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSeed}
                            disabled={seedMutation.isPending}
                        >
                            {seedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkle className="h-4 w-4 mr-2" />}
                            <span className="hidden sm:inline">Seed Default Rounds</span>
                        </Button>
                    )}

                    {eventFilter && (
                        <GameRoundDialog
                            eventId={eventFilter}
                            onSuccess={() => refetch()}
                            trigger={
                                <Button size="sm">
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-2">Add Round</span>
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
                        {events.map((ev) => (
                            <SelectItem key={ev.id} value={ev.id}>{ev.name} ({new Date(ev.startDate).getFullYear()})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {isError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{error instanceof Error ? error.message : 'Failed to load rounds'}</p>
                </div>
            )}

            {loadingRounds ? (
                <Card className="p-0 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Round Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Order</TableHead>
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
            ) : rounds.length === 0 ? (
                <EmptyState
                    icon={<Layers className="h-12 w-12 text-muted-foreground" />}
                    title="No rounds found"
                    description={eventFilter ? "This event doesn't have any rounds or stages yet." : "Select an event to see its rounds."}
                    action={eventFilter && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleSeed}
                                disabled={seedMutation.isPending}
                            >
                                <Sparkle className="h-4 w-4 mr-2" />
                                Seed Defaults
                            </Button>
                            <GameRoundDialog
                                eventId={eventFilter}
                                onSuccess={() => refetch()}
                                trigger={
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create First Round
                                    </Button>
                                }
                            />
                        </div>
                    )}
                />
            ) : (
                <Card className="p-0 overflow-hidden shadow-sm border-muted/60">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-12 text-center">#</TableHead>
                                <TableHead>Round Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead className="text-center">Teams to Advance</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rounds.map((round) => (
                                <TableRow key={round.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="text-center text-muted-foreground font-mono">
                                        {round.roundNumber || '-'}
                                    </TableCell>
                                    <TableCell className="font-medium">{round.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {round.roundType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {round.startDate ? new Date(round.startDate).toLocaleDateString() : 'N/A'}
                                            <span>-</span>
                                            {round.endDate ? new Date(round.endDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {round.autoAdvance ? (
                                            <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 border-green-200">
                                                <Sparkle className="h-3 w-3" />
                                                Top {round.topNTeams || 0}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Manual</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon-sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => setEditingRound(round)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Round
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                    onClick={() => handleDelete(round.id)}
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
            {editingRound && (
                <GameRoundDialog
                    eventId={eventFilter}
                    round={editingRound}
                    open={!!editingRound}
                    onOpenChange={(open) => !open && setEditingRound(null)}
                    onSuccess={() => refetch()}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Game Round</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this round? This will affect any games scheduled for this round. This action cannot be undone.
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
