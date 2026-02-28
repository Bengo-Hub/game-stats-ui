'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Trophy } from 'lucide-react';
import { useParams } from 'next/navigation';

import { publicApi } from '@/lib/api/public';

export default function DivisionStandingsPage() {
    const params = useParams();
    const eventId = params.id as string;
    const divisionId = params.divisionId as string;

    const {
        data: standings,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['events', eventId, 'divisions', divisionId, 'standings'],
        queryFn: () => publicApi.getDivisionStandings(divisionId),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !standings) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Failed to load standings. Note: Real data fetching depends on backend implementation.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${standings.divisionName} Standings`}
                description="Current team rankings and statistics"
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        Rankings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16 text-center">Rank</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead className="text-center">W</TableHead>
                                    <TableHead className="text-center">L</TableHead>
                                    <TableHead className="text-center">PF</TableHead>
                                    <TableHead className="text-center">PA</TableHead>
                                    <TableHead className="text-center">PD</TableHead>
                                    <TableHead className="text-center">PTS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {standings.standings?.map((team: any, index: number) => (
                                    <TableRow key={team.teamId}>
                                        <TableCell className="text-center font-bold">{team.rank || index + 1}</TableCell>
                                        <TableCell className="font-medium">{team.teamName}</TableCell>
                                        <TableCell className="text-center">{team.wins || 0}</TableCell>
                                        <TableCell className="text-center">{team.losses || 0}</TableCell>
                                        <TableCell className="text-center">{team.pointsFor || 0}</TableCell>
                                        <TableCell className="text-center">{team.pointsAgainst || 0}</TableCell>
                                        <TableCell className="text-center">
                                            {team.pointDifferential || 0}
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-primary">
                                            {(team.wins || 0) * 2 + (team.draws || 0)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!standings.standings || standings.standings.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No standings data available yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
