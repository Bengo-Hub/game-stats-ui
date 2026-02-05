'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/stores/auth';
import { publicApi } from '@/lib/api';
import type { Game, Event } from '@/types';
import {
  Trophy,
  Users,
  CalendarDays,
  BarChart3,
  Radio,
  Clock,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface DashboardStats {
  activeEvents: number;
  liveGames: number;
  totalTeams: number;
  upcomingGames: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, value, description, icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-4 w-24" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useUser();
  const [stats, setStats] = React.useState<DashboardStats>({
    activeEvents: 0,
    liveGames: 0,
    totalTeams: 0,
    upcomingGames: 0,
  });
  const [liveGames, setLiveGames] = React.useState<Game[]>([]);
  const [upcomingGames, setUpcomingGames] = React.useState<Game[]>([]);
  const [recentEvents, setRecentEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [liveData, upcomingData, eventsData, teamsData] = await Promise.all([
        publicApi.getLiveGames().catch(() => []),
        publicApi.getUpcomingGames(5).catch(() => []),
        publicApi.listEvents({ status: 'in_progress' }).catch(() => []),
        publicApi.listTeams({ limit: 100 }).catch(() => []),
      ]);

      setLiveGames(liveData);
      setUpcomingGames(upcomingData);
      setRecentEvents(eventsData.slice(0, 3));

      setStats({
        activeEvents: eventsData.length,
        liveGames: liveData.length,
        totalTeams: teamsData.length,
        upcomingGames: upcomingData.length,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 60 seconds
  React.useEffect(() => {
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const formatGameTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your events today.
          </p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Stats grid - responsive from 1 to 4 columns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Events"
          value={stats.activeEvents}
          description={stats.activeEvents === 1 ? '1 event in progress' : `${stats.activeEvents} events in progress`}
          icon={<CalendarDays className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Live Games"
          value={stats.liveGames}
          description="Games happening now"
          icon={<Radio className="h-4 w-4 text-green-500" />}
          loading={loading}
        />
        <StatCard
          title="Upcoming Games"
          value={stats.upcomingGames}
          description="Scheduled for today"
          icon={<Trophy className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Total Teams"
          value={stats.totalTeams}
          description="Across all events"
          icon={<Users className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live games */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Now
              </CardTitle>
              <CardDescription>Games currently in progress</CardDescription>
            </div>
            <Link href="/live">
              <Button variant="ghost" size="sm">
                View all
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : liveGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No live games right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveGames.slice(0, 4).map((game) => (
                  <Link key={game.id} href={`/live/${game.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {game.homeTeam?.name || 'Home'} vs {game.awayTeam?.name || 'Away'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {game.fieldLocation?.name || 'Field'} • Started {formatGameTime(game.actualStartTime || game.scheduledTime)}
                        </span>
                      </div>
                      <div className="text-lg font-bold">
                        {game.homeTeamScore} - {game.awayTeamScore}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming games */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Games</CardTitle>
              <CardDescription>Games scheduled soon</CardDescription>
            </div>
            <Link href="/games">
              <Button variant="ghost" size="sm">
                View all
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : upcomingGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming games scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingGames.slice(0, 4).map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {game.homeTeam?.name || 'TBD'} vs {game.awayTeam?.name || 'TBD'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {game.fieldLocation?.name || 'Field'} • {formatGameTime(game.scheduledTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Scheduled</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Events */}
      {recentEvents.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Events</CardTitle>
              <CardDescription>Events currently in progress</CardDescription>
            </div>
            <Link href="/events">
              <Button variant="ghost" size="sm">
                Manage events
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentEvents.map((event) => (
                <Link key={event.id} href={`/discover/${event.slug}`}>
                  <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                    <h3 className="font-semibold truncate">{event.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        In Progress
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/events">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <CalendarDays className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Manage Events</div>
                  <div className="text-xs text-muted-foreground">Create or edit events</div>
                </div>
              </Button>
            </Link>
            <Link href="/games">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Trophy className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Score Games</div>
                  <div className="text-xs text-muted-foreground">Record live scores</div>
                </div>
              </Button>
            </Link>
            <Link href="/teams">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <Users className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">Manage Teams</div>
                  <div className="text-xs text-muted-foreground">Edit rosters</div>
                </div>
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start h-auto py-3">
                <BarChart3 className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">View Analytics</div>
                  <div className="text-xs text-muted-foreground">Statistics & reports</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
