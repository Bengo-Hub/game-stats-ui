'use client';

import { PlayerDialog } from '@/components/dashboard/players/PlayerDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { publicApi } from '@/lib/api/public';
import { teamsApi } from '@/lib/api/teams';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
    ArrowLeft,
    Calendar,
    ChevronRight,
    Edit,
    Mail,
    MapPin,
    RefreshCw,
    Target,
    Trophy,
    User,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

// Color palette for player avatars
const PLAYER_COLORS = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-orange-500',
];

function getPlayerColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PLAYER_COLORS[Math.abs(hash) % PLAYER_COLORS.length];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

export default function PlayerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const playerId = params.id as string;

    const [editDialogOpen, setEditDialogOpen] = React.useState(false);

    // Fetch player basic info
    const {
        data: player,
        isLoading: isLoadingPlayer,
        isError: isErrorPlayer,
        refetch: refetchPlayer,
    } = useQuery({
        queryKey: ['players', playerId],
        queryFn: () => publicApi.getPlayer(playerId),
        enabled: !!playerId,
    });

    // Fetch player stats (from leaderboard as proxy)
    const { data: stats } = useQuery({
        queryKey: ['players', playerId, 'stats'],
        queryFn: async () => {
            const allStats = await publicApi.getPlayerLeaderboard({ limit: 1000 });
            return allStats.find((s) => s.playerId === playerId);
        },
        enabled: !!playerId,
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: any) => {
            // Find teamId from player if missing in data
            // In this implementation, PlayerDialog doesn't manage teamId by default
            // But teamsApi.updatePlayer needs teamId. 
            // We'll need to find it from the team edge if loaded or assumed.
            // Assuming player.metadata contains teamId or it's associated.
            // For now, we'll try to find teamId from the stats or player object.
            const teamId = (player as any).team?.id || (stats as any)?.teamId;
            if (!teamId) throw new Error("Team association not found. Cannot update player.");
            return teamsApi.updatePlayer(teamId, playerId, data);
        },
        onSuccess: () => {
            toast.success('Player updated successfully');
            setEditDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['players', playerId] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update player');
        },
    });

    if (isLoadingPlayer) {
        return (
            <div className="space-y-6 pt-4">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <div className="grid gap-6 lg:grid-cols-3">
                    <Skeleton className="h-48 lg:col-span-1 rounded-2xl" />
                    <Skeleton className="h-48 lg:col-span-2 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (isErrorPlayer || !player) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                    <User className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Player Not Found</h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                    We couldn't find the player profile you're looking for. It might have been removed or the ID is incorrect.
                </p>
                <Button onClick={() => router.back()} size="lg" className="rounded-xl">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    const teamId = (player as any).team?.id || (stats as any)?.teamId;
    const teamName = (player as any).team?.name || stats?.teamName || 'Unknown Team';

    return (
        <div className="space-y-6 pt-2">
            {/* Breadcrumbs & Back */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Link href="/players" className="hover:text-primary transition-colors">Players</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium truncate">{player.name}</span>
            </div>

            {/* Header Card */}
            <Card className="overflow-hidden border-none bg-gradient-to-r from-primary/5 via-primary/1 to-transparent shadow-none">
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 sm:p-8">
                        <div className="relative">
                            {player.profileImageUrl ? (
                                <img
                                    src={player.profileImageUrl}
                                    alt={player.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-xl"
                                />
                            ) : (
                                <div
                                    className={cn(
                                        'w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-xl',
                                        getPlayerColor(player.name)
                                    )}
                                >
                                    {getInitials(player.name)}
                                </div>
                            )}
                            {player.isCaptain && (
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 border-2 border-background flex items-center justify-center text-white font-bold text-xs shadow-lg" title="Captain">
                                    C
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl font-extrabold tracking-tight">{player.name}</h1>
                                {player.jerseyNumber !== undefined && (
                                    <Badge variant="secondary" className="px-3 py-1 text-lg font-mono rounded-lg">
                                        #{player.jerseyNumber}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
                                <Link href={teamId ? `/teams/${teamId}` : '#'} className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
                                    <Users className="h-4 w-4" />
                                    {teamName}
                                </Link>
                                <div className="flex items-center gap-1.5">
                                    <User className="h-4 w-4" />
                                    {player.gender === 'M' ? 'Male' : player.gender === 'F' ? 'Female' : 'Mixed'} / {(player as any).position || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                            <Button variant="outline" size="lg" className="flex-1 md:flex-none rounded-xl" onClick={() => setEditDialogOpen(true)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
                            </Button>
                            <Button variant="ghost" size="icon-lg" className="rounded-xl" onClick={() => refetchPlayer()}>
                                <RefreshCw className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Stats Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-2xl shadow-sm border-muted/50 overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                Season Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!stats ? (
                                <div className="space-y-6">
                                    <div className="text-center py-4 text-muted-foreground text-sm italic">
                                        No statistical data available for this season yet.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <StatItem
                                        icon={<Target className="text-green-500" />}
                                        label="Goals"
                                        value={stats.goals}
                                        subValue="Points Scored"
                                    />
                                    <StatItem
                                        icon={<Trophy className="text-blue-500" />}
                                        label="Assists"
                                        value={stats.assists}
                                        subValue="Goal Assists"
                                    />
                                    <StatItem
                                        icon={<Calendar className="text-orange-500" />}
                                        label="Games"
                                        value={stats.gamesPlayed}
                                        subValue="Played"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact & Bio */}
                    <Card className="rounded-2xl shadow-sm border-muted/50">
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Additional Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailRow icon={<Mail />} label="Email" value={(player as any).email || 'No email shared'} />
                            <DetailRow icon={<MapPin />} label="Hometown" value={(player as any).hometown || 'Not specified'} />
                            <div className="pt-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Member Since</p>
                                <p className="text-sm">{(player as any).createdAt ? format(parseISO((player as any).createdAt), 'MMMM yyyy') : 'Recently joined'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Performance/Game Log */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl shadow-sm border-muted/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">Recent Games</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/games?playerId=${playerId}`}>View History</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-10 text-muted-foreground">
                                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Game log functionality is coming soon.</p>
                                <p className="text-xs">Follow this player's journey match by match.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {editDialogOpen && (
                <PlayerDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    title="Edit Player Profile"
                    description="Update personal details and team role."
                    player={player}
                    onSubmit={(data) => updateMutation.mutate(data)}
                    isPending={updateMutation.isPending}
                />
            )}
        </div>
    );
}

function StatItem({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: number | string; subValue: string }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-muted/50 transition-all hover:bg-muted/40">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-background shadow-sm">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground/60">{subValue}</p>
                </div>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
                {value}
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-0.5 text-muted-foreground">
                {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: 'h-4 w-4' })}
            </div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}
