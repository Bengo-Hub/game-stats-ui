'use client';

import TournamentBracket, { GamesBracket, SimpleBracket } from '@/components/features/brackets/tournament-bracket';
import { EventCategoryBadge, getCountryFlag } from '@/components/features/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { publicApi } from '@/lib/api/public';
import { cn } from '@/lib/utils';
import type { Event, Game } from '@/types';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Heart,
  Info,
  Layers,
  MapPin,
  Search,
  Share2,
  Shield,
  Swords,
  Table,
  Target,
  Trophy,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';

// Query hooks
function useEventDetail(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['events', 'detail', idOrSlug],
    queryFn: () => publicApi.getEvent(idOrSlug!),
    enabled: !!idOrSlug,
    staleTime: 1000 * 60 * 5,
  });
}

function useEventGames(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'games'],
    queryFn: () => publicApi.listGames({ limit: 200 }), // Get all games for this event
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2,
  });
}

function useEventTeams(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'teams'],
    queryFn: () => publicApi.listTeams({ eventId }),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });
}

function useEventSpirit(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'spirit'],
    queryFn: () => publicApi.getSpiritLeaderboard({ eventId }),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });
}

function useEventStandings(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'standings'],
    queryFn: () => publicApi.getEventStandings(eventId!),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });
}

function useEventRounds(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'rounds'],
    queryFn: () => publicApi.getEventRounds(eventId!),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });
}

function useEventBracket(eventId: string | undefined, roundId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'bracket', roundId],
    queryFn: () => publicApi.getEventBracket(eventId!, roundId),
    enabled: !!eventId && !!roundId,
    staleTime: 1000 * 60 * 5,
  });
}

function usePlayerLeaderboard(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'players'],
    queryFn: () => publicApi.getPlayerLeaderboard({ eventId, limit: 50 }),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });
}

function useEventCrew(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'crew'],
    queryFn: () => publicApi.getEventCrew(eventId!),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 10,
  });
}

// Helper functions
function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString('en-US', options || {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getGameStatusConfig(status: string) {
  const configs: Record<string, { color: string; label: string; bg: string }> = {
    'in_progress': { color: 'text-emerald-600', label: 'LIVE', bg: 'bg-emerald-500' },
    'finished': { color: 'text-orange-600', label: 'ENDED', bg: 'bg-orange-500' },
    'ended': { color: 'text-gray-600', label: 'ENDED', bg: 'bg-gray-500' },
    'scheduled': { color: 'text-indigo-600', label: 'UPCOMING', bg: 'bg-indigo-500' },
    'canceled': { color: 'text-red-600', label: 'CANCELED', bg: 'bg-red-500' },
  };
  return configs[status] || configs.scheduled;
}

// Game Card Component
function GameCard({ game, onClick }: { game: Game; onClick?: () => void }) {
  const statusConfig = getGameStatusConfig(game.status);
  const isLive = game.status === 'in_progress';

  return (
    <Card
      className={cn(
        'hover:border-primary/50 transition-all cursor-pointer',
        isLive && 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded',
              statusConfig.color,
              isLive ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-muted'
            )}>
              {statusConfig.label}
            </span>
            {game.gameRound && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {game.gameRound.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {game.fieldLocation && <span>{game.fieldLocation.name}</span>}
          </div>
        </div>

        {/* Time */}
        {game.scheduledTime && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(game.scheduledTime, { day: 'numeric', month: 'short' })}</span>
            <Clock className="h-3 w-3 ml-2" />
            <span>{formatTime(game.scheduledTime)}</span>
          </div>
        )}

        {/* Teams and Scores */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {game.homeTeam?.logoUrl ? (
                <img src={game.homeTeam.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {game.homeTeam?.name?.charAt(0) || 'H'}
                </div>
              )}
              <span className={cn(
                'font-medium truncate',
                game.homeTeamScore > game.awayTeamScore ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {game.homeTeam?.name || 'Home Team'}
              </span>
            </div>
            <span className={cn(
              'text-xl font-bold min-w-[2rem] text-right',
              game.homeTeamScore > game.awayTeamScore && 'text-emerald-600'
            )}>
              {game.status === 'scheduled' ? '-' : game.homeTeamScore}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {game.awayTeam?.logoUrl ? (
                <img src={game.awayTeam.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold">
                  {game.awayTeam?.name?.charAt(0) || 'A'}
                </div>
              )}
              <span className={cn(
                'font-medium truncate',
                game.awayTeamScore > game.homeTeamScore ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {game.awayTeam?.name || 'Away Team'}
              </span>
            </div>
            <span className={cn(
              'text-xl font-bold min-w-[2rem] text-right',
              game.awayTeamScore > game.homeTeamScore && 'text-emerald-600'
            )}>
              {game.status === 'scheduled' ? '-' : game.awayTeamScore}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Timetable Modal Component
function TimetableModal({
  open,
  onOpenChange,
  event,
  games
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  games: Game[];
}) {
  const [selectedDivision, setSelectedDivision] = React.useState<string>('all');
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  // Get unique dates and divisions
  const dates = React.useMemo(() => {
    const dateSet = new Set<string>();
    games.forEach(g => {
      if (g.scheduledTime) {
        const date = g.scheduledTime.split('T')[0];
        dateSet.add(date);
      }
    });
    return Array.from(dateSet).sort();
  }, [games]);

  const divisions = event.divisions || [];

  // Get unique fields
  const fields = React.useMemo(() => {
    const fieldSet = new Map<string, string>();
    games.forEach(g => {
      if (g.fieldLocation) {
        fieldSet.set(g.fieldLocation.id, g.fieldLocation.name);
      }
    });
    return Array.from(fieldSet.entries()).map(([id, name]) => ({ id, name }));
  }, [games]);

  // Filter games
  const filteredGames = React.useMemo(() => {
    return games.filter(g => {
      if (!g.scheduledTime) return false; // Skip games without scheduled time
      if (selectedDivision !== 'all' && g.gameRound?.roundType !== selectedDivision) return false;
      if (selectedDate && !g.scheduledTime.startsWith(selectedDate)) return false;
      return true;
    });
  }, [games, selectedDivision, selectedDate]);

  // Group games by time and field for timetable
  const timetable = React.useMemo(() => {
    const times = new Set<string>();
    filteredGames.forEach(g => {
      if (g.scheduledTime) {
        const time = formatTime(g.scheduledTime);
        times.add(time);
      }
    });

    const sortedTimes = Array.from(times).sort();
    const rows: { time: string; games: Record<string, Game | null> }[] = [];

    sortedTimes.forEach(time => {
      const row: Record<string, Game | null> = {};
      fields.forEach(f => {
        const game = filteredGames.find(
          g => formatTime(g.scheduledTime) === time && g.fieldLocation?.id === f.id
        );
        row[f.id] = game || null;
      });
      rows.push({ time, games: row });
    });

    return rows;
  }, [filteredGames, fields]);

  React.useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl h-[95vh] max-h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="p-4 flex-row items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <Table className="h-5 w-5" />
            <div>
              <DialogTitle className="text-lg font-semibold">{event.name}</DialogTitle>
              <p className="text-xs text-white/70">Tournament Timetable</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        {/* Filters */}
        <div className="p-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Division filter */}
            {divisions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Division</span>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setSelectedDivision('all')}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      selectedDivision === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-background hover:bg-muted border'
                    )}
                  >
                    All
                  </button>
                  {divisions.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDivision(d.divisionType)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                        selectedDivision === d.divisionType
                          ? 'bg-indigo-600 text-white'
                          : 'bg-background hover:bg-muted border'
                      )}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</span>
              <div className="flex gap-1 flex-wrap">
                {dates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                      selectedDate === date
                        ? 'bg-indigo-600 text-white'
                        : 'bg-background hover:bg-muted border'
                    )}
                  >
                    {formatDate(date, { day: 'numeric', month: 'short', weekday: 'short' })}
                  </button>
                ))}
              </div>
            </div>

            {/* Games count */}
            <div className="ml-auto text-xs text-muted-foreground">
              {filteredGames.length} games
            </div>
          </div>
        </div>

        {/* Timetable grid - Scrollable */}
        <div className="flex-1 overflow-auto p-4">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-muted">
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide border-r w-20 bg-muted">
                    Time
                  </th>
                  {fields.map(f => (
                    <th key={f.id} className="p-3 text-center text-xs font-semibold uppercase tracking-wide border-r last:border-r-0 bg-muted min-w-[180px] lg:min-w-[220px]">
                      {f.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timetable.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-muted/20">
                    <td className="p-3 text-sm font-bold border-r bg-muted/50 align-middle text-center">
                      {row.time}
                    </td>
                    {fields.map(f => {
                      const game = row.games[f.id];
                      const isLive = game?.status === 'in_progress';
                      const isFinished = game?.status === 'finished' || game?.status === 'ended';
                      return (
                        <td key={f.id} className="p-2 border-r last:border-r-0 align-top">
                          {game ? (
                            <Link href={`/live/${game.id}`} onClick={() => onOpenChange(false)}>
                              <div className={cn(
                                'p-3 rounded-lg transition-all hover:shadow-md cursor-pointer',
                                isLive ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800' :
                                  isFinished ? 'bg-muted/50 hover:bg-muted' :
                                    'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                              )}>
                                {/* Round badge */}
                                <div className="flex items-center gap-2 mb-2">
                                  {game.gameRound && (
                                    <span className={cn(
                                      'px-2 py-0.5 text-[10px] font-bold uppercase rounded',
                                      game.gameRound.roundType === 'pool' ? 'bg-blue-500 text-white' :
                                        game.gameRound.roundType === 'crossover' ? 'bg-orange-500 text-white' :
                                          game.gameRound.roundType === 'bracket' ? 'bg-purple-500 text-white' :
                                            game.gameRound.roundType === 'final' ? 'bg-amber-500 text-white' :
                                              'bg-gray-500 text-white'
                                    )}>
                                      {game.gameRound.roundType}
                                    </span>
                                  )}
                                  {isLive && (
                                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded animate-pulse">
                                      LIVE
                                    </span>
                                  )}
                                  {game.name && (
                                    <span className="text-[10px] text-muted-foreground">{game.name}</span>
                                  )}
                                </div>

                                {/* Teams */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={cn(
                                      'text-sm truncate flex-1',
                                      isFinished && game.homeTeamScore > game.awayTeamScore ? 'font-bold' : 'font-medium'
                                    )}>
                                      {game.homeTeam?.name || 'TBD'}
                                    </span>
                                    <span className={cn(
                                      'text-lg font-bold min-w-[1.5rem] text-right',
                                      isFinished && game.homeTeamScore > game.awayTeamScore ? 'text-emerald-600' : ''
                                    )}>
                                      {game.status === 'scheduled' ? '-' : game.homeTeamScore}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={cn(
                                      'text-sm truncate flex-1',
                                      isFinished && game.awayTeamScore > game.homeTeamScore ? 'font-bold' : 'font-medium'
                                    )}>
                                      {game.awayTeam?.name || 'TBD'}
                                    </span>
                                    <span className={cn(
                                      'text-lg font-bold min-w-[1.5rem] text-right',
                                      isFinished && game.awayTeamScore > game.homeTeamScore ? 'text-emerald-600' : ''
                                    )}>
                                      {game.status === 'scheduled' ? '-' : game.awayTeamScore}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="p-3 text-center text-muted-foreground/50 text-xs">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {timetable.length === 0 && (
                  <tr>
                    <td colSpan={fields.length + 1} className="p-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground font-medium">No games scheduled for this day</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Select a different date to view games</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Query hooks
  const { data: event, isLoading, isError, error } = useEventDetail(slug);
  const { data: games = [] } = useEventGames(event?.id);
  const { data: teams = [] } = useEventTeams(event?.id);
  const { data: spiritScores = [] } = useEventSpirit(event?.id);
  const { data: standings } = useEventStandings(event?.id);
  const { data: eventRounds = [] } = useEventRounds(event?.id);
  const { data: playerStats = [] } = usePlayerLeaderboard(event?.id);
  const { data: crew } = useEventCrew(event?.id);

  // Local state
  const [selectedDivision, setSelectedDivision] = React.useState<string>('all');
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedStage, setSelectedStage] = React.useState<string>('all');
  const [timetableOpen, setTimetableOpen] = React.useState(false);
  // Note: selectedPool state removed - not currently used for filtering
  const [statFilter, setStatFilter] = React.useState<'total' | 'goals' | 'assists'>('total');
  const [expandedSpiritRows, setExpandedSpiritRows] = React.useState<string[]>([]);
  const [selectedBracketRound, setSelectedBracketRound] = React.useState<string | undefined>(undefined);
  const [teamSearchQuery, setTeamSearchQuery] = React.useState<string>('');
  const [selectedTeamDivision, setSelectedTeamDivision] = React.useState<string>('all');

  // Find bracket rounds from event rounds
  const bracketRounds = React.useMemo(() => {
    return eventRounds.filter(r =>
      r.roundType === 'bracket' ||
      r.roundType === 'playoff' ||
      r.name?.toLowerCase().includes('bracket') ||
      r.name?.toLowerCase().includes('playoff')
    );
  }, [eventRounds]);

  // Auto-select first bracket round if available
  React.useEffect(() => {
    if (bracketRounds.length > 0 && !selectedBracketRound) {
      setSelectedBracketRound(bracketRounds[0].id);
    }
  }, [bracketRounds, selectedBracketRound]);

  // Now fetch the bracket with the selected round
  const { data: bracket } = useEventBracket(event?.id, selectedBracketRound);

  // Get unique dates from games
  const gameDates = React.useMemo(() => {
    const dateSet = new Set<string>();
    games.forEach(g => {
      const date = g.scheduledTime?.split('T')[0];
      if (date) dateSet.add(date);
    });
    return Array.from(dateSet).sort();
  }, [games]);

  // Filter games
  const filteredGames = React.useMemo(() => {
    return games.filter(g => {
      // Filter by division if we have division info
      if (selectedDivision !== 'all') {
        // Could filter by division pool if game has that info
      }
      // Filter by date
      if (selectedDate && !g.scheduledTime?.startsWith(selectedDate)) return false;
      // Filter by stage/round type
      if (selectedStage !== 'all') {
        const roundType = g.gameRound?.roundType?.toLowerCase() || '';
        // Handle different stage filters
        if (selectedStage === 'pool' && roundType !== 'pool' && roundType !== 'group') return false;
        if (selectedStage === 'crossover' && roundType !== 'crossover') return false;
        if (selectedStage === 'bracket' && !['bracket', 'quarter', 'semi', 'quarterfinal', 'semifinal'].includes(roundType)) return false;
        if (selectedStage === 'final' && !['final', 'finals', 'third_place', 'third place'].includes(roundType)) return false;
      }
      return true;
    });
  }, [games, selectedDivision, selectedDate, selectedStage]);

  // Filter teams by search and division
  const filteredTeams = React.useMemo(() => {
    return teams.filter(team => {
      // Filter by search query
      if (teamSearchQuery) {
        const query = teamSearchQuery.toLowerCase();
        const matchesName = team.name.toLowerCase().includes(query);
        const matchesCaptain = team.captain?.name?.toLowerCase().includes(query);
        const matchesSpiritCaptain = team.spiritCaptain?.name?.toLowerCase().includes(query);
        if (!matchesName && !matchesCaptain && !matchesSpiritCaptain) return false;
      }
      // Filter by division
      if (selectedTeamDivision !== 'all' && team.divisionPoolId !== selectedTeamDivision) {
        return false;
      }
      return true;
    });
  }, [teams, teamSearchQuery, selectedTeamDivision]);

  // Don't set initial date - let user see all games by default
  React.useEffect(() => {
    // Intentionally empty - we want to show all dates by default
  }, [gameDates]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/discover"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Events
        </Link>
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'The event you are looking for does not exist.'}
          </p>
          <Link href="/discover">
            <Button>Browse Events</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const countryCode = event.location?.country?.code;
  const divisions = event.divisions || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/discover"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Events
          </Link>
        </div>
      </div>

      {/* Event Header */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/5 border-b">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              {/* Title and Status */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <StatusBadge status={event.status} />
                {event.categories?.map(cat => (
                  <EventCategoryBadge key={cat} category={cat} size="sm" />
                ))}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-3">{event.name}</h1>

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {formatDate(event.startDate)}
                    {event.endDate !== event.startDate && ` - ${formatDate(event.endDate)}`}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {event.location.city || event.location.name}
                      {countryCode && ` ${getCountryFlag(countryCode)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setTimetableOpen(true)}
              >
                <Table className="h-4 w-4" />
                View Timetable
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Timezone Notice */}
      {event.location && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900">
          <div className="container mx-auto px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4" />
              <span>All times shown below are in {event.location.city || 'local'} time.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="schedule" className="space-y-6">
          {/* Scrollable Tab List */}
          <div className="flex items-center gap-2 border-b overflow-x-auto pb-px -mb-px">
            <TabsList className="h-auto p-0 bg-transparent gap-0">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4 py-3 gap-2"
              >
                <Info className="h-4 w-4" />
                Info
              </TabsTrigger>
              <TabsTrigger
                value="teams"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4 py-3 gap-2"
              >
                <UsersRound className="h-4 w-4" />
                Teams
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4 py-3 gap-2"
              >
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger
                value="spirit"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4 py-3 gap-2"
              >
                <Heart className="h-4 w-4" />
                Spirit
              </TabsTrigger>
              <TabsTrigger
                value="group"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4 py-3 gap-2"
              >
                <Layers className="h-4 w-4" />
                Group Stage
              </TabsTrigger>
              <TabsTrigger
                value="bracket"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4 py-3 gap-2"
              >
                <Swords className="h-4 w-4" />
                Bracket
              </TabsTrigger>
              <TabsTrigger
                value="stats"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4 py-3 gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Stats
              </TabsTrigger>
              <TabsTrigger
                value="standings"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4 py-3 gap-2"
              >
                <Trophy className="h-4 w-4" />
                Standings
              </TabsTrigger>
              <TabsTrigger
                value="crew"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-4 py-3 gap-2"
              >
                <Shield className="h-4 w-4" />
                Crew
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>About this Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {event.description ? (
                    <p className="text-muted-foreground">{event.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No description available.</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Teams</h4>
                      <p className="text-2xl font-bold text-indigo-600">{event.teamsCount}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Games</h4>
                      <p className="text-2xl font-bold text-purple-600">{event.gamesCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Divisions</CardTitle>
                </CardHeader>
                <CardContent>
                  {divisions.length > 0 ? (
                    <div className="space-y-3">
                      {divisions.map(div => (
                        <div key={div.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <h4 className="font-medium">{div.name}</h4>
                            <p className="text-sm text-muted-foreground">{div.divisionType}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {div.teamsCount} teams
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No divisions configured.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-4">
            {/* Teams Search and Division Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search teams..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                />
              </div>
              {divisions.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedTeamDivision('all')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                      selectedTeamDivision === 'all'
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'bg-transparent text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    All
                  </button>
                  {divisions.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedTeamDivision(d.id)}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                        selectedTeamDivision === d.id
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-transparent text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {filteredTeams.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTeams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/discover/${slug}/teams/${team.id}`}
                    className="block"
                  >
                    <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                              {team.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{team.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                              {team.divisionName && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                                  {team.divisionName}
                                </span>
                              )}
                              {team.initialSeed && (
                                <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                  Seed #{team.initialSeed}
                                </span>
                              )}
                            </div>

                            {/* Player Count */}
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                              <Users className="h-3.5 w-3.5" />
                              <span>{team.playersCount || 0} players</span>
                            </div>

                            {/* Captains Section */}
                            {(team.captain || team.spiritCaptain) && (
                              <div className="mt-3 pt-3 border-t space-y-1.5">
                                {team.captain && (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium">
                                      <Crown className="h-3 w-3" />
                                      Captain
                                    </span>
                                    <span className="text-sm truncate">{team.captain.name}</span>
                                    {team.captain.jerseyNumber && (
                                      <span className="text-xs text-muted-foreground">#{team.captain.jerseyNumber}</span>
                                    )}
                                  </div>
                                )}
                                {team.spiritCaptain && (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs font-medium">
                                      <Heart className="h-3 w-3" />
                                      Spirit
                                    </span>
                                    <span className="text-sm truncate">{team.spiritCaptain.name}</span>
                                    {team.spiritCaptain.jerseyNumber && (
                                      <span className="text-xs text-muted-foreground">#{team.spiritCaptain.jerseyNumber}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Teams Found</h3>
                <p className="text-muted-foreground">
                  {teamSearchQuery ? 'No teams match your search criteria.' : 'Teams will appear here once they are registered.'}
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            {/* Filters Bar - Compact horizontal layout */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 bg-muted/30 rounded-xl border">
              {/* Division filter */}
              {divisions.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Division</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedDivision('all')}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                        selectedDivision === 'all'
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-background hover:bg-muted border'
                      )}
                    >
                      All
                    </button>
                    {divisions.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDivision(d.id)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                          selectedDivision === d.id
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                            : 'bg-background hover:bg-muted border'
                        )}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date filter */}
              {gameDates.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</span>
                  <div className="flex gap-1 overflow-x-auto">
                    <button
                      onClick={() => setSelectedDate(null)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                        selectedDate === null
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-background hover:bg-muted border'
                      )}
                    >
                      All
                    </button>
                    {gameDates.map(date => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                          selectedDate === date
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                            : 'bg-background hover:bg-muted border'
                        )}
                      >
                        {formatDate(date, { day: 'numeric', month: 'short' })}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stage</span>
                <div className="flex gap-1">
                  {['all', 'pool', 'crossover', 'bracket', 'final'].map(stage => (
                    <button
                      key={stage}
                      onClick={() => setSelectedStage(stage)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                        selectedStage === stage
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-background hover:bg-muted border'
                      )}
                    >
                      {stage === 'all' ? 'All' : stage === 'pool' ? 'Group' : stage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timetable Button - Right aligned */}
              <div className="ml-auto">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                  onClick={() => setTimetableOpen(true)}
                >
                  <Table className="h-4 w-4" />
                  Timetable
                </Button>
              </div>
            </div>

            {/* Games grouped by round */}
            {(() => {
              // Group games by round
              const gamesByRound = filteredGames.reduce((acc, game) => {
                const roundName = game.gameRound?.name || 'Other Games';
                const roundType = game.gameRound?.roundType || 'other';
                const key = `${roundName}-${roundType}`;
                if (!acc[key]) {
                  acc[key] = {
                    roundName,
                    roundType,
                    games: []
                  };
                }
                acc[key].games.push(game);
                return acc;
              }, {} as Record<string, { roundName: string; roundType: string; games: Game[] }>);

              // Sort rounds by priority (finals first, then semis, etc.)
              const roundPriority: Record<string, number> = {
                'final': 1,
                'third_place': 2,
                'semi': 3,
                'quarter': 4,
                'bracket': 5,
                'crossover': 6,
                'pool': 7,
                'other': 8
              };

              const sortedRounds = Object.values(gamesByRound).sort((a, b) => {
                const priorityA = roundPriority[a.roundType] || 8;
                const priorityB = roundPriority[b.roundType] || 8;
                return priorityA - priorityB;
              });

              if (sortedRounds.length === 0) {
                return (
                  <Card className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Games Found</h3>
                    <p className="text-muted-foreground">
                      {games.length === 0
                        ? 'Games will appear here once they are scheduled.'
                        : 'No games match your current filters.'}
                    </p>
                  </Card>
                );
              }

              return (
                <div className="space-y-6">
                  {sortedRounds.map(({ roundName, roundType, games: roundGames }) => (
                    <div key={`${roundName}-${roundType}`}>
                      {/* Round Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
                          roundType === 'final' || roundType === 'finals' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
                            roundType === 'semi' || roundType === 'semifinal' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' :
                              roundType === 'bracket' || roundType === 'quarter' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' :
                                roundType === 'crossover' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' :
                                  'bg-muted text-muted-foreground'
                        )}>
                          {roundName}
                        </div>
                        <span className="text-xs text-muted-foreground">{roundGames.length} games</span>
                      </div>

                      {/* Games in 2-column grid */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {roundGames.map((game) => (
                          <Link key={game.id} href={`/live/${game.id}`}>
                            <Card className={cn(
                              'hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full',
                              game.status === 'in_progress' && 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                            )}>
                              <CardContent className="p-4">
                                {/* Game header with status and field */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {game.status === 'in_progress' && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                                        LIVE
                                      </span>
                                    )}
                                    {(game.status === 'finished' || game.status === 'ended') && (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                        ENDED
                                      </span>
                                    )}
                                    {game.name && (
                                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                        {game.name.replace('Game ', '')}
                                      </span>
                                    )}
                                  </div>
                                  {game.fieldLocation && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {game.fieldLocation.name}
                                    </span>
                                  )}
                                </div>

                                {/* Time */}
                                {game.scheduledTime && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(game.scheduledTime, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                    <Clock className="h-3 w-3 ml-1" />
                                    <span>{formatTime(game.scheduledTime)}</span>
                                  </div>
                                )}

                                {/* Teams */}
                                <div className="space-y-2">
                                  {/* Home Team */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {game.homeTeam?.logoUrl ? (
                                        <img src={game.homeTeam.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                      ) : (
                                        <div className={cn(
                                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                          game.status !== 'scheduled' && game.homeTeamScore > game.awayTeamScore
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                            : 'bg-muted text-muted-foreground'
                                        )}>
                                          {game.homeTeam?.name?.charAt(0) || 'H'}
                                        </div>
                                      )}
                                      <span className={cn(
                                        'truncate',
                                        game.status !== 'scheduled' && game.homeTeamScore > game.awayTeamScore ? 'font-semibold' : 'text-muted-foreground'
                                      )}>
                                        {game.homeTeam?.name || 'Home Team'}
                                      </span>
                                    </div>
                                    <span className={cn(
                                      'text-xl font-bold min-w-[2rem] text-right',
                                      game.status !== 'scheduled' && game.homeTeamScore > game.awayTeamScore && 'text-emerald-600'
                                    )}>
                                      {game.status === 'scheduled' ? '-' : game.homeTeamScore}
                                    </span>
                                  </div>

                                  {/* Away Team */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {game.awayTeam?.logoUrl ? (
                                        <img src={game.awayTeam.logoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                      ) : (
                                        <div className={cn(
                                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                          game.status !== 'scheduled' && game.awayTeamScore > game.homeTeamScore
                                            ? 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white'
                                            : 'bg-muted text-muted-foreground'
                                        )}>
                                          {game.awayTeam?.name?.charAt(0) || 'A'}
                                        </div>
                                      )}
                                      <span className={cn(
                                        'truncate',
                                        game.status !== 'scheduled' && game.awayTeamScore > game.homeTeamScore ? 'font-semibold' : 'text-muted-foreground'
                                      )}>
                                        {game.awayTeam?.name || 'Away Team'}
                                      </span>
                                    </div>
                                    <span className={cn(
                                      'text-xl font-bold min-w-[2rem] text-right',
                                      game.status !== 'scheduled' && game.awayTeamScore > game.homeTeamScore && 'text-emerald-600'
                                    )}>
                                      {game.status === 'scheduled' ? '-' : game.awayTeamScore}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          {/* Spirit Tab */}
          <TabsContent value="spirit" className="space-y-4">
            {/* Division Filter for Spirit */}
            {divisions.length > 0 && spiritScores.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-xl border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Division</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedDivision('all')}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                        selectedDivision === 'all'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-background hover:bg-muted border'
                      )}
                    >
                      All
                    </button>
                    {divisions.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDivision(d.id)}
                        className={cn(
                          'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                          selectedDivision === d.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-background hover:bg-muted border'
                        )}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {spiritScores.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-4 font-medium w-12">#</th>
                          <th className="text-left p-4 font-medium">Team</th>
                          <th className="text-center p-4 font-medium">Games Played</th>
                          <th className="text-center p-4 font-medium">Games Rated</th>
                          <th className="text-center p-4 font-medium">Rated %</th>
                          <th className="text-center p-4 font-medium">Avg Score</th>
                          <th className="text-center p-4 font-medium w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {spiritScores.map((score, idx) => {
                          const isExpanded = expandedSpiritRows.includes(score.teamId);
                          const ratedPercent = score.gamesPlayed > 0
                            ? Math.round((score.gamesRated || score.gamesPlayed) / score.gamesPlayed * 100)
                            : 0;

                          return (
                            <React.Fragment key={score.teamId}>
                              <tr
                                className={cn(
                                  'border-b hover:bg-muted/30 cursor-pointer transition-colors',
                                  isExpanded && 'bg-muted/20'
                                )}
                                onClick={() => {
                                  setExpandedSpiritRows(prev =>
                                    prev.includes(score.teamId)
                                      ? prev.filter(id => id !== score.teamId)
                                      : [...prev, score.teamId]
                                  );
                                }}
                              >
                                <td className="p-4 font-medium">{idx + 1}</td>
                                <td className="p-4 font-medium">{score.teamName}</td>
                                <td className="p-4 text-center text-muted-foreground">{score.gamesPlayed}</td>
                                <td className="p-4 text-center text-muted-foreground">{score.gamesRated || score.gamesPlayed}</td>
                                <td className="p-4 text-center">
                                  <span className={cn(
                                    'px-2 py-0.5 rounded text-xs font-medium',
                                    ratedPercent >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                      ratedPercent >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  )}>
                                    {ratedPercent}%
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <span className={cn(
                                    'px-2 py-1 rounded font-medium',
                                    score.averageScore >= 9 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                      score.averageScore >= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  )}>
                                    {score.averageScore.toFixed(1)}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-muted/10">
                                  <td colSpan={7} className="p-4">
                                    <div className="text-sm text-muted-foreground mb-2 font-medium">
                                      Per-Game Spirit Breakdown
                                    </div>
                                    {score.gameScores && score.gameScores.length > 0 ? (
                                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {score.gameScores.map((gs, gIdx) => (
                                          <div
                                            key={gIdx}
                                            className="flex items-center justify-between p-2 rounded bg-background border"
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-muted-foreground">vs</span>
                                              <span className="text-sm font-medium truncate max-w-[120px]">
                                                {gs.opponentName || 'Opponent'}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={cn(
                                                'px-2 py-0.5 rounded text-sm font-bold',
                                                gs.score >= 9 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                  gs.score >= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                              )}>
                                                {gs.score.toFixed(1)}
                                              </span>
                                              <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-medium rounded">
                                                RATED
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground italic">
                                        No per-game breakdown available
                                      </p>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Spirit Scores Yet</h3>
                <p className="text-muted-foreground">Spirit scores will appear here once games are completed.</p>
              </Card>
            )}
          </TabsContent>

          {/* Group Tab - Pool Standings */}
          <TabsContent value="group" className="space-y-4">
            {/* Pool / Crossover sub-navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedStage('pool')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  selectedStage === 'pool' || selectedStage === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-background hover:bg-muted border'
                )}
              >
                <Layers className="h-4 w-4 inline mr-1.5" />
                Pool
              </button>
              <button
                onClick={() => setSelectedStage('crossover')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  selectedStage === 'crossover'
                    ? 'bg-orange-600 text-white'
                    : 'bg-background hover:bg-muted border'
                )}
              >
                <Target className="h-4 w-4 inline mr-1.5" />
                Crossover
              </button>
            </div>

            {/* Pool Standings */}
            {(selectedStage === 'pool' || selectedStage === 'all') && (
              <>
                {standings && standings.standings && standings.standings.length > 0 ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{standings.divisionName} Standings</CardTitle>
                        <span className="text-xs text-muted-foreground">
                          Updated: {new Date(standings.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-center p-3 font-medium w-12">#</th>
                              <th className="text-left p-3 font-medium">Team</th>
                              <th className="text-center p-3 font-medium w-10">G</th>
                              <th className="text-center p-3 font-medium w-10">W</th>
                              <th className="text-center p-3 font-medium w-10">L</th>
                              <th className="text-center p-3 font-medium w-12">Pts</th>
                              <th className="text-center p-3 font-medium w-12">GD</th>
                              <th className="text-center p-3 font-medium w-12">F</th>
                              <th className="text-center p-3 font-medium w-12">A</th>
                            </tr>
                          </thead>
                          <tbody>
                            {standings.standings.map((team, idx) => (
                              <tr key={team.teamId} className="border-b last:border-0 hover:bg-muted/30">
                                <td className="p-3 text-center">
                                  <span className={cn(
                                    'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold',
                                    idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
                                      idx === 1 ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                                        idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' :
                                          'bg-muted text-muted-foreground'
                                  )}>
                                    {team.rank}
                                  </span>
                                </td>
                                <td className="p-3 font-medium">{team.teamName}</td>
                                <td className="p-3 text-center text-muted-foreground">{team.gamesPlayed}</td>
                                <td className="p-3 text-center font-medium text-emerald-600">{team.wins}</td>
                                <td className="p-3 text-center text-muted-foreground">{team.losses}</td>
                                <td className="p-3 text-center font-bold">{team.wins * 3}</td>
                                <td className={cn(
                                  'p-3 text-center font-medium',
                                  team.pointDifferential > 0 ? 'text-emerald-600' : team.pointDifferential < 0 ? 'text-red-500' : ''
                                )}>
                                  {team.pointDifferential > 0 ? '+' : ''}{team.pointDifferential}
                                </td>
                                <td className="p-3 text-center text-muted-foreground">{team.pointsFor}</td>
                                <td className="p-3 text-center text-muted-foreground">{team.pointsAgainst}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="p-4 text-xs text-muted-foreground border-t space-y-1">
                        <p><strong>G</strong> - Games Played, <strong>W</strong> - Wins, <strong>L</strong> - Losses, <strong>Pts</strong> - Points</p>
                        <p><strong>GD</strong> - Goal Difference, <strong>F</strong> - Goals For, <strong>A</strong> - Goals Against</p>
                        <p className="mt-2 text-indigo-600 dark:text-indigo-400">* 1 win = 3 points, 1 loss = 0 points</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-8 text-center">
                    <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Pool Standings Yet</h3>
                    <p className="text-muted-foreground">Standings will appear once pool play games are completed.</p>
                  </Card>
                )}
              </>
            )}

            {/* Crossover Games */}
            {selectedStage === 'crossover' && (
              <>
                {(() => {
                  const crossoverGames = games.filter(g =>
                    g.gameRound?.roundType?.toLowerCase() === 'crossover' ||
                    g.gameRound?.name?.toLowerCase().includes('crossover') ||
                    g.gameRound?.name?.toLowerCase().includes('cross over')
                  );

                  // Note: Division filtering for crossover games would require game.divisionPoolId
                  const filteredCrossoverGames = crossoverGames;

                  return (
                    <>
                      {/* Division filter */}
                      {divisions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-xl border">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Division</span>
                            <div className="flex gap-1 flex-wrap">
                              <button
                                onClick={() => setSelectedDivision('all')}
                                className={cn(
                                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                  selectedDivision === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-background hover:bg-muted border'
                                )}
                              >
                                All
                              </button>
                              {divisions.map(d => (
                                <button
                                  key={d.id}
                                  onClick={() => setSelectedDivision(d.id)}
                                  className={cn(
                                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                    selectedDivision === d.id
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-background hover:bg-muted border'
                                  )}
                                >
                                  {d.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {filteredCrossoverGames.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {filteredCrossoverGames.map(game => (
                            <Link key={game.id} href={`/live/${game.id}`}>
                              <Card className={cn(
                                'hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full',
                                game.status === 'in_progress' && 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                              )}>
                                <CardContent className="p-4">
                                  {/* Game header */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400">
                                        CROSSOVER
                                      </span>
                                      {game.status === 'in_progress' && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                                          LIVE
                                        </span>
                                      )}
                                      {game.name && (
                                        <span className="text-xs text-muted-foreground">{game.name}</span>
                                      )}
                                    </div>
                                    {game.fieldLocation && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {game.fieldLocation.name}
                                      </span>
                                    )}
                                  </div>

                                  {/* Time */}
                                  {game.scheduledTime && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                      <Calendar className="h-3 w-3" />
                                      <span>{formatDate(game.scheduledTime, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                      <Clock className="h-3 w-3 ml-1" />
                                      <span>{formatTime(game.scheduledTime)}</span>
                                    </div>
                                  )}

                                  {/* Teams */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className={cn(
                                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                          game.status !== 'scheduled' && game.homeTeamScore > game.awayTeamScore
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                            : 'bg-muted text-muted-foreground'
                                        )}>
                                          {game.homeTeam?.name?.charAt(0) || 'H'}
                                        </div>
                                        <span className={cn(
                                          'truncate',
                                          game.status !== 'scheduled' && game.homeTeamScore > game.awayTeamScore ? 'font-semibold' : 'text-muted-foreground'
                                        )}>
                                          {game.homeTeam?.name || 'Home Team'}
                                        </span>
                                      </div>
                                      <span className={cn(
                                        'text-xl font-bold min-w-[2rem] text-right',
                                        game.status !== 'scheduled' && game.homeTeamScore > game.awayTeamScore && 'text-emerald-600'
                                      )}>
                                        {game.status === 'scheduled' ? '-' : game.homeTeamScore}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className={cn(
                                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                          game.status !== 'scheduled' && game.awayTeamScore > game.homeTeamScore
                                            ? 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white'
                                            : 'bg-muted text-muted-foreground'
                                        )}>
                                          {game.awayTeam?.name?.charAt(0) || 'A'}
                                        </div>
                                        <span className={cn(
                                          'truncate',
                                          game.status !== 'scheduled' && game.awayTeamScore > game.homeTeamScore ? 'font-semibold' : 'text-muted-foreground'
                                        )}>
                                          {game.awayTeam?.name || 'Away Team'}
                                        </span>
                                      </div>
                                      <span className={cn(
                                        'text-xl font-bold min-w-[2rem] text-right',
                                        game.status !== 'scheduled' && game.awayTeamScore > game.homeTeamScore && 'text-emerald-600'
                                      )}>
                                        {game.status === 'scheduled' ? '-' : game.awayTeamScore}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Card className="p-8 text-center">
                          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="font-semibold mb-2">No Crossover Games Yet</h3>
                          <p className="text-muted-foreground">Crossover games will appear once pool play is complete.</p>
                        </Card>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </TabsContent>

          {/* Bracket Tab */}
          <TabsContent value="bracket" className="space-y-4">
            {(() => {
              // Filter games by bracket/playoff round types
              const bracketGames = games.filter(g => {
                const roundType = g.gameRound?.roundType?.toLowerCase() || '';
                const roundName = g.gameRound?.name?.toLowerCase() || '';
                return (
                  roundType === 'bracket' ||
                  roundType === 'playoff' ||
                  roundType === 'quarter' ||
                  roundType === 'quarterfinal' ||
                  roundType === 'semi' ||
                  roundType === 'semifinal' ||
                  roundType === 'final' ||
                  roundType === 'finals' ||
                  roundType === 'third_place' ||
                  roundName.includes('quarter') ||
                  roundName.includes('semi') ||
                  roundName.includes('final') ||
                  roundName.includes('bracket') ||
                  roundName.includes('playoff')
                );
              });

              // Note: Division filtering for bracket games would require game.divisionPoolId
              const divisionBracketGames = bracketGames;

              return (
                <>
                  {/* Division filter for bracket */}
                  {divisions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-xl border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Division</span>
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => setSelectedDivision('all')}
                            className={cn(
                              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                              selectedDivision === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-background hover:bg-muted border'
                            )}
                          >
                            All
                          </button>
                          {divisions.map(d => (
                            <button
                              key={d.id}
                              onClick={() => setSelectedDivision(d.id)}
                              className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                selectedDivision === d.id
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-background hover:bg-muted border'
                              )}
                            >
                              {d.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bracket round selector */}
                      {bracketRounds.length > 1 && (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-sm font-medium">Pool</span>
                          <div className="flex gap-1 flex-wrap">
                            {bracketRounds.map(r => (
                              <button
                                key={r.id}
                                onClick={() => setSelectedBracketRound(r.id)}
                                className={cn(
                                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                  selectedBracketRound === r.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-background hover:bg-muted border'
                                )}
                              >
                                {r.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Use GamesBracket if we have bracket games */}
                  {divisionBracketGames.length > 0 ? (
                    <GamesBracket games={divisionBracketGames} />
                  ) : bracket && bracket.bracketTree ? (
                    <>
                      <div className="hidden md:block overflow-x-auto pb-4">
                        <TournamentBracket bracket={bracket} />
                      </div>
                      <div className="block md:hidden pb-4 px-2">
                        <SimpleBracket bracket={bracket} />
                      </div>
                    </>
                  ) : (
                    <Card className="p-8 text-center">
                      <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">No Bracket Games Yet</h3>
                      <p className="text-muted-foreground">
                        Bracket games will appear once pool play is complete and bracket rounds are scheduled.
                      </p>
                    </Card>
                  )}
                </>
              );
            })()}
          </TabsContent>

          {/* Stats Tab - Player Leaderboard */}
          <TabsContent value="stats" className="space-y-4">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {(['total', 'goals', 'assists'] as const).map(filter => (
                <Button
                  key={filter}
                  variant={statFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatFilter(filter)}
                  className={cn(statFilter === filter && 'bg-indigo-600 hover:bg-indigo-700')}
                >
                  {filter === 'total' ? 'Total All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>

            {playerStats.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-center p-4 font-medium w-16">Rank</th>
                          <th className="text-left p-4 font-medium">Name</th>
                          <th className="text-left p-4 font-medium">Team</th>
                          <th className="text-center p-4 font-medium">Goals</th>
                          <th className="text-center p-4 font-medium">Asst.</th>
                          <th className="text-center p-4 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerStats
                          .sort((a, b) => {
                            if (statFilter === 'goals') return b.goals - a.goals;
                            if (statFilter === 'assists') return b.assists - a.assists;
                            return (b.goals + b.assists) - (a.goals + a.assists);
                          })
                          .slice(0, 20)
                          .map((player, idx) => (
                            <tr key={player.playerId} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="p-4 text-center">
                                <span className={cn(
                                  'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                                  idx === 0 ? 'bg-amber-400 text-white' :
                                    idx === 1 ? 'bg-gray-400 text-white' :
                                      idx === 2 ? 'bg-orange-400 text-white' :
                                        'bg-muted text-muted-foreground'
                                )}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="p-4 font-medium">{player.playerName}</td>
                              <td className="p-4 text-sm text-muted-foreground">{player.teamName}</td>
                              <td className="p-4 text-center font-mono">{player.goals}</td>
                              <td className="p-4 text-center font-mono">{player.assists}</td>
                              <td className="p-4 text-center font-mono font-bold">{player.goals + player.assists}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Player Statistics Yet</h3>
                <p className="text-muted-foreground">Player stats will appear once games are completed.</p>
              </Card>
            )}
          </TabsContent>

          {/* Standings Tab - Final Standings */}
          <TabsContent value="standings" className="space-y-4">
            {standings && standings.standings && standings.standings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Final Standings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-center p-4 font-medium w-20">Rank</th>
                          <th className="text-left p-4 font-medium">Team</th>
                          <th className="text-center p-4 font-medium">Record</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.standings.slice(0, 8).map((team, idx) => (
                          <tr key={team.teamId} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-4 text-center">
                              {idx < 3 ? (
                                <span className={cn(
                                  'inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold',
                                  idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg' :
                                    idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                                      'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md'
                                )}>
                                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold">
                                  {team.rank}
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="font-semibold">{team.teamName}</span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-sm text-muted-foreground">
                                {team.wins}W - {team.losses}L
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Final Standings Yet</h3>
                <p className="text-muted-foreground">Final standings will appear once all games are completed.</p>
              </Card>
            )}
          </TabsContent>

          {/* Crew Tab - Tournament Staff */}
          <TabsContent value="crew" className="space-y-6">
            {crew && (crew.admins.length > 0 || crew.scorekeepers.length > 0) ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Tournament Admins */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-indigo-500" />
                      Tournament Admins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {crew.admins.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {crew.admins.map((admin) => (
                          <div
                            key={admin.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            {admin.avatarUrl ? (
                              <img
                                src={admin.avatarUrl}
                                alt={admin.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                                {admin.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{admin.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {admin.role.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No admins assigned yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Scorekeepers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UsersRound className="h-5 w-5 text-emerald-500" />
                      Scorekeepers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {crew.scorekeepers.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {crew.scorekeepers.map((scorekeeper) => (
                          <div
                            key={scorekeeper.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            {scorekeeper.avatarUrl ? (
                              <img
                                src={scorekeeper.avatarUrl}
                                alt={scorekeeper.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-100 dark:border-emerald-900"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold">
                                {scorekeeper.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{scorekeeper.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {scorekeeper.role.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No scorekeepers assigned yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Crew Information Yet</h3>
                <p className="text-muted-foreground">
                  Tournament staff information will appear once the event is configured.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Timetable Modal */}
      <TimetableModal
        open={timetableOpen}
        onOpenChange={setTimetableOpen}
        event={event}
        games={games}
      />
    </div>
  );
}
