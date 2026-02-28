'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { gamesApi } from '@/lib/api/games';
import { publicApi } from '@/lib/api/public';
import { teamsApi } from '@/lib/api/teams';
import { gameKeys } from '@/lib/hooks/useGamesQuery';
import { cn } from '@/lib/utils';
import type { Game, Player } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, Loader2, RotateCcw, Save, ShieldCheck, Trophy, User } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

interface UnifiedScoreFormProps {
    game: Game;
    onSuccess?: () => void;
    onCancel?: () => void;
    isAdmin?: boolean;
}

// Internal stat type to handle form state
type PlayerStats = {
    goals: number;
    assists: number;
    blocks: number;
    turns: number;
};

export function UnifiedScoreForm({ game, onSuccess, onCancel, isAdmin = false }: UnifiedScoreFormProps) {
    const queryClient = useQueryClient();
    const [homeStats, setHomeStats] = React.useState<Record<string, PlayerStats>>({});
    const [awayStats, setAwayStats] = React.useState<Record<string, PlayerStats>>({});
    const [reason, setReason] = React.useState('');

    // Fetch rosters
    const { data: homeRoster = [], isLoading: homeLoading } = useQuery({
        queryKey: ['teams', game.homeTeam?.id, 'roster'],
        queryFn: () => teamsApi.getRoster(game.homeTeam?.id!),
        enabled: !!game.homeTeam?.id,
    });

    const { data: awayRoster = [], isLoading: awayLoading } = useQuery({
        queryKey: ['teams', game.awayTeam?.id, 'roster'],
        queryFn: () => teamsApi.getRoster(game.awayTeam?.id!),
        enabled: !!game.awayTeam?.id,
    });

    // Fetch existing scores
    const { data: existingScores = [], isLoading: scoresLoading } = useQuery({
        queryKey: gameKeys.scores(game.id),
        queryFn: () => publicApi.getGameScores(game.id),
    });

    // Initialize scores from existing data
    React.useEffect(() => {
        if (existingScores && existingScores.length > 0) {
            const home: Record<string, PlayerStats> = {};
            const away: Record<string, PlayerStats> = {};

            existingScores.forEach((s: any) => {
                const stats: PlayerStats = {
                    goals: s.goals || 0,
                    assists: s.assists || 0,
                    blocks: s.blocks || 0,
                    turns: s.turns || 0,
                };
                if (s.teamId === game.homeTeam?.id) {
                    home[s.playerId] = stats;
                } else if (s.teamId === game.awayTeam?.id) {
                    away[s.playerId] = stats;
                }
            });

            setHomeStats(home);
            setAwayStats(away);
        }
    }, [existingScores, game.homeTeam?.id, game.awayTeam?.id]);

    const updateScoreMutation = useMutation({
        mutationFn: (data: any) => gamesApi.updateBulkScores(game.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gameKeys.all });
            queryClient.invalidateQueries({ queryKey: gameKeys.detail(game.id) || [] });
            queryClient.invalidateQueries({ queryKey: gameKeys.scores(game.id) || [] });
            toast.success('Scores updated successfully');
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update scores');
        },
    });

    const handleStatChange = (team: 'home' | 'away', playerId: string, field: keyof PlayerStats, value: string) => {
        const numValue = Math.max(0, parseInt(value) || 0);
        const setter = team === 'home' ? setHomeStats : setAwayStats;

        setter(prev => ({
            ...prev,
            [playerId]: {
                ...(prev[playerId] || { goals: 0, assists: 0, blocks: 0, turns: 0 }),
                [field]: numValue
            }
        }));
    };

    const calculateTotalGoals = (stats: Record<string, PlayerStats>) => {
        return Object.values(stats).reduce((sum, s) => sum + (s.goals || 0), 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAdmin && !reason) {
            toast.error('Please provide a reason for the override');
            return;
        }

        const playerScores: any[] = [];

        // Process home team
        Object.entries(homeStats).forEach(([playerId, stats]) => {
            if (Object.values(stats).some(v => v > 0)) {
                playerScores.push({ player_id: playerId, ...stats });
            }
        });

        // Process away team
        Object.entries(awayStats).forEach(([playerId, stats]) => {
            if (Object.values(stats).some(v => v > 0)) {
                playerScores.push({ player_id: playerId, ...stats });
            }
        });

        updateScoreMutation.mutate({
            homeTeamScore: calculateTotalGoals(homeStats),
            awayTeamScore: calculateTotalGoals(awayStats),
            reason: isAdmin ? reason : 'Manual score adjustment',
            playerScores,
        });
    };

    const homeTotal = calculateTotalGoals(homeStats);
    const awayTotal = calculateTotalGoals(awayStats);
    const isLoading = homeLoading || awayLoading || scoresLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading rosters and scores...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Info */}
            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl shrink-0">
                        <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-black truncate">{game.name || 'Untitled Game'}</h2>
                        <p className="text-xs text-muted-foreground font-medium truncate">
                            {game.divisionPool?.name || 'No Division'} • {isAdmin ? 'Score Override' : 'Record Scores'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-8 px-4 sm:px-6 py-2 bg-background rounded-xl border shadow-sm shrink-0">
                    <ScoreBadge teamName={game.homeTeam?.name || 'Home'} score={homeTotal} />
                    <div className="text-xl font-black text-muted-foreground opacity-20">VS</div>
                    <ScoreBadge teamName={game.awayTeam?.name || 'Away'} score={awayTotal} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Home Team Side */}
                    <TeamScoreSection
                        teamName={game.homeTeam?.name || 'Home Team'}
                        roster={homeRoster}
                        stats={homeStats}
                        onStatChange={(pId, field, val) => handleStatChange('home', pId, field, val)}
                    />

                    {/* Away Team Side */}
                    <TeamScoreSection
                        teamName={game.awayTeam?.name || 'Away Team'}
                        roster={awayRoster}
                        stats={awayStats}
                        onStatChange={(pId, field, val) => handleStatChange('away', pId, field, val)}
                    />
                </div>

                {/* Override Metadata - Only for admin overrides */}
                <div className="space-y-4">
                    {isAdmin && (
                        <div className="bg-muted/30 p-4 sm:p-6 rounded-2xl border space-y-4">
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Administrative Verification
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason" className="text-sm font-semibold">Reason for Override (Mandatory)</Label>
                                <Input
                                    id="reason"
                                    placeholder="Specify the reason for this manual score override (min. 10 chars)..."
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="bg-background"
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1">
                                    <Info className="h-3.5 w-3.5" />
                                    This change will be logged in the system audit trail.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t">
                        {onCancel && (
                            <Button type="button" variant="ghost" onClick={onCancel} className="rounded-xl px-6">
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setHomeStats({});
                                setAwayStats({});
                                setReason('');
                            }}
                            className="rounded-xl px-4 border-dashed"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset All
                        </Button>
                        <Button
                            type="submit"
                            className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20"
                            disabled={updateScoreMutation.isPending || (isAdmin && reason.length < 10)}
                        >
                            {updateScoreMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {isAdmin ? 'Confirm & Save Override' : 'Save Scores'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

function ScoreBadge({ teamName, score }: { teamName: string, score: number }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-tight">{teamName}</span>
            <span className="text-2xl font-black text-primary leading-none">{score}</span>
        </div>
    );
}

function TeamScoreSection({ teamName, roster, stats, onStatChange }: {
    teamName: string,
    roster: Player[],
    stats: Record<string, PlayerStats>,
    onStatChange: (playerId: string, field: keyof PlayerStats, val: string) => void
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-base md:text-lg uppercase tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full" />
                    {teamName}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md uppercase">
                    {roster.length} Players
                </p>
            </div>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2 border rounded-2xl p-1 bg-muted/20">
                {roster.length > 0 ? (
                    roster.map(player => (
                        <PlayerStatRow
                            key={player.id}
                            player={player}
                            stats={stats[player.id] || { goals: 0, assists: 0, blocks: 0, turns: 0 }}
                            onStatChange={onStatChange}
                        />
                    ))
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <User className="h-8 w-8 opacity-20" />
                        <p className="text-sm font-medium">No players found in roster</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function PlayerStatRow({ player, stats, onStatChange }: {
    player: Player,
    stats: PlayerStats,
    onStatChange: (playerId: string, field: keyof PlayerStats, val: string) => void
}) {
    return (
        <div className="grid grid-cols-[1fr,auto] gap-2 items-center p-2 rounded-xl bg-background hover:shadow-sm border transition-all duration-200 group">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <span className="text-xs font-black text-primary">
                        {player.jerseyNumber !== undefined ? `#${player.jerseyNumber}` : '?'}
                    </span>
                </div>
                <div className="truncate">
                    <p className="text-xs font-bold group-hover:text-primary transition-colors truncate">{player.name}</p>
                    <div className="flex gap-1 mt-0.5">
                        {player.isCaptain && <span className="text-[8px] font-black px-1 rounded bg-amber-500/10 text-amber-600 uppercase">C</span>}
                        {player.isSpiritCaptain && <span className="text-[8px] font-black px-1 rounded bg-sky-500/10 text-sky-600 uppercase">SC</span>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <StatInput label="G" value={stats.goals} onChange={v => onStatChange(player.id, 'goals', v)} highlight />
                <StatInput label="A" value={stats.assists} onChange={v => onStatChange(player.id, 'assists', v)} />
                <StatInput label="B" value={stats.blocks} onChange={v => onStatChange(player.id, 'blocks', v)} />
                <StatInput label="T" value={stats.turns} onChange={v => onStatChange(player.id, 'turns', v)} />
            </div>
        </div>
    );
}

function StatInput({ label, value, onChange, highlight = false }: {
    label: string,
    value: number,
    onChange: (val: string) => void,
    highlight?: boolean
}) {
    const isZero = value === 0;
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter leading-none">{label}</span>
            <Input
                type="number"
                min="0"
                value={isZero ? '' : value}
                onChange={e => onChange(e.target.value)}
                className={cn(
                    "h-8 w-9 text-center p-0 text-xs font-black transition-all rounded-md bg-muted/50 border-transparent",
                    highlight && !isZero && "bg-primary/10 border-primary text-primary",
                    !isZero && "border-primary/20",
                    "hover:bg-muted focus:bg-background"
                )}
                placeholder="0"
            />
        </div>
    );
}
