'use client';

import { TournamentBracket } from '@/components/features/brackets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsApi } from '@/lib/api/events';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, LayoutGrid, RefreshCw } from 'lucide-react';
import { useParams } from 'next/navigation';
import * as React from 'react';

export default function EventBracketPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [selectedRoundId, setSelectedRoundId] = React.useState<string>('all');

    const { data: event, isLoading: isLoadingEvent } = useQuery({
        queryKey: ['events', eventId],
        queryFn: () => eventsApi.get(eventId),
        enabled: !!eventId,
    });

    const { data: rounds = [], isLoading: isLoadingRounds } = useQuery({
        queryKey: ['events', eventId, 'rounds'],
        queryFn: () => eventsApi.getRounds(eventId),
        enabled: !!eventId,
    });

    const { data: bracket, isLoading: isLoadingBracket, refetch: refetchBracket } = useQuery({
        queryKey: ['events', eventId, 'bracket-tree', selectedRoundId],
        queryFn: () => eventsApi.getBracket(eventId, selectedRoundId !== 'all' ? selectedRoundId : ''),
        enabled: !!eventId,
    });

    const bracketRounds = rounds.filter(r => (r.roundType as string) === 'bracket' || (r.roundType as string) === 'semifinal' || (r.roundType as string) === 'final');

    if (isLoadingEvent || isLoadingRounds || isLoadingBracket) {
        return (
            <div className="space-y-6 pt-4">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title={`${event?.name || 'Event'} Brackets`}
                    description="View and manage tournament progression."
                />

                <div className="flex items-center gap-2">
                    <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
                        <SelectTrigger className="w-[200px] rounded-xl">
                            <SelectValue placeholder="All Bracket Rounds" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Bracket Rounds</SelectItem>
                            {bracketRounds.map(round => (
                                <SelectItem key={round.id} value={round.id}>{round.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => refetchBracket()} className="rounded-xl">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {bracket && (bracket as any).bracketTree ? (
                <Card className="rounded-2xl shadow-xl border-none bg-muted/10 overflow-hidden">
                    <CardContent className="p-0 overflow-x-auto min-h-[600px] flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
                        <TournamentBracket
                            bracket={bracket as any}
                            className="p-10"
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card className="rounded-2xl border-dashed border-2 bg-muted/5">
                    <CardContent className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Brackets Found</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Brackets haven't been generated for this event yet, or no games are assigned to bracket rounds.
                        </p>
                        <Button variant="default">Generate Bracket</Button>
                    </CardContent>
                </Card>
            )}

            {/* Info Alert */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                    <p className="font-bold text-primary mb-1">About Tournament Progression</p>
                    <p className="text-muted-foreground">
                        Teams advance automatically when games are completed and scores are approved.
                        You can manually override seeds or matchups by editing the games directly.
                    </p>
                </div>
            </div>
        </div>
    );
}
