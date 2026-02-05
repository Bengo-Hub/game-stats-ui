'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Clock,
  Radio,
  RefreshCw,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { publicApi } from '@/lib/api';
import type { Game } from '@/types';

// Extended game type for display with team colors
interface DisplayGame extends Game {
  eventName?: string;
  eventSlug?: string;
  timeElapsed?: string;
  division?: string;
  lastUpdate?: string;
}

export default function LiveGamesPage() {
  const [liveGames, setLiveGames] = React.useState<DisplayGame[]>([]);
  const [upcomingGames, setUpcomingGames] = React.useState<DisplayGame[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = React.useState(new Date());
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  // Fetch live and upcoming games
  const fetchGames = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch live and upcoming games in parallel
      const [liveData, upcomingData] = await Promise.all([
        publicApi.getLiveGames(),
        publicApi.getUpcomingGames(5),
      ]);

      // Transform live games for display
      const transformedLive: DisplayGame[] = liveData.map((game) => ({
        ...game,
        eventName: game.homeTeam?.name ? `${game.homeTeam.name} Event` : 'Unknown Event',
        timeElapsed: calculateTimeElapsed(game.actualStartTime),
        lastUpdate: 'Just now',
      }));

      // Transform upcoming games for display
      const transformedUpcoming: DisplayGame[] = upcomingData.map((game) => ({
        ...game,
        eventName: game.homeTeam?.name ? `${game.homeTeam.name} Event` : 'Unknown Event',
      }));

      setLiveGames(transformedLive);
      setUpcomingGames(transformedUpcoming);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch games:', err);
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate time elapsed since game start
  const calculateTimeElapsed = (startTime?: string): string => {
    if (!startTime) return '--:--';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initial load
  React.useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Auto-refresh every 30 seconds when enabled
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchGames();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchGames]);

  const handleRefresh = () => {
    fetchGames();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTeamColor = (index: number): string => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];
    return colors[index % colors.length];
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="h-5 w-5 text-red-500 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-bold">Live Scores</h1>
          </div>
          <p className="text-muted-foreground">
            Follow games in real-time as they happen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {/* Live Games Section */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <h2 className="text-xl font-semibold">
            Live Now ({liveGames.length})
          </h2>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground ml-auto">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>

        {loading && liveGames.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : liveGames.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No live games</h3>
              <p className="text-muted-foreground">
                Check back later for live action
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveGames.map((game, index) => (
              <Link key={game.id} href={`/live/${game.id}`}>
                <Card className="h-full hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                  {/* Live indicator bar */}
                  <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />

                  <CardContent className="p-4">
                    {/* Event and field info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span className="truncate max-w-[60%]">{game.eventName || 'Event'}</span>
                      <span>
                        {game.fieldLocation?.name || `Field ${index + 1}`}
                      </span>
                    </div>

                    {/* Teams and scores */}
                    <div className="space-y-3">
                      {/* Home team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: game.homeTeam?.primaryColor || getTeamColor(index * 2) }}
                          />
                          <span
                            className={`font-medium ${game.homeTeamScore > game.awayTeamScore ? '' : 'text-muted-foreground'}`}
                          >
                            {game.homeTeam?.name || 'Home Team'}
                          </span>
                        </div>
                        <span
                          className={`text-2xl font-bold ${game.homeTeamScore > game.awayTeamScore ? 'text-primary' : ''}`}
                        >
                          {game.homeTeamScore}
                        </span>
                      </div>

                      {/* Away team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: game.awayTeam?.primaryColor || getTeamColor(index * 2 + 1) }}
                          />
                          <span
                            className={`font-medium ${game.awayTeamScore > game.homeTeamScore ? '' : 'text-muted-foreground'}`}
                          >
                            {game.awayTeam?.name || 'Away Team'}
                          </span>
                        </div>
                        <span
                          className={`text-2xl font-bold ${game.awayTeamScore > game.homeTeamScore ? 'text-primary' : ''}`}
                        >
                          {game.awayTeamScore}
                        </span>
                      </div>
                    </div>

                    {/* Time and last update */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{game.timeElapsed || '--:--'}</span>
                      </div>
                      <span>Updated {game.lastUpdate || 'recently'}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Games Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Coming Up</h2>
          <Link
            href="/discover"
            className="text-sm text-primary hover:underline flex items-center"
          >
            View all events
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading && upcomingGames.length === 0 ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : upcomingGames.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No upcoming games scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingGames.map((game, index) => (
              <Card
                key={game.id}
                className="hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-2">
                        {game.eventName || 'Event'} &bull; {game.fieldLocation?.name || `Field ${index + 1}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: game.homeTeam?.primaryColor || getTeamColor(index * 2) }}
                          />
                          <span className="font-medium">{game.homeTeam?.name || 'TBD'}</span>
                        </div>
                        <span className="text-muted-foreground">vs</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: game.awayTeam?.primaryColor || getTeamColor(index * 2 + 1) }}
                          />
                          <span className="font-medium">{game.awayTeam?.name || 'TBD'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(game.scheduledTime)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
