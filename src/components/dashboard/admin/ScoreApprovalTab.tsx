'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { adminApi, ScoreEdit } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle2,
    Clock,
    Eye,
    XCircle
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export default function ScoreApprovalTab() {
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = React.useState<ScoreEdit | null>(null);
    const [rejectionReason, setRejectionReason] = React.useState('');
    const [isReviewOpen, setIsReviewOpen] = React.useState(false);

    const { data: requests, isLoading } = useQuery({
        queryKey: ['admin', 'score-edits', 'pending'],
        queryFn: () => adminApi.listPendingScoreEdits(),
    });

    const reviewMutation = useMutation({
        mutationFn: (data: { id: string; approve: boolean; rejectionReason?: string }) =>
            adminApi.reviewScoreEdit(data.id, { approve: data.approve, rejectionReason: data.rejectionReason }),
        onSuccess: (_, variables) => {
            toast.success(variables.approve ? 'Request approved' : 'Request rejected');
            queryClient.invalidateQueries({ queryKey: ['admin', 'score-edits', 'pending'] });
            setIsReviewOpen(false);
            setSelectedRequest(null);
            setRejectionReason('');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to review request');
        },
    });

    const handleReview = (request: ScoreEdit) => {
        setSelectedRequest(request);
        setIsReviewOpen(true);
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading pending requests...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Score Edit Approvals</CardTitle>
                    <CardDescription>
                        Review and approve score adjustments requested after games have ended.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!requests || requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Clock className="h-12 w-12 mb-4 opacity-20" />
                            <p>No pending score edit requests.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Game</TableHead>
                                    <TableHead>Requested By</TableHead>
                                    <TableHead>Original Score</TableHead>
                                    <TableHead>Proposed Score</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">
                                            {req.gameName || 'Unknown Game'}
                                        </TableCell>
                                        <TableCell>{req.requestedByName || req.requestedById}</TableCell>
                                        <TableCell>
                                            {req.previousHomeScore} - {req.previousAwayScore}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-bold",
                                                    req.newHomeScore > req.previousHomeScore ? "text-green-500" :
                                                        req.newHomeScore < req.previousHomeScore ? "text-red-500" : ""
                                                )}>
                                                    {req.newHomeScore}
                                                </span>
                                                <span>-</span>
                                                <span className={cn(
                                                    "font-bold",
                                                    req.newAwayScore > req.previousAwayScore ? "text-green-500" :
                                                        req.newAwayScore < req.previousAwayScore ? "text-red-500" : ""
                                                )}>
                                                    {req.newAwayScore}
                                                </span>
                                            </div>
                                            {req.playerScores && req.playerScores.length > 0 && (
                                                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                                    {req.playerScores.length} player stats
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate" title={req.reason}>
                                            {req.reason}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleReview(req)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Review Score Edit Request</DialogTitle>
                        <DialogDescription>
                            Review the requested changes and choose to approve or reject.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/30">
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase">Original</Label>
                                    <div className="text-lg font-mono">
                                        {selectedRequest.previousHomeScore} - {selectedRequest.previousAwayScore}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase">Proposed</Label>
                                    <div className="text-lg font-mono text-primary font-bold">
                                        {selectedRequest.newHomeScore} - {selectedRequest.newAwayScore}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Reason for Request</Label>
                                <p className="text-sm p-3 bg-muted rounded-md border italic">
                                    "{selectedRequest.reason}"
                                </p>
                            </div>

                            {selectedRequest.playerScores && selectedRequest.playerScores.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Player Adjustments</Label>
                                    <div className="border rounded-md divide-y bg-muted/10">
                                        {selectedRequest.playerScores.map((ps: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-2 text-sm">
                                                <span className="font-medium">{ps.player_name || ps.player_id}</span>
                                                <span className="text-primary font-bold">{ps.goals} goals</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="rejection-reason">Notes / Rejection Reason</Label>
                                <Input
                                    id="rejection-reason"
                                    placeholder="Only required if rejecting..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="destructive"
                            disabled={reviewMutation.isPending}
                            onClick={() => reviewMutation.mutate({
                                id: selectedRequest!.id,
                                approve: false,
                                rejectionReason
                            })}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                        <Button
                            variant="default"
                            disabled={reviewMutation.isPending}
                            onClick={() => reviewMutation.mutate({
                                id: selectedRequest!.id,
                                approve: true
                            })}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve & Apply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
