'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsApi } from '@/lib/api/events';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Star, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import * as React from 'react';

export default function EventSpiritPage() {
    const params = useParams();
    const eventId = params.id as string;

    const { data: event, isLoading: isLoadingEvent } = useQuery({
        queryKey: ['events', eventId],
        queryFn: () => eventsApi.get(eventId),
        enabled: !!eventId,
    });

    const { data: spiritScores = [], isLoading: isLoadingScores } = useQuery({
        queryKey: ['events', eventId, 'spirit-scores'],
        queryFn: () => eventsApi.getSpiritScores(eventId),
        enabled: !!eventId,
    });

    if (isLoadingEvent || isLoadingScores) {
        return (
            <div className="space-y-6 pt-4">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
                <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4">
            <PageHeader
                title={`${event?.name || 'Event'} Spirit Dashboard`}
                description="Monitor and manage spirit scores across all games in this event."
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <SpiritStatCard
                    icon={<Star className="text-yellow-500" />}
                    label="Total Submissions"
                    value={spiritScores.length}
                />
                <SpiritStatCard
                    icon={<Users className="text-blue-500" />}
                    label="Unique Teams"
                    value={new Set(spiritScores.map(s => s.team?.id)).size}
                />
                {/* Add more stats as needed */}
            </div>

            <Card className="rounded-2xl shadow-sm overflow-hidden border-none outline outline-1 outline-muted">
                <CardHeader className="bg-muted/30">
                    <CardTitle>Recent Spirit Submissions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left">Team Scored</th>
                                    <th className="px-4 py-3 text-left">Scored By</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    <th className="px-4 py-3 text-left">Comments</th>
                                    <th className="px-4 py-3 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {spiritScores.map((score) => (
                                    <tr key={score.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-4 font-medium">{score.team?.name || 'Unknown'}</td>
                                        <td className="px-4 py-4">{score.scoredByTeam?.name || 'Unknown'}</td>
                                        <td className="px-4 py-4 text-center">
                                            <Badge variant={score.totalScore >= 10 ? 'default' : 'secondary'}>
                                                {score.totalScore} / 20
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 max-w-xs">
                                            {score.comments ? (
                                                <div className="flex items-start gap-2 text-muted-foreground italic">
                                                    <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{score.comments}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground/50">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-right text-muted-foreground">
                                            {new Date(score.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {spiritScores.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-20 text-center text-muted-foreground italic">
                                            No spirit scores have been submitted yet for this event.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function SpiritStatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
    return (
        <Card className="rounded-2auto shadow-sm border-none bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-background/50 shadow-inner">
                        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-6 w-6' })}
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium">{label}</p>
                        <h3 className="text-2xl font-bold">{value}</h3>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
