'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

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
import { adminApi, type AdminUser } from '@/lib/api/admin';
import { eventsApi } from '@/lib/api/events';
import { publicApi } from '@/lib/api/public';

interface AssignScopedRoleModalProps {
    user: AdminUser | null;
    isOpen: boolean;
    onClose: () => void;
}

type ScopeType = 'event' | 'game' | 'team' | 'division';

export function AssignScopedRoleModal({ user, isOpen, onClose }: AssignScopedRoleModalProps) {
    const queryClient = useQueryClient();
    const [scopeType, setScopeType] = React.useState<ScopeType>('event');
    const [scopeId, setScopeId] = React.useState<string>('');
    const [role, setRole] = React.useState<string>('scorekeeper');

    // Fetch options based on scope type
    const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
        queryKey: ['events', 'list'],
        queryFn: () => eventsApi.list(),
        enabled: scopeType === 'event' && isOpen,
    });
    const events = (Array.isArray(eventsData) ? eventsData : (eventsData as any)?.data || []);

    const { data: gamesData, isLoading: isLoadingGames } = useQuery({
        queryKey: ['games', 'list'],
        queryFn: () => publicApi.listGames({}),
        enabled: scopeType === 'game' && isOpen,
    });
    const games = (Array.isArray(gamesData) ? gamesData : (gamesData as any)?.data || []);

    const assignMutation = useMutation({
        mutationFn: (data: { userId: string; role: string; scopeType: string; scopeId: string }) =>
            adminApi.assignScopedRole(data),
        onSuccess: () => {
            toast.success('Role assigned successfully');
            queryClient.invalidateQueries({ queryKey: ['admin', 'users', user?.id, 'roles'] });
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to assign role');
        },
    });

    const handleAssign = () => {
        if (!user || !scopeId) return;

        assignMutation.mutate({
            userId: user.id,
            role,
            scopeType,
            scopeId,
        });
    };

    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Assign Scoped Role
                    </DialogTitle>
                    <DialogDescription>
                        Assign a granular role to <strong>{user.name}</strong> for a specific scope.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 px-6 overflow-y-auto flex-1">
                    <div className="grid gap-2">
                        <Label htmlFor="scope-type">Scope Type</Label>
                        <Select
                            value={scopeType}
                            onValueChange={(value: ScopeType) => {
                                setScopeType(value);
                                setScopeId('');
                            }}
                        >
                            <SelectTrigger id="scope-type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="event">Event</SelectItem>
                                <SelectItem value="game">Game</SelectItem>
                                <SelectItem value="team">Team (Coming Soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="scope-item">Target {scopeType.charAt(0).toUpperCase() + scopeType.slice(1)}</Label>
                        <Select value={scopeId} onValueChange={setScopeId} disabled={assignMutation.isPending}>
                            <SelectTrigger id="scope-item">
                                <SelectValue placeholder={`Select ${scopeType}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {scopeType === 'event' && events?.map((event: any) => (
                                    <SelectItem key={event.id} value={event.id}>
                                        {event.name}
                                    </SelectItem>
                                ))}
                                {scopeType === 'game' && games?.map((game: any) => (
                                    <SelectItem key={game.id} value={game.id}>
                                        {game.name} ({new Date(game.scheduledTime).toLocaleDateString()})
                                    </SelectItem>
                                ))}
                                {(isLoadingEvents || isLoadingGames) && (
                                    <div className="flex items-center justify-center p-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={setRole} disabled={assignMutation.isPending}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="scorekeeper">Scorekeeper</SelectItem>
                                <SelectItem value="game_admin">Game Admin</SelectItem>
                                <SelectItem value="event_manager">Event Manager</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={assignMutation.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={!scopeId || assignMutation.isPending}>
                        {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Role
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
