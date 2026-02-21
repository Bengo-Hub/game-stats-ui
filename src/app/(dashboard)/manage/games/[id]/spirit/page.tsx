'use client';

import { SpiritScoreData, SpiritScoreForm } from '@/components/features/spirit/spirit-score-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { gamesApi } from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

export default function GameSpiritScorePage() {
    const params = useParams();
    const router = useRouter();
    const gameId = params.id as string;
    const [scoringTeamId, setScoringTeamId] = React.useState<string | null>(null);

    const { data: game, isLoading: isLoadingGame } = useQuery({
        queryKey: ['games', gameId],
        queryFn: () => gamesApi.get(gameId),
    });

    React.useEffect(() => {
        if (game && !scoringTeamId) {
            // Default to scoring the away team (common if home team is submitting)
            setScoringTeamId(game.awayTeam?.id || null);
        }
    }, [game, scoringTeamId]);

    const submitMutation = useMutation({
        mutationFn: (data: any) => gamesApi.submitSpiritScore(gameId, data),
        onSuccess: () => {
            toast.success('Spirit score submitted successfully');
            router.back();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to submit spirit score');
        },
    });

    const handleSubmit = async (data: SpiritScoreData) => {
        if (!game) return;

        // The spirit score is SUBMITTED BY one team FOR another team.
        // In the API:
        // team_id: The team BEING scored
        // scored_by_team_id: The team DOING the scoring

        const scoredByTeamId = data.teamId === game.homeTeam?.id ? game.awayTeam?.id : game.homeTeam?.id;

        await submitMutation.mutateAsync({
            rules_knowledge: data.rulesKnowledge,
            fouls_body_contact: data.foulsBodyContact,
            fair_mindedness: data.fairMindedness,
            attitude: data.attitude,
            communication: data.communication,
            comments: data.comments,
            mvp_nomination: data.mvpNomination,
            spirit_nomination: data.spiritNomination,
            team_id: data.teamId,
            scored_by_team_id: scoredByTeamId
        });
    };

    if (isLoadingGame) return <div className="p-8 text-center animate-pulse text-indigo-500 font-medium">Loading game data...</div>;
    if (!game) return <div className="p-8 text-center text-rose-500 font-medium">Game not found</div>;

    const scoringTeamName = scoringTeamId === game.homeTeam?.id ? game.homeTeam?.name : game.awayTeam?.name;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pt-6 pb-12 px-4">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-indigo-50">
                    <ArrowLeft className="h-5 w-5 text-indigo-600" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Spirit Scoring
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {game.homeTeam?.name} <span className="text-xs opacity-50 px-1">vs</span> {game.awayTeam?.name}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-1">
                        Select Team to Score
                    </label>
                    <Tabs
                        value={scoringTeamId || ''}
                        onValueChange={setScoringTeamId}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50 rounded-2xl">
                            <TabsTrigger
                                value={game.homeTeam?.id || 'home'}
                                className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm"
                            >
                                {game.homeTeam?.name} (Home)
                            </TabsTrigger>
                            <TabsTrigger
                                value={game.awayTeam?.id || 'away'}
                                className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm"
                            >
                                {game.awayTeam?.name} (Away)
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {scoringTeamId && (
                    <SpiritScoreForm
                        key={scoringTeamId} // Re-mount form when switching teams
                        gameId={gameId}
                        teamId={scoringTeamId}
                        teamName={scoringTeamName || ''}
                        onSubmit={handleSubmit}
                        className="border-none shadow-2xl shadow-indigo-500/10 rounded-3xl"
                    />
                )}
            </div>
        </div>
    );
}
