'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Target,
  Star,
  TrendingUp,
  Medal,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { publicApi, type TeamSpiritAverage } from '@/lib/api';
import type { PlayerStat } from '@/types';

// Extended player stat for display with rank
interface DisplayPlayerStat extends PlayerStat {
  rank: number;
}

// Extended spirit average for display with rank
interface DisplaySpiritStat extends TeamSpiritAverage {
  rank: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Medal className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="w-5 text-center text-muted-foreground">{rank}</span>;
  }
};

export default function LeaderboardsPage() {
  const [topScorers, setTopScorers] = React.useState<DisplayPlayerStat[]>([]);
  const [topAssists, setTopAssists] = React.useState<DisplayPlayerStat[]>([]);
  const [spiritLeaders, setSpiritLeaders] = React.useState<DisplaySpiritStat[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  // Fetch leaderboard data
  const fetchLeaderboards = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all leaderboards in parallel
      const [scorersData, assistsData, spiritData] = await Promise.all([
        publicApi.getPlayerLeaderboard({ category: 'goals', limit: 10 }),
        publicApi.getPlayerLeaderboard({ category: 'assists', limit: 10 }),
        publicApi.getSpiritLeaderboard({ limit: 10 }),
      ]);

      // Transform data with ranks
      const rankedScorers: DisplayPlayerStat[] = scorersData.map((player, index) => ({
        ...player,
        rank: index + 1,
      }));

      const rankedAssists: DisplayPlayerStat[] = assistsData.map((player, index) => ({
        ...player,
        rank: index + 1,
      }));

      const rankedSpirit: DisplaySpiritStat[] = spiritData.map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

      setTopScorers(rankedScorers);
      setTopAssists(rankedAssists);
      setSpiritLeaders(rankedSpirit);
    } catch (err) {
      console.error('Failed to fetch leaderboards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboards');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    fetchLeaderboards();
  }, [fetchLeaderboards]);

  // Client-side search filtering
  const filteredScorers = React.useMemo(() => {
    if (!search) return topScorers;
    const searchLower = search.toLowerCase();
    return topScorers.filter(
      (player) =>
        player.playerName?.toLowerCase().includes(searchLower) ||
        player.teamName?.toLowerCase().includes(searchLower)
    );
  }, [topScorers, search]);

  const filteredAssists = React.useMemo(() => {
    if (!search) return topAssists;
    const searchLower = search.toLowerCase();
    return topAssists.filter(
      (player) =>
        player.playerName?.toLowerCase().includes(searchLower) ||
        player.teamName?.toLowerCase().includes(searchLower)
    );
  }, [topAssists, search]);

  const filteredSpirit = React.useMemo(() => {
    if (!search) return spiritLeaders;
    const searchLower = search.toLowerCase();
    return spiritLeaders.filter((team) =>
      team.teamName?.toLowerCase().includes(searchLower)
    );
  }, [spiritLeaders, search]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Leaderboards
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Top performers across all events. Stats updated in real-time.
        </p>
      </div>

      {/* Search and Refresh */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search players or teams..."
          className="flex-1"
        />
        <Button
          variant="outline"
          onClick={fetchLeaderboards}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLeaderboards}>
            Retry
          </Button>
        </div>
      )}

      {loading && topScorers.length === 0 ? (
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Scorers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    Top Scorers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredScorers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {search ? 'No players match your search' : 'No scoring data available'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredScorers.map((player) => (
                        <div
                          key={`scorer-${player.playerId || player.rank}`}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            player.rank <= 3 ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="w-6 flex justify-center">
                            {getRankIcon(player.rank)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {player.playerName || 'Unknown Player'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {player.teamName || 'Unknown Team'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              {player.goals || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {player.gamesPlayed || 0} games
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Assists */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Top Assists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredAssists.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {search ? 'No players match your search' : 'No assist data available'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredAssists.map((player) => (
                        <div
                          key={`assist-${player.playerId || player.rank}`}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            player.rank <= 3 ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="w-6 flex justify-center">
                            {getRankIcon(player.rank)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {player.playerName || 'Unknown Player'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {player.teamName || 'Unknown Team'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              {player.assists || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {player.gamesPlayed || 0} games
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Spirit Scores */}
              <Card className="lg:col-span-2 max-w-2xl mx-auto w-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="h-5 w-5 text-primary" />
                    Spirit Leaders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredSpirit.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {search ? 'No teams match your search' : 'No spirit data available'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {filteredSpirit.map((team) => (
                        <div
                          key={`spirit-${team.teamId || team.rank}`}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            team.rank <= 3 ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="w-6 flex justify-center">
                            {getRankIcon(team.rank)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {team.teamName || 'Unknown Team'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {team.gamesPlayed || 0} games
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              {team.averageScore?.toFixed(1) || '0.0'}
                            </div>
                            <div className="text-xs text-muted-foreground">avg spirit</div>
                          </div>
                          {/* Spirit breakdown tooltip - show on hover */}
                          {team.breakdown && (
                            <div className="hidden sm:flex gap-1 text-xs">
                              <span className="px-1.5 py-0.5 rounded bg-muted" title="Rules Knowledge">
                                R:{team.breakdown.rulesKnowledge?.toFixed(1) || '-'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-muted" title="Fouls & Body Contact">
                                F:{team.breakdown.foulsBodyContact?.toFixed(1) || '-'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-muted" title="Fair-Mindedness">
                                FM:{team.breakdown.fairMindedness?.toFixed(1) || '-'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-muted" title="Attitude">
                                A:{team.breakdown.attitude?.toFixed(1) || '-'}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-muted" title="Communication">
                                C:{team.breakdown.communication?.toFixed(1) || '-'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
