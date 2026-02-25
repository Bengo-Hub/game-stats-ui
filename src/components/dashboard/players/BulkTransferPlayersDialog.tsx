'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { bulkApi } from '@/lib/api/bulk';
import { eventsApi } from '@/lib/api/events';
import { teamsApi } from '@/lib/api/teams';
import { Event, Player, Team } from '@/types';
import { Loader2, MoveRight, Users } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

interface BulkTransferPlayersDialogProps {
    eventId?: string; // Optional for global context
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function BulkTransferPlayersDialog({
    eventId,
    open,
    onOpenChange,
    onSuccess,
}: BulkTransferPlayersDialogProps) {
    const [events, setEvents] = React.useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = React.useState<string>(eventId || '');
    const [teams, setTeams] = React.useState<Team[]>([]);
    const [sourceTeamId, setSourceTeamId] = React.useState<string>('');
    const [targetTeamId, setTargetTeamId] = React.useState<string>('');
    const [players, setPlayers] = React.useState<Player[]>([]);
    const [selectedPlayerIds, setSelectedPlayerIds] = React.useState<Set<string>>(new Set());
    const [isLoadingEvents, setIsLoadingEvents] = React.useState(false);
    const [isLoadingTeams, setIsLoadingTeams] = React.useState(false);
    const [isLoadingPlayers, setIsLoadingPlayers] = React.useState(false);
    const [isTransferring, setIsTransferring] = React.useState(false);

    // Sync selectedEventId with eventId prop
    React.useEffect(() => {
        if (eventId) {
            setSelectedEventId(eventId);
        }
    }, [eventId]);

    // Fetch events if context is global
    React.useEffect(() => {
        if (open && !eventId) {
            const fetchEvents = async () => {
                setIsLoadingEvents(true);
                try {
                    const data = await eventsApi.list({ temporal: 'all' });
                    setEvents(data as any); // Cast as Event[]
                } catch (error) {
                    toast.error('Failed to load events');
                } finally {
                    setIsLoadingEvents(false);
                }
            };
            fetchEvents();
        }
    }, [open, eventId]);

    // Fetch teams for the event
    React.useEffect(() => {
        if (open && selectedEventId) {
            const fetchTeams = async () => {
                setIsLoadingTeams(true);
                try {
                    const data = await teamsApi.list({ eventId: selectedEventId });
                    setTeams(data);
                } catch (error) {
                    toast.error('Failed to load teams');
                } finally {
                    setIsLoadingTeams(false);
                }
            };
            fetchTeams();
        } else {
            setTeams([]);
            setSourceTeamId('');
            setTargetTeamId('');
        }
    }, [open, selectedEventId]);

    // Fetch players when source team changes
    React.useEffect(() => {
        if (sourceTeamId) {
            const fetchPlayers = async () => {
                setIsLoadingPlayers(true);
                try {
                    const data = await teamsApi.getRoster(sourceTeamId);
                    setPlayers(data);
                    setSelectedPlayerIds(new Set()); // Reset selection
                } catch (error) {
                    toast.error('Failed to load roster');
                } finally {
                    setIsLoadingPlayers(false);
                }
            };
            fetchPlayers();
        } else {
            setPlayers([]);
            setSelectedPlayerIds(new Set());
        }
    }, [sourceTeamId]);

    const togglePlayerSelection = (playerId: string) => {
        const newSelection = new Set(selectedPlayerIds);
        if (newSelection.has(playerId)) {
            newSelection.delete(playerId);
        } else {
            newSelection.add(playerId);
        }
        setSelectedPlayerIds(newSelection);
    };

    const handleTransfer = async () => {
        if (!selectedEventId || selectedPlayerIds.size === 0 || !targetTeamId) return;

        setIsTransferring(true);
        try {
            const transfers = Array.from(selectedPlayerIds).map(id => ({
                playerId: id,
                toTeamId: targetTeamId,
            }));

            await bulkApi.transferPlayers({
                eventId: selectedEventId,
                transfers,
            });

            toast.success(`Successfully transferred ${selectedPlayerIds.size} players`);
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to transfer players');
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Bulk Player Transfer
                    </DialogTitle>
                    <DialogDescription>
                        Move multiple players from one team to another.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {!eventId && (
                        <div className="space-y-2">
                            <Label>Target Event</Label>
                            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select event..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {events.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Source Team</Label>
                            <Select value={sourceTeamId} onValueChange={setSourceTeamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Target Team</Label>
                            <Select value={targetTeamId} onValueChange={setTargetTeamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams
                                        .filter((t) => t.id !== sourceTeamId)
                                        .map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Select Players ({selectedPlayerIds.size})</Label>
                            {players.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => {
                                        if (selectedPlayerIds.size === players.length) {
                                            setSelectedPlayerIds(new Set());
                                        } else {
                                            setSelectedPlayerIds(new Set(players.map(p => p.id)));
                                        }
                                    }}
                                >
                                    {selectedPlayerIds.size === players.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            )}
                        </div>
                        <div className="border rounded-md max-h-[200px] overflow-y-auto p-2 space-y-1">
                            {isLoadingPlayers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : players.length > 0 ? (
                                players.map((p) => (
                                    <label
                                        key={p.id}
                                        className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedPlayerIds.has(p.id)}
                                            onChange={() => togglePlayerSelection(p.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{p.name}</span>
                                            {p.jerseyNumber && (
                                                <span className="text-xs text-muted-foreground">#{p.jerseyNumber}</span>
                                            )}
                                        </div>
                                    </label>
                                ))
                            ) : (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    {sourceTeamId ? 'No players in this team' : 'Select a source team first'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isTransferring}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleTransfer}
                        disabled={
                            !targetTeamId ||
                            selectedPlayerIds.size === 0 ||
                            isTransferring
                        }
                    >
                        {isTransferring ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Transferring...
                            </>
                        ) : (
                            <>
                                <MoveRight className="mr-2 h-4 w-4" />
                                Transfer {selectedPlayerIds.size > 0 ? selectedPlayerIds.size : ''} Players
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
