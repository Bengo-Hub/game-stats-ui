'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Users,
  Trophy,
  Crown,
  Heart,
  MapPin,
  Calendar,
  Target,
  Swords,
  TrendingUp,
  Shirt,
  Home,
  Plane,
} from 'lucide-react';
import { publicApi } from '@/lib/api/public';
import type { Team, Player, Game } from '@/types';

// Query hooks
function useTeamDetail(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teams', 'detail', teamId],
    queryFn: () => publicApi.getTeam(teamId!),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });
}

function useTeamGames(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teams', teamId, 'games'],
    queryFn: () => publicApi.listGames({ limit: 100 }),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2,
    select: (games) => {
      // Filter games where this team is home or away
      return games.filter(g =>
        g.homeTeam?.id === teamId || g.awayTeam?.id === teamId
      );
    },
  });
}

function useTeamSpiritAverage(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teams', teamId, 'spirit'],
    queryFn: () => publicApi.getTeamSpiritAverage(teamId!),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });
}

// Helper to calculate team stats from games
function calculateTeamStats(games: Game[], teamId: string) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  games.forEach(game => {
    if (game.status !== 'finished' && game.status !== 'ended') return;

    const isHome = game.homeTeam?.id === teamId;
    const teamScore = isHome ? game.homeTeamScore : game.awayTeamScore;
    const opponentScore = isHome ? game.awayTeamScore : game.homeTeamScore;

    pointsFor += teamScore;
    pointsAgainst += opponentScore;

    if (teamScore > opponentScore) wins++;
    else if (teamScore < opponentScore) losses++;
    else draws++;
  });

  return {
    gamesPlayed: wins + losses + draws,
    wins,
    losses,
    draws,
    pointsFor,
    pointsAgainst,
    pointDifferential: pointsFor - pointsAgainst,
    winRate: wins + losses + draws > 0
      ? ((wins / (wins + losses + draws)) * 100).toFixed(1)
      : '0.0',
  };
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.id as string;

  const { data: team, isLoading, isError } = useTeamDetail(teamId);
  const { data: games = [] } = useTeamGames(teamId);
  const { data: spiritAverage } = useTeamSpiritAverage(teamId);

  const teamStats = React.useMemo(() => {
    if (!teamId) return null;
    return calculateTeamStats(games, teamId);
  }, [games, teamId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Team Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The team you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Link
        href="/directory"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Link>

      {/* Team Header */}
      <div className="mb-8">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32 relative">
            {/* Team Logo positioned over gradient */}
            <div className="absolute -bottom-12 left-8">
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="w-24 h-24 rounded-xl object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl border-4 border-background shadow-lg">
                  {team.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <CardContent className="pt-16 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{team.name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {team.divisionName && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      <Trophy className="h-3 w-3" />
                      {team.divisionName}
                    </span>
                  )}
                  {team.initialSeed && team.initialSeed > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Target className="h-3.5 w-3.5" />
                      Seed #{team.initialSeed}
                    </span>
                  )}
                  {team.locationName && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {team.locationName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {team.playersCount || team.players?.length || 0} players
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              {teamStats && teamStats.gamesPlayed > 0 && (
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{teamStats.wins}</p>
                    <p className="text-xs text-muted-foreground">Wins</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{teamStats.losses}</p>
                    <p className="text-xs text-muted-foreground">Losses</p>
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      "text-2xl font-bold",
                      teamStats.pointDifferential > 0 ? 'text-emerald-600' :
                      teamStats.pointDifferential < 0 ? 'text-red-500' : ''
                    )}>
                      {teamStats.pointDifferential > 0 ? '+' : ''}{teamStats.pointDifferential}
                    </p>
                    <p className="text-xs text-muted-foreground">Diff</p>
                  </div>
                  {spiritAverage && spiritAverage.averageScore != null && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {spiritAverage.averageScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">Spirit</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="roster" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roster" className="gap-2">
            <Users className="h-4 w-4" />
            Roster
          </TabsTrigger>
          <TabsTrigger value="games" className="gap-2">
            <Swords className="h-4 w-4" />
            Games
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        {/* Roster Tab */}
        <TabsContent value="roster" className="space-y-4">
          {/* Captains Section */}
          {(team.captain || team.spiritCaptain) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Leadership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {team.captain && (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold">{team.captain.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Team Captain</span>
                          {team.captain.jerseyNumber && (
                            <span className="px-1.5 py-0.5 bg-background rounded text-xs">
                              #{team.captain.jerseyNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {team.spiritCaptain && (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold">{team.spiritCaptain.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-purple-600 dark:text-purple-400 font-medium">Spirit Captain</span>
                          {team.spiritCaptain.jerseyNumber && (
                            <span className="px-1.5 py-0.5 bg-background rounded text-xs">
                              #{team.spiritCaptain.jerseyNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Players List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Players</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {team.playersCount || team.players?.length || 0} players
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team.players && team.players.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {team.players.map((player) => (
                    <div
                      key={player.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        player.isCaptain && "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10",
                        player.isSpiritCaptain && !player.isCaptain && "border-purple-300 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-900/10"
                      )}
                    >
                      {/* Jersey Number */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center font-bold text-sm">
                        {player.jerseyNumber ? `#${player.jerseyNumber}` : <Shirt className="h-4 w-4 text-muted-foreground" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{player.name}</p>
                        <div className="flex items-center gap-1.5">
                          {player.isCaptain && (
                            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 text-xs">
                              <Crown className="h-3 w-3" />
                              C
                            </span>
                          )}
                          {player.isSpiritCaptain && (
                            <span className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 text-xs">
                              <Heart className="h-3 w-3" />
                              S
                            </span>
                          )}
                          {player.gender && (
                            <span className="text-xs text-muted-foreground uppercase">
                              {player.gender}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No player roster available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Games Tab */}
        <TabsContent value="games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Match History</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {games.length} games
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {games.length > 0 ? (
                <div className="space-y-3">
                  {games.map((game) => {
                    const isHome = game.homeTeam?.id === teamId;
                    const teamScore = isHome ? game.homeTeamScore : game.awayTeamScore;
                    const opponentScore = isHome ? game.awayTeamScore : game.homeTeamScore;
                    const opponent = isHome ? game.awayTeam : game.homeTeam;
                    const isWin = teamScore > opponentScore;
                    const isLoss = teamScore < opponentScore;
                    const isFinished = game.status === 'finished' || game.status === 'ended';

                    return (
                      <Link
                        key={game.id}
                        href={`/games/${game.id}`}
                        className="block"
                      >
                        <div className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors",
                          isFinished && isWin && "border-l-4 border-l-emerald-500",
                          isFinished && isLoss && "border-l-4 border-l-red-500"
                        )}>
                          {/* Game Result Badge */}
                          {isFinished && (
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                              isWin ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                              isLoss ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                              "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            )}>
                              {isWin ? 'W' : isLoss ? 'L' : 'D'}
                            </div>
                          )}

                          {/* Game Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {/* Home/Away Badge */}
                              <span className={cn(
                                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                                isHome
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                              )}>
                                {isHome ? <Home className="h-3 w-3" /> : <Plane className="h-3 w-3" />}
                                {isHome ? 'Home' : 'Away'}
                              </span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="font-medium truncate">
                                {opponent?.name || 'TBD'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              {game.gameRound?.name && (
                                <span className="px-1.5 py-0.5 bg-muted rounded">
                                  {game.gameRound.name}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(game.scheduledTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Score */}
                          {isFinished && (
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {teamScore} - {opponentScore}
                              </p>
                            </div>
                          )}

                          {!isFinished && (
                            <div className="text-right">
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                game.status === 'in_progress'
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              )}>
                                {game.status === 'in_progress' ? 'LIVE' : game.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No games scheduled yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          {/* Team Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {teamStats && teamStats.gamesPlayed > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-3xl font-bold">{teamStats.gamesPlayed}</p>
                    <p className="text-sm text-muted-foreground">Games Played</p>
                  </div>
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{teamStats.winRate}%</p>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-3xl font-bold">{teamStats.pointsFor}</p>
                    <p className="text-sm text-muted-foreground">Points Scored</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-3xl font-bold">{teamStats.pointsAgainst}</p>
                    <p className="text-sm text-muted-foreground">Points Against</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No games completed yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Spirit Score */}
          {spiritAverage && spiritAverage.averageScore != null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-purple-500" />
                  Spirit Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-5">
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-center sm:col-span-1">
                    <p className="text-3xl font-bold text-purple-600">{spiritAverage.averageScore.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">Average</p>
                  </div>
                  {spiritAverage.breakdown && (
                    <>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-xl font-bold">{spiritAverage.breakdown.rulesKnowledge?.toFixed(1) ?? '--'}</p>
                        <p className="text-xs text-muted-foreground">Rules</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-xl font-bold">{spiritAverage.breakdown.foulsBodyContact?.toFixed(1) ?? '--'}</p>
                        <p className="text-xs text-muted-foreground">Fouls</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-xl font-bold">{spiritAverage.breakdown.fairMindedness?.toFixed(1) ?? '--'}</p>
                        <p className="text-xs text-muted-foreground">Fair Play</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-xl font-bold">{spiritAverage.breakdown.attitude?.toFixed(1) ?? '--'}</p>
                        <p className="text-xs text-muted-foreground">Attitude</p>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Based on {spiritAverage.gamesPlayed ?? 0} rated games
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
