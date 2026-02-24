'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Team } from '@/types';
import { RosterManagementPanel } from './RosterManagementPanel';

interface ManageRosterDialogProps {
    team: Team | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ManageRosterDialog({ team, open, onOpenChange }: ManageRosterDialogProps) {
    if (!team) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Roster: {team.name}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <RosterManagementPanel team={team} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
