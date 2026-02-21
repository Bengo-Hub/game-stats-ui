'use client';

import { RosterManagementPanel } from '@/components/dashboard/teams/RosterManagementPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { teamsApi } from '@/lib/api/teams';
import { cn } from '@/lib/utils';
import type { Game } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Heart,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    RefreshCw,
    Trophy,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Color palette for team avatars (mirrored from teams/page.tsx)
const TEAM_COLORS = [
    'bg-gradient-to-br from-rose-400 to-red-500',
    'bg-gradient-to-br from-orange-400 to-amber-500',
    'bg-gradient-to-br from-emerald-400 to-green-500',
    'bg-gradient-to-br from-cyan-400 to-blue-500',
    'bg-gradient-to-br from-violet-400 to-purple-500',
    'bg-gradient-to-br from-pink-400 to-fuchsia-500',
    'bg-gradient-to-br from-indigo-400 to-blue-600',
    'bg-gradient-to-br from-teal-400 to-cyan-500',
];

function getTeamColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}

export default function TeamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const {
        data: team,
        isLoading: isLoadingTeam,
        isError: isErrorTeam,
        refetch: refetchTeam,
    } = useQuery({
        queryKey: ['teams', teamId],
        queryFn: () => teamsApi.get(teamId),
    });

    const { data: games = [], isLoading: isLoadingGames } = useQuery({
        queryKey: ['teams', teamId, 'games'],
        queryFn: () => teamsApi.getGames(teamId) as Promise<Game[]>,
        enabled: !!teamId,
    });

    const { data: spiritAverage } = useQuery({
        queryKey: ['teams', teamId, 'spirit'],
        queryFn: () => teamsApi.getSpiritAverage(teamId),
        enabled: !!teamId,
    });

    if (isLoadingTeam) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (isErrorTeam || !team) {
        return (
            <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h2 className="text-xl font-semibold mb-2">Team not found</h2>
                <p className="text-muted-foreground mb-6">The team you're looking for doesn't exist or has been removed.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                        {team.logoUrl ? (
                            <img
                                src={team.logoUrl}
                                alt={team.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm"
                            />
                        ) : (
                            <div
                                className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl',
                                    getTeamColor(team.name)
                                )}
                            >
                                {team.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold sm:text-2xl">{team.name}</h1>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                {team.divisionName && <Badge variant="outline">{team.divisionName}</Badge>}
                                {team.initialSeed && <span>Seed #{team.initialSeed}</span>}
                                {team.locationName && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {team.locationName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetchTeam()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Quick Stats & Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Team Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Roster Size</p>
                                    <p className="text-sm font-medium">{team.playersCount || 0} Players</p>
                                </div>
                            </div>

                            {spiritAverage && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <Trophy className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Spirit Average</p>
                                        <p className="text-sm font-medium">{spiritAverage.averageTotal?.toFixed(1) || '0.0'} / 20</p>
                                    </div>
                                </div>
                            )}

                            {(team.contactEmail || team.contactPhone) && (
                                <div className="pt-4 border-t space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</p>
                                    {team.contactEmail && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                            <a href={`mailto:${team.contactEmail}`} className="hover:underline truncate">
                                                {team.contactEmail}
                                            </a>
                                        </div>
                                    )}
                                    {team.contactPhone && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>{team.contactPhone}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Captains */}
                    {(team.captain || team.spiritCaptain) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Leadership</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {team.captain && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                            C
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Captain</p>
                                            <p className="text-sm font-medium">{team.captain.name}</p>
                                        </div>
                                    </div>
                                )}
                                {team.spiritCaptain && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                                            S
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Spirit Captain</p>
                                            <p className="text-sm font-medium">{team.spiritCaptain.name}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Main Content Tabs */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="roster" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="roster">Roster</TabsTrigger>
                            <TabsTrigger value="games">Game History</TabsTrigger>
                            <TabsTrigger value="spirit">Spirit Breakdown</TabsTrigger>
                        </TabsList>

                        <TabsContent value="roster">
                            <RosterManagementPanel team={team} />
                        </TabsContent>

                        <TabsContent value="games">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg">Recent Games</CardTitle>
                                    <Link href={`/games?teamId=${teamId}`} className="text-sm text-primary hover:underline">
                                        View all
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    {isLoadingGames ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                                        </div>
                                    ) : games.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            No games recorded for this team yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {games.map(game => (
                                                <Link key={game.id} href={`/games/${game.id}`}>
                                                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <StatusBadge status={game.status} />
                                                                <span className="text-sm font-medium">
                                                                    {game.homeTeam?.name} vs {game.awayTeam?.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {format(parseISO(game.scheduledTime), 'MMM d, h:mm a')}
                                                                </span>
                                                                {game.fieldLocation && (
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {game.fieldLocation.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <div className="text-xl font-bold font-mono">
                                                                {game.homeTeamScore} - {game.awayTeamScore}
                                                            </div>
                                                            {game.status === 'finished' && (
                                                                <div className="text-[10px] items-center gap-1 text-green-600 font-medium">
                                                                    {game.homeTeam?.id === teamId
                                                                        ? (game.homeTeamScore > game.awayTeamScore ? 'WIN' : game.homeTeamScore < game.awayTeamScore ? 'LOSS' : 'DRAW')
                                                                        : (game.awayTeamScore > game.homeTeamScore ? 'WIN' : game.awayTeamScore < game.homeTeamScore ? 'LOSS' : 'DRAW')
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="spirit">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Spirit of the Game</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {!spiritAverage ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                            No spirit data available yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                                <SpiritMetric label="Rules" value={spiritAverage.averageRulesKnowledge} color="bg-blue-500" />
                                                <SpiritMetric label="Fouls" value={spiritAverage.averageFoulsBodyContact} color="bg-green-500" />
                                                <SpiritMetric label="Fairness" value={spiritAverage.averageFairMindedness} color="bg-purple-500" />
                                                <SpiritMetric label="Attitude" value={spiritAverage.averageAttitude} color="bg-orange-500" />
                                                <SpiritMetric label="Comm." value={spiritAverage.averageCommunication} color="bg-pink-500" />
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Trophy className="h-5 w-5 text-amber-600" />
                                                        <span className="font-bold text-amber-900">MVP Nominations</span>
                                                    </div>
                                                    <span className="text-2xl font-black text-amber-600">
                                                        {spiritAverage.mvpNominationsCount || 0}
                                                    </span>
                                                </div>
                                                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Heart className="h-5 w-5 text-rose-600" />
                                                        <span className="font-bold text-rose-900">Spirit Nominations</span>
                                                    </div>
                                                    <span className="text-2xl font-black text-rose-600">
                                                        {spiritAverage.spiritNominationsCount || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-xl bg-muted/50 border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Final Spirit Average</span>
                                                    <span className="text-2xl font-bold">{spiritAverage.averageTotal?.toFixed(2)} / 20</span>
                                                </div>
                                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all"
                                                        style={{ width: `${((spiritAverage.averageTotal || 0) / 20) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

function SpiritMetric({ label, value, color }: { label: string; value: number; color: string }) {
    const percentage = (value / 4) * 100; // max 4 per category
    return (
        <div className="space-y-2 p-3 rounded-lg bg-card border">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <span className="text-sm font-bold">{value.toFixed(1)}</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full transition-all', color)} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}
