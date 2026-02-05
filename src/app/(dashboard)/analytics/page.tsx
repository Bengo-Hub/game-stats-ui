'use client';

import * as React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BarChart, DonutChart } from '@tremor/react';
import { TrendingUp, Users, Trophy, Target, Star, Search, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { analyticsApi } from '@/lib/api/analytics';
import { publicApi } from '@/lib/api/public';
import { useAuthStore } from '@/stores/auth';

export default function AnalyticsPage() {
  const [query, setQuery] = React.useState('');
  const { user } = useAuthStore();

  // Fetch player leaderboard for top scorers
  const {
    data: playerStats = [],
    isLoading: isLoadingPlayers,
    refetch: refetchPlayers,
    isFetching: isFetchingPlayers,
  } = useQuery({
    queryKey: ['analytics', 'players'],
    queryFn: () => publicApi.getPlayerLeaderboard({ limit: 10 }),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch spirit leaderboard
  const {
    data: spiritStats = [],
    isLoading: isLoadingSpirit,
  } = useQuery({
    queryKey: ['analytics', 'spirit'],
    queryFn: () => publicApi.getSpiritLeaderboard({ limit: 10 }),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch teams for division distribution
  const {
    data: teams = [],
    isLoading: isLoadingTeams,
  } = useQuery({
    queryKey: ['analytics', 'teams'],
    queryFn: () => publicApi.listTeams({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch live events count
  const {
    data: liveEvents = [],
    isLoading: isLoadingLive,
  } = useQuery({
    queryKey: ['analytics', 'liveEvents'],
    queryFn: () => publicApi.getLiveEvents(),
    staleTime: 1000 * 30,
  });

  // AI Query mutation
  const queryMutation = useMutation({
    mutationFn: (question: string) =>
      analyticsApi.query({
        question,
        userId: user?.id || 'anonymous',
      }),
  });

  const handleQuery = async () => {
    if (!query.trim()) return;
    queryMutation.mutate(query);
  };

  // Calculate stats from fetched data
  const stats = React.useMemo(() => {
    const totalPlayers = playerStats.length;
    const totalTeams = teams.length;
    const activeEvents = liveEvents.length;

    // Calculate average spirit from spirit stats
    const avgSpirit = spiritStats.length > 0
      ? spiritStats.reduce((acc, s) => acc + s.averageScore, 0) / spiritStats.length
      : 0;

    return {
      totalTeams,
      totalPlayers,
      activeEvents,
      averageSpirit: avgSpirit,
    };
  }, [playerStats, teams, liveEvents, spiritStats]);

  // Process data for charts
  const topScorersData = React.useMemo(() => {
    return playerStats.slice(0, 5).map((p) => ({
      name: p.playerName,
      goals: p.goals,
    }));
  }, [playerStats]);

  const spiritScoresData = React.useMemo(() => {
    return spiritStats.slice(0, 5).map((s) => ({
      team: s.teamName,
      spirit: s.averageScore,
    }));
  }, [spiritStats]);

  // Division distribution from teams
  const divisionDistribution = React.useMemo(() => {
    const divisionMap = new Map<string, number>();
    teams.forEach((team) => {
      const division = team.divisionName || 'Unassigned';
      divisionMap.set(division, (divisionMap.get(division) || 0) + 1);
    });
    return Array.from(divisionMap.entries()).map(([name, value]) => ({ name, value }));
  }, [teams]);

  const isLoading = isLoadingPlayers || isLoadingSpirit || isLoadingTeams || isLoadingLive;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Comprehensive tournament statistics and insights"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPlayers()}
          disabled={isFetchingPlayers}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetchingPlayers ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* AI Query Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Analytics Query
          </CardTitle>
          <CardDescription>
            Ask questions about your tournament data in natural language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Who are the top 5 scorers in the Open division?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              className="flex-1"
            />
            <Button onClick={handleQuery} disabled={queryMutation.isPending}>
              <Search className="h-4 w-4 mr-2" />
              {queryMutation.isPending ? 'Analyzing...' : 'Query'}
            </Button>
          </div>

          {queryMutation.isError && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                {queryMutation.error instanceof Error ? queryMutation.error.message : 'Query failed. Please try again.'}
              </p>
            </div>
          )}

          {queryMutation.data && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">{queryMutation.data.explanation}</p>
              {queryMutation.data.results && queryMutation.data.results.length > 0 && (
                <BarChart
                  data={queryMutation.data.results.slice(0, 10).map((r, i) => ({
                    name: String(Object.values(r)[0] || `Item ${i + 1}`),
                    value: Number(Object.values(r)[1]) || 0,
                  }))}
                  index="name"
                  categories={['value']}
                  colors={['blue']}
                  valueFormatter={(v) => `${v}`}
                  className="h-48"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              Registered teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Players</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              Active players
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Live Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEvents}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Avg Spirit</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageSpirit.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Out of 4.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Division Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Teams by Division</CardTitle>
            <CardDescription>Distribution across divisions</CardDescription>
          </CardHeader>
          <CardContent>
            {divisionDistribution.length > 0 ? (
              <DonutChart
                data={divisionDistribution}
                index="name"
                category="value"
                colors={['blue', 'cyan', 'pink', 'amber', 'emerald', 'violet']}
                valueFormatter={(v) => `${v} teams`}
                className="h-64"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No division data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Scorers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Scorers</CardTitle>
            <CardDescription>Players with most goals</CardDescription>
          </CardHeader>
          <CardContent>
            {topScorersData.length > 0 ? (
              <BarChart
                data={topScorersData}
                index="name"
                categories={['goals']}
                colors={['emerald']}
                valueFormatter={(v) => `${v} goals`}
                layout="vertical"
                className="h-64"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No scoring data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Spirit Scores Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spirit Scores</CardTitle>
            <CardDescription>Top teams by spirit rating</CardDescription>
          </CardHeader>
          <CardContent>
            {spiritScoresData.length > 0 ? (
              <BarChart
                data={spiritScoresData}
                index="team"
                categories={['spirit']}
                colors={['amber']}
                valueFormatter={(v) => `${v.toFixed(1)}`}
                layout="vertical"
                className="h-64"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No spirit data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Scorers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Scorers</CardTitle>
            <CardDescription>Players with most goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {playerStats.length > 0 ? (
                playerStats.slice(0, 5).map((player, index) => (
                  <div
                    key={player.playerId}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{player.playerName}</p>
                      <p className="text-sm text-muted-foreground">{player.teamName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="font-bold">{player.goals}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No player data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Assisters Table */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Assisters</CardTitle>
            <CardDescription>Players with most assists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {playerStats.length > 0 ? (
                [...playerStats]
                  .sort((a, b) => b.assists - a.assists)
                  .slice(0, 5)
                  .map((player, index) => (
                    <div
                      key={`assist-${player.playerId}`}
                      className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-amber-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{player.playerName}</p>
                        <p className="text-sm text-muted-foreground">{player.teamName}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-blue-500" />
                        <span className="font-bold">{player.assists}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No assist data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Spirit Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Spirit Leaderboard</CardTitle>
            <CardDescription>Teams with highest spirit scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spiritStats.length > 0 ? (
                spiritStats.slice(0, 5).map((team, index) => (
                  <div
                    key={team.teamId}
                    className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-primary/10 text-primary'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{team.teamName}</p>
                      <p className="text-sm text-muted-foreground">{team.gamesPlayed} games played</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold">{team.averageScore.toFixed(1)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No spirit data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
