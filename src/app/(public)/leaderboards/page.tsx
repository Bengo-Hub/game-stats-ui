'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { publicApi, type TeamSpiritAverage } from '@/lib/api';
import type { PlayerStat, Team } from '@/types';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Medal,
  RefreshCw,
  Star,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import * as React from 'react';

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
  // Filtering state
  const [selectedGender, setSelectedGender] = React.useState<string>('all');
  const [selectedTeam, setSelectedTeam] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');

  // Fetch teams for filter
  const { data: teamsData = [] } = useQuery({
    queryKey: ['teams', 'list'],
    queryFn: () => publicApi.listTeams(),
    staleTime: 1000 * 60 * 5,
  });
  const teams = teamsData;

  const params = React.useMemo(() => ({
    limit: 50,
    gender: selectedGender !== 'all' ? selectedGender : undefined,
    teamId: selectedTeam !== 'all' ? selectedTeam : undefined,
  }), [selectedGender, selectedTeam]);

  // Fetch all leaderboards in parallel
  const results = useQueries({
    queries: [
      {
        queryKey: ['leaderboards', 'goals', params],
        queryFn: () => publicApi.getPlayerLeaderboard({ category: 'goals', ...params }),
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: ['leaderboards', 'assists', params],
        queryFn: () => publicApi.getPlayerLeaderboard({ category: 'assists', ...params }),
        staleTime: 1000 * 60 * 2,
      },
      {
        queryKey: ['leaderboards', 'spirit'],
        queryFn: () => publicApi.getSpiritLeaderboard({ limit: 50 }),
        staleTime: 1000 * 60 * 5,
      }
    ]
  });

  const loading = results.some((r: any) => r.isLoading);
  const hasError = results.some((r: any) => r.isError);
  const errorMsg = results.find((r: any) => r.error)?.error?.message || 'Failed to load leaderboards';

  const handleRefresh = () => {
    results.forEach((r: any) => r.refetch());
  };

  // Transform data with ranks
  const topScorers: DisplayPlayerStat[] = React.useMemo(() => {
    return (results[0].data || []).map((player: PlayerStat, index: number) => ({
      ...player,
      rank: index + 1,
    }));
  }, [results[0].data]);

  const topAssists: DisplayPlayerStat[] = React.useMemo(() => {
    return (results[1].data || []).map((player: PlayerStat, index: number) => ({
      ...player,
      rank: index + 1,
    }));
  }, [results[1].data]);

  const spiritLeaders: DisplaySpiritStat[] = React.useMemo(() => {
    return (results[2].data || []).map((team: TeamSpiritAverage, index: number) => ({
      ...team,
      rank: index + 1,
    }));
  }, [results[2].data]);

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
      <div className="flex flex-col gap-4 max-w-4xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
          <div className="flex-1 w-full">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search players or teams..."
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4 w-full sm:w-auto">
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Users className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Gender</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team: Team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="col-span-2 sm:col-span-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{errorMsg}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
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
                          className={`flex items-center gap-3 p-2 rounded-lg ${player.rank <= 3 ? 'bg-primary/5' : ''
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
                          className={`flex items-center gap-3 p-2 rounded-lg ${player.rank <= 3 ? 'bg-primary/5' : ''
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
                          className={`flex items-center gap-3 p-2 rounded-lg ${team.rank <= 3 ? 'bg-primary/5' : ''
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
