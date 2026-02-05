'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserCircle, RefreshCw, Target, Trophy, AlertCircle } from 'lucide-react';
import { publicApi } from '@/lib/api/public';
import type { PlayerStat } from '@/types';

export default function PlayersPage() {
  const [search, setSearch] = React.useState('');

  // Fetch player stats from API (leaderboard endpoint)
  const {
    data: players = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard', 'players'],
    queryFn: () => publicApi.getPlayerLeaderboard({ limit: 100 }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter players based on search
  const filteredPlayers = React.useMemo(() => {
    if (!search) return players;
    const searchLower = search.toLowerCase();
    return players.filter(
      (player) =>
        player.playerName.toLowerCase().includes(searchLower) ||
        player.teamName.toLowerCase().includes(searchLower)
    );
  }, [players, search]);

  // Generate a consistent color from player name
  const getPlayerColor = (name: string) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#f97316', '#6366f1',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Get initials from player name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Players" description="View player statistics and profiles">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search players or teams..."
        className="max-w-md"
      />

      {/* Error State */}
      {isError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load players'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filteredPlayers.length === 0 ? (
        <EmptyState
          icon={<UserCircle className="h-12 w-12" />}
          title="No players found"
          description={search ? 'Try adjusting your search' : 'Player statistics will appear here once games are played'}
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch('')}>
                Clear Search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Results count */}
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredPlayers.length}</span> players
          </p>

          {/* Mobile Card View */}
          <div className="grid gap-4 sm:hidden">
            {filteredPlayers.map((player, index) => (
              <Card key={player.playerId} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: getPlayerColor(player.playerName) }}
                      >
                        {getInitials(player.playerName)}
                      </div>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{player.playerName}</h3>
                      <p className="text-sm text-muted-foreground truncate">{player.teamName}</p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{player.goals} goals</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{player.assists} assists</span>
                    </div>
                    <span className="text-muted-foreground">
                      {player.gamesPlayed} games
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-15">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">Games</TableHead>
                  <TableHead className="text-center">Goals</TableHead>
                  <TableHead className="text-center">Assists</TableHead>
                  <TableHead className="text-center">Total Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.map((player, index) => (
                  <TableRow key={player.playerId} className="hover:bg-muted/50">
                    <TableCell>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-amber-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: getPlayerColor(player.playerName) }}
                        >
                          {getInitials(player.playerName)}
                        </div>
                        <span className="font-medium">{player.playerName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{player.teamName}</TableCell>
                    <TableCell className="text-center">{player.gamesPlayed}</TableCell>
                    <TableCell className="text-center font-mono font-medium text-green-600">
                      {player.goals}
                    </TableCell>
                    <TableCell className="text-center font-mono font-medium text-blue-600">
                      {player.assists}
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold">
                      {player.goals + player.assists}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
