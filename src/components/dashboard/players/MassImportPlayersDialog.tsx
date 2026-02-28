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
import { bulkApi, ImportPlayer } from '@/lib/api/bulk';
import { teamsApi } from '@/lib/api/teams';
import { Team } from '@/types';
import { Download, Loader2, Upload } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

interface MassImportPlayersDialogProps {
    eventId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function MassImportPlayersDialog({
    eventId,
    open,
    onOpenChange,
    onSuccess,
}: MassImportPlayersDialogProps) {
    const [teams, setTeams] = React.useState<Team[]>([]);
    const [file, setFile] = React.useState<File | null>(null);
    const [isImporting, setIsImporting] = React.useState(false);
    const [isLoadingTeams, setIsLoadingTeams] = React.useState(false);
    const [defaultTeamId, setDefaultTeamId] = React.useState<string>('none');

    // Fetch teams for the event
    React.useEffect(() => {
        if (open && eventId) {
            const fetchTeams = async () => {
                setIsLoadingTeams(true);
                try {
                    const data = await teamsApi.list({ eventId });
                    setTeams(Array.isArray(data) ? data : (data as any)?.data || []);
                } catch (error) {
                    toast.error('Failed to load teams');
                } finally {
                    setIsLoadingTeams(false);
                }
            };
            fetchTeams();
        }
    }, [open, eventId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const parseCSV = (text: string): ImportPlayer[] => {
        const lines = text.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const players: ImportPlayer[] = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',').map(v => v.trim());
            const player: any = {};

            headers.forEach((header, index) => {
                const value = values[index];
                if (header === 'name') player.name = value;
                if (header === 'jerseynumber') player.jerseyNumber = parseInt(value, 10);
                if (header === 'email') player.email = value;
                if (header === 'phone') player.phone = value;
                if (header === 'team') {
                    // Match team name to ID if possible
                    const team = teams.find(t => t.name.toLowerCase() === value.toLowerCase());
                    if (team) player.teamId = team.id;
                }
            });

            if (player.name) {
                // If no teamId matched from CSV, use default if selected
                if (!player.teamId && defaultTeamId !== 'none') {
                    player.teamId = defaultTeamId;
                }
                players.push(player);
            }
        }
        return players;
    };

    const handleImport = async () => {
        if (!file || !eventId) return;

        setIsImporting(true);
        try {
            const text = await file.text();
            const players = parseCSV(text);

            if (players.length === 0) {
                toast.error('No valid players found in CSV');
                return;
            }

            const result = await bulkApi.importPlayers({
                eventId,
                players,
            });

            toast.success(`Successfully imported ${result.count} players`);
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to import players');
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const headers = ['Name', 'JerseyNumber', 'Email', 'Phone', 'Team'];
        const csvContent = headers.join(',') + '\nJohn Doe,10,john@example.com,555-0101,Team Alpha\nJane Smith,7,jane@example.com,555-0102,Team Beta';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mass_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mass Import Players</DialogTitle>
                    <DialogDescription>
                        Import multiple players across different teams from a single CSV file.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Select CSV File</Label>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            disabled={isImporting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Default Team (for missing columns)</Label>
                        <Select value={defaultTeamId} onValueChange={setDefaultTeamId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select team..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Matched by name or ignore</SelectItem>
                                {teams.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase">CSV Header Mapping</p>
                            <p className="text-[10px]">Name (Req), JerseyNumber, Email, Phone, Team (Name)</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs underline"
                            onClick={downloadTemplate}
                        >
                            <Download className="h-3 w-3 mr-1" />
                            Template
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!file || isImporting}>
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Start Import
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
