'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { publicApi } from '@/lib/api/public';
import { teamsApi } from '@/lib/api/teams';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from 'sonner';
import { PlayerDialog } from './PlayerDialog';

interface GlobalAddPlayerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function GlobalAddPlayerDialog({ open, onOpenChange, onSuccess }: GlobalAddPlayerDialogProps) {
    const queryClient = useQueryClient();
    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);

    const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
        queryKey: ['teams', 'list', 'global-add'],
        queryFn: () => publicApi.listTeams({ limit: 100 }),
        enabled: open,
    });

    const addMutation = useMutation({
        mutationFn: (data: any) => {
            if (!selectedTeamId) throw new Error('Please select a team');
            return teamsApi.addPlayer(selectedTeamId, data);
        },
        onSuccess: () => {
            toast.success('Player added successfully');
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'players'] });
            onSuccess?.();
            onOpenChange(false);
            setSelectedTeamId(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add player');
        },
    });

    return (
        <PlayerDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Add New Player"
            description="Create a new player and assign them to a team."
            onSubmit={(data) => addMutation.mutate(data)}
            isPending={addMutation.isPending}
        >
            <div className="space-y-2 mb-4">
                <Label htmlFor="team-select">Team *</Label>
                <Select
                    disabled={isLoadingTeams || addMutation.isPending}
                    onValueChange={setSelectedTeamId}
                    value={selectedTeamId || undefined}
                >
                    <SelectTrigger id="team-select">
                        <SelectValue placeholder={isLoadingTeams ? "Loading teams..." : "Select team"} />
                    </SelectTrigger>
                    <SelectContent>
                        {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                                {team.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </PlayerDialog>
    );
}
