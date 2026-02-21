'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { publicApi } from '@/lib/api/public';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { MassUploadPlayersDialog } from './MassUploadPlayersDialog';

interface GlobalMassUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function GlobalMassUploadDialog({ open, onOpenChange, onSuccess }: GlobalMassUploadDialogProps) {
    const queryClient = useQueryClient();
    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null);

    const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
        queryKey: ['teams', 'list', 'global-upload'],
        queryFn: () => publicApi.listTeams({ limit: 100 }),
        enabled: open,
    });

    return (
        <MassUploadPlayersDialog
            open={open}
            onOpenChange={onOpenChange}
            teamId={selectedTeamId || ''}
            onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['dashboard', 'players'] });
                onSuccess?.();
            }}
        >
            <div className="space-y-2 mb-4">
                <Label htmlFor="upload-team-select">Select Team *</Label>
                <Select
                    disabled={isLoadingTeams}
                    onValueChange={setSelectedTeamId}
                    value={selectedTeamId || undefined}
                >
                    <SelectTrigger id="upload-team-select">
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
        </MassUploadPlayersDialog>
    );
}
