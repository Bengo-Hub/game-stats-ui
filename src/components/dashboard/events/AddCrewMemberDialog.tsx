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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/lib/api/admin';
import { eventsApi } from '@/lib/api/events';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, UserPlus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

interface AddCrewMemberDialogProps {
    eventId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AddCrewMemberDialog({ eventId, open, onOpenChange, onSuccess }: AddCrewMemberDialogProps) {
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    const [selectedUserId, setSelectedUserId] = React.useState<string>('');
    const [selectedRole, setSelectedRole] = React.useState<string>('scorekeeper');
    const queryClient = useQueryClient();

    // Debounce search
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(handler);
    }, [search]);

    // Fetch users based on search
    const { data: users = [], isLoading: isSearching } = useQuery({
        queryKey: ['admin', 'users', 'search', debouncedSearch],
        queryFn: () => adminApi.listUsers({ search: debouncedSearch, limit: 10 }),
        enabled: open && debouncedSearch.length >= 2,
    });

    const addMutation = useMutation({
        mutationFn: (data: { userId: string; role: string }) => eventsApi.addEventCrewMember(eventId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId, 'crew'] });
            toast.success('Crew member added successfully');
            onOpenChange(false);
            setSelectedUserId('');
            setSearch('');
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to add crew member');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            toast.error('Please select a user');
            return;
        }
        addMutation.mutate({ userId: selectedUserId, role: selectedRole });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Add Staff Member
                    </DialogTitle>
                    <DialogDescription>
                        Search for a user and assign them a role for this event.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="search">Search User</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Name or email..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        {isSearching && <p className="text-xs text-muted-foreground">Searching...</p>}
                    </div>

                    {users.length > 0 && (
                        <div className="border rounded-md max-h-[200px] overflow-y-auto">
                            {users.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex flex-col ${selectedUserId === user.id ? 'bg-primary/10 border-primary border-l-4' : ''
                                        }`}
                                    onClick={() => setSelectedUserId(user.id)}
                                >
                                    <span className="font-medium">{user.name}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {search.length >= 2 && !isSearching && users.length === 0 && (
                        <p className="text-sm text-center py-4 border rounded-md border-dashed text-muted-foreground">
                            No users found matching "{search}"
                        </p>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="role">Event Role</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="scorekeeper">Scorekeeper</SelectItem>
                                <SelectItem value="event_manager">Event Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={addMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!selectedUserId || addMutation.isPending}>
                            {addMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Add to Crew
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AddCrewMemberDialog;
