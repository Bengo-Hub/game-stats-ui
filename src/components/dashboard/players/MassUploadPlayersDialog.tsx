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
import { teamsApi } from '@/lib/api/teams';
import { Download, Loader2, Upload } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

interface MassUploadPlayersDialogProps {
    teamId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    children?: React.ReactNode; // Added children prop
}

export function MassUploadPlayersDialog({
    teamId,
    open,
    onOpenChange,
    onSuccess,
    children, // Destructured children prop
}: MassUploadPlayersDialogProps) {
    const [file, setFile] = React.useState<File | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await teamsApi.uploadRoster(teamId, file);
            toast.success(`Successfully uploaded ${result.count} players`);
            if (result.errors && result.errors.length > 0) {
                toast.warning(`${result.errors.length} rows had errors. Check console.`);
                console.error('Upload errors:', result.errors);
            }
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to upload players');
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = ['Name', 'Gender', 'JerseyNumber'];
        const csvContent = headers.join(',') + '\nJohn Doe,M,10\nJane Smith,F,7';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'player_upload_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Mass Upload Players</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to add multiple players to this team at once.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {children}
                    <div className="space-y-2">
                        <Label htmlFor="csv-file">Select CSV File</Label>
                        <Input
                            id="csv-file"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        <span className="text-xs">Required columns: Name, Gender (M/F/X)</span>
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
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || !teamId || isUploading}>
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Players
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
