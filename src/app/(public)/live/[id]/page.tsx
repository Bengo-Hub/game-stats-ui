'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { publicApi, type GameStreamEvent } from '@/lib/api/public';
import { cn } from '@/lib/utils';
import type { Game, GameEvent, Scoring, SpiritScore } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Disc,
  Heart,
  Info,
  MapPin,
  RefreshCw,
  RotateCcw,
  Share2,
  Shield,
  Target,
  Trophy,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

// ============================================
// Split View Stats Component
// ============================================

interface SplitViewStatsProps {
  scores: Scoring[];
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
}

function SplitViewStats({ scores, homeTeamId, awayTeamId, homeTeamName, awayTeamName }: SplitViewStatsProps) {
  const [expandedSide, setExpandedSide] = React.useState<'home' | 'away' | null>(null);

  const homeScores = scores.filter(s => s.teamId === homeTeamId);
  const awayScores = scores.filter(s => s.teamId === awayTeamId);

  const sortByGoals = (a: Scoring, b: Scoring) => b.goals - a.goals || b.assists - a.assists;

  const renderTeamStats = (teamScores: Scoring[], teamName: string, side: 'home' | 'away') => {
    const sorted = [...teamScores].sort(sortByGoals);
    const isExpanded = expandedSide === side;
    const displayScores = isExpanded ? sorted : sorted.slice(0, 5);

    const totalGoals = teamScores.reduce((sum, s) => sum + s.goals, 0);
    const totalAssists = teamScores.reduce((sum, s) => sum + s.assists, 0);

    return (
      <div className={`flex-1 ${side === 'away' ? 'border-l' : ''}`}>
        <div className={`p-3 border-b ${side === 'home' ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{teamName}</h4>
            <span className="text-xs text-muted-foreground">
              {totalGoals}G / {totalAssists}A
            </span>
          </div>
        </div>

        <div className="divide-y">
          {/* Header */}
          <div className="grid grid-cols-12 gap-1 px-2 py-1.5 text-[10px] font-medium text-muted-foreground bg-muted/50">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-2 text-center">G</div>
            <div className="col-span-2 text-center">A</div>
            <div className="col-span-2 text-center">B</div>
          </div>

          {/* Player rows */}
          {displayScores.map((score) => (
            <div key={score.id} className="grid grid-cols-12 gap-1 px-2 py-1.5 text-xs hover:bg-muted/30">
              <div className="col-span-1 text-muted-foreground">
                {score.playerNumber || '-'}
              </div>
              <div className="col-span-5 truncate font-medium">
                {score.playerName || 'Unknown'}
              </div>
              <div className="col-span-2 text-center font-semibold text-blue-600 dark:text-blue-400">
                {score.goals}
              </div>
              <div className="col-span-2 text-center text-green-600 dark:text-green-400">
                {score.assists}
              </div>
              <div className="col-span-2 text-center text-purple-600 dark:text-purple-400">
                {score.blocks}
              </div>
            </div>
          ))}

          {teamScores.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No stats recorded
            </div>
          )}

          {teamScores.length > 5 && (
            <button
              onClick={() => setExpandedSide(isExpanded ? null : side)}
              className="w-full px-3 py-2 text-xs text-primary hover:bg-muted/50 flex items-center justify-center gap-1"
            >
              {isExpanded ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Show all ({teamScores.length}) <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // If no team data available yet, show all scores in a single view
  if (homeScores.length === 0 && awayScores.length === 0 && scores.length > 0) {
    const sorted = [...scores].sort(sortByGoals);
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="p-3 border-b bg-muted/30">
          <h4 className="font-semibold text-sm">All Player Stats</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Team breakdown will appear once backend is updated
          </p>
        </div>
        <div className="divide-y">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-medium text-muted-foreground bg-muted/50">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-2 text-center">Goals</div>
            <div className="col-span-2 text-center">Assists</div>
            <div className="col-span-2 text-center">Blocks</div>
          </div>
          {sorted.map((score) => (
            <div key={score.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-sm hover:bg-muted/30">
              <div className="col-span-1 text-muted-foreground text-xs">
                {score.playerNumber || '-'}
              </div>
              <div className="col-span-5 truncate font-medium text-xs">
                {score.playerName || 'Unknown'}
              </div>
              <div className="col-span-2 text-center font-semibold text-blue-600 dark:text-blue-400">
                {score.goals}
              </div>
              <div className="col-span-2 text-center text-green-600 dark:text-green-400">
                {score.assists}
              </div>
              <div className="col-span-2 text-center text-purple-600 dark:text-purple-400">
                {score.blocks}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {renderTeamStats(homeScores, homeTeamName, 'home')}
        {renderTeamStats(awayScores, awayTeamName, 'away')}
      </div>

      {/* Legend */}
      <div className="border-t px-4 py-2 bg-muted/30 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">G = Goals</span>
        <span className="flex items-center gap-1">A = Assists</span>
        <span className="flex items-center gap-1">B = Blocks</span>
      </div>
    </div>
  );
}

// ============================================
// Spirit Score Display Component
// ============================================

interface SpiritDisplayProps {
  spiritScores: SpiritScore[];
  homeTeamId?: string;
  awayTeamId?: string;
}

function SpiritDisplay({ spiritScores, homeTeamId, awayTeamId }: SpiritDisplayProps) {
  if (!spiritScores || spiritScores.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No spirit scores submitted yet</p>
      </div>
    );
  }

  const categories = [
    { key: 'rulesKnowledge', label: 'Rules', max: 4 },
    { key: 'foulsBodyContact', label: 'Fouls', max: 4 },
    { key: 'fairMindedness', label: 'Fair', max: 4 },
    { key: 'attitude', label: 'Attitude', max: 4 },
    { key: 'communication', label: 'Comm', max: 4 },
  ] as const;

  return (
    <div className="space-y-4">
      {spiritScores.map((score) => (
        <div key={score.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">
                {score.scoredByTeam?.name || 'Unknown'} rated {score.team?.name || 'Unknown'}
              </p>
            </div>
            <div className="text-2xl font-bold text-primary">
              {score.totalScore}/20
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {categories.map(cat => (
              <div key={cat.key} className="text-center">
                <div className="text-[10px] text-muted-foreground mb-1">{cat.label}</div>
                <div className="flex justify-center gap-0.5">
                  {Array.from({ length: cat.max }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < (score[cat.key] as number) ? 'bg-primary' : 'bg-muted'
                        }`}
                    />
                  ))}
                </div>
                <div className="text-xs font-medium mt-1">{score[cat.key]}</div>
              </div>
            ))}
          </div>

          {score.comments && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground italic">&ldquo;{score.comments}&rdquo;</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function LiveGameDetailPage() {
  const params = useParams();
  const gameId = params.id as string;
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [isConnected, setIsConnected] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>('summary');

  // Fetch game details
  const {
    data: game,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => publicApi.getGame(gameId),
    enabled: !!gameId,
    staleTime: 1000 * 10,
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch game timeline
  const { data: timeline } = useQuery({
    queryKey: ['game', gameId, 'timeline'],
    queryFn: () => publicApi.getGameTimeline(gameId),
    enabled: !!gameId,
    staleTime: 1000 * 5,
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch game scores/stats
  const { data: scores = [] } = useQuery({
    queryKey: ['game', gameId, 'scores'],
    queryFn: () => publicApi.getGameScores(gameId),
    enabled: !!gameId,
    staleTime: 1000 * 10,
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Fetch spirit scores
  const { data: spiritScores = [] } = useQuery({
    queryKey: ['game', gameId, 'spirit'],
    queryFn: () => publicApi.getGameSpiritScores(gameId),
    enabled: !!gameId,
    staleTime: 1000 * 30,
  });

  // Subscribe to SSE stream for real-time updates
  React.useEffect(() => {
    if (!gameId || !autoRefresh) return;

    const cleanup = publicApi.createGameStream(
      gameId,
      (event: GameStreamEvent) => {
        setIsConnected(true);
        if (event.type === 'score_updated' || event.type === 'game_started' || event.type === 'game_finished') {
          queryClient.invalidateQueries({ queryKey: ['game', gameId] });
          queryClient.invalidateQueries({ queryKey: ['game', gameId, 'timeline'] });
          queryClient.invalidateQueries({ queryKey: ['game', gameId, 'scores'] });
        }
      },
      () => {
        setIsConnected(false);
      }
    );

    return cleanup;
  }, [gameId, autoRefresh, queryClient]);

  // Generate team color from name
  const getTeamColor = (name: string, fallback: string) => {
    if (fallback) return fallback;
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Calculate stats from scores data
  const gameStats = React.useMemo(() => {
    if (!scores || scores.length === 0 || !game) {
      return {
        home: { goals: game?.homeTeamScore ?? 0, assists: 0, blocks: 0, turns: 0 },
        away: { goals: game?.awayTeamScore ?? 0, assists: 0, blocks: 0, turns: 0 },
        total: {
          goals: scores.reduce((sum, s) => sum + s.goals, 0),
          assists: scores.reduce((sum, s) => sum + s.assists, 0),
          blocks: scores.reduce((sum, s) => sum + s.blocks, 0),
          turns: scores.reduce((sum, s) => sum + s.turns, 0),
        },
      };
    }

    const home = { goals: 0, assists: 0, blocks: 0, turns: 0 };
    const away = { goals: 0, assists: 0, blocks: 0, turns: 0 };

    scores.forEach((stat: Scoring) => {
      if (stat.teamId === game.homeTeam?.id) {
        home.goals += stat.goals;
        home.assists += stat.assists;
        home.blocks += stat.blocks;
        home.turns += stat.turns;
      } else if (stat.teamId === game.awayTeam?.id) {
        away.goals += stat.goals;
        away.assists += stat.assists;
        away.blocks += stat.blocks;
        away.turns += stat.turns;
      }
    });

    return {
      home,
      away,
      total: {
        goals: scores.reduce((sum, s) => sum + s.goals, 0),
        assists: scores.reduce((sum, s) => sum + s.assists, 0),
        blocks: scores.reduce((sum, s) => sum + s.blocks, 0),
        turns: scores.reduce((sum, s) => sum + s.turns, 0),
      },
    };
  }, [scores, game]);

  // Format elapsed time
  const getElapsedTime = (game: Game) => {
    if (game.actualStartTime && game.status === 'in_progress') {
      const start = new Date(game.actualStartTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return '--:--';
  };

  const handleShare = async () => {
    if (typeof window === 'undefined' || !game) return;

    const shareData = {
      title: `${game.homeTeam?.name || 'Home'} vs ${game.awayTeam?.name || 'Away'} - Live Scores`,
      text: `Check out the live scores for ${game.homeTeam?.name || 'Home'} vs ${game.awayTeam?.name || 'Away'} on BengoBox!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error sharing:', err);
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 mb-8" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/live"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Live Scores
        </Link>
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Game Not Found</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'The game you are looking for could not be found.'}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  const isLive = game.status === 'in_progress';
  const isFinished = game.status === 'finished' || game.status === 'ended';
  const homeTeamColor = getTeamColor(game.homeTeam?.name || 'Home', game.homeTeam?.primaryColor || '');
  const awayTeamColor = getTeamColor(game.awayTeam?.name || 'Away', game.awayTeam?.primaryColor || '');

  const tabs = [
    { id: 'summary', label: 'Summary', icon: Activity },
    { id: 'stats', label: 'Stats', icon: Users },
    { id: 'spirit', label: 'Spirit', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {/* Back Link */}
          <Link
            href="/live"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>

          {/* Status and controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {isLive ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    LIVE
                  </span>
                  {isConnected && (
                    <span className="text-xs text-green-500">Connected</span>
                  )}
                </>
              ) : isFinished ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Final
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Scheduled
                </span>
              )}
              {game.gameRound && (
                <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                  {game.gameRound.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-8 px-2"
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Teams and Score */}
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {/* Home Team */}
            <div className="flex-1 text-center md:text-right">
              <Link href={`/teams/${game.homeTeam?.id}`} className="group">
                <div className="flex flex-col md:flex-row items-center md:justify-end gap-2 md:gap-3">
                  <div>
                    <h2 className="text-sm md:text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                      {game.homeTeam?.name || 'Home Team'}
                    </h2>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                      Home
                    </span>
                  </div>
                  {game.homeTeam?.logoUrl ? (
                    <img
                      src={game.homeTeam.logoUrl}
                      alt={game.homeTeam.name}
                      className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white text-lg md:text-xl font-bold"
                      style={{ backgroundColor: homeTeamColor }}
                    >
                      {game.homeTeam?.name?.charAt(0) || 'H'}
                    </div>
                  )}
                </div>
              </Link>
            </div>

            {/* Score */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 md:gap-4 px-3 py-2 bg-card rounded-lg shadow-sm border">
                <span className="text-2xl md:text-4xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {gameStats.home.goals}
                </span>
                <span className="text-xl md:text-3xl font-light text-muted-foreground">-</span>
                <span className="text-2xl md:text-4xl font-bold tabular-nums text-red-600 dark:text-red-400">
                  {gameStats.away.goals}
                </span>
              </div>
              {isLive && (
                <div className="text-center mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {getElapsedTime(game)}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center md:text-left">
              <Link href={`/teams/${game.awayTeam?.id}`} className="group">
                <div className="flex flex-col md:flex-row items-center md:justify-start gap-2 md:gap-3">
                  {game.awayTeam?.logoUrl ? (
                    <img
                      src={game.awayTeam.logoUrl}
                      alt={game.awayTeam.name}
                      className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-red-500"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white text-lg md:text-xl font-bold"
                      style={{ backgroundColor: awayTeamColor }}
                    >
                      {game.awayTeam?.name?.charAt(0) || 'A'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-sm md:text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
                      {game.awayTeam?.name || 'Away Team'}
                    </h2>
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">
                      Away
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Game Info */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs text-muted-foreground">
            {game.scheduledTime && (
              <>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(game.scheduledTime), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(parseISO(game.scheduledTime), 'h:mm a')}
                </span>
              </>
            )}
            {game.fieldLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {game.fieldLocation.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl">
          <nav className="flex gap-1 px-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Stats Comparison */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Game Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Goals', home: gameStats.home.goals || game.homeTeamScore, away: gameStats.away.goals || game.awayTeamScore, icon: Disc },
                      { label: 'Assists', home: gameStats.home.assists, away: gameStats.away.assists, icon: Target },
                      { label: 'Blocks', home: gameStats.home.blocks, away: gameStats.away.blocks, icon: Shield },
                      { label: 'Turnovers', home: gameStats.home.turns, away: gameStats.away.turns, icon: RotateCcw },
                    ].map((stat) => {
                      const total = stat.home + stat.away;
                      const homePercent = total > 0 ? (stat.home / total) * 100 : 50;
                      const isHomeBetter = stat.home > stat.away;
                      const isAwayBetter = stat.away > stat.home;

                      return (
                        <div key={stat.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className={cn(
                              'font-mono',
                              isHomeBetter && 'font-bold text-blue-600 dark:text-blue-400'
                            )}>
                              {stat.home}
                            </span>
                            <span className="text-muted-foreground text-xs flex items-center gap-1">
                              <stat.icon className="w-3 h-3" />
                              {stat.label}
                            </span>
                            <span className={cn(
                              'font-mono',
                              isAwayBetter && 'font-bold text-red-600 dark:text-red-400'
                            )}>
                              {stat.away}
                            </span>
                          </div>
                          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                            <div
                              className="transition-all duration-500 rounded-l-full"
                              style={{
                                width: `${homePercent}%`,
                                backgroundColor: homeTeamColor,
                              }}
                            />
                            <div
                              className="transition-all duration-500 rounded-r-full"
                              style={{
                                width: `${100 - homePercent}%`,
                                backgroundColor: awayTeamColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              {scores.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        Top Performers
                      </CardTitle>
                      <button
                        onClick={() => setActiveTab('stats')}
                        className="text-xs text-primary hover:underline"
                      >
                        View all
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Top Scorer */}
                      {scores.sort((a, b) => b.goals - a.goals)[0]?.goals > 0 && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
                          <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mb-1 font-medium uppercase tracking-wide">Top Scorer</div>
                          <div className="font-semibold text-sm truncate mb-1">
                            {scores.sort((a, b) => b.goals - a.goals)[0].playerName}
                          </div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {scores.sort((a, b) => b.goals - a.goals)[0].goals}
                            <span className="text-sm font-medium ml-1">goals</span>
                          </div>
                        </div>
                      )}
                      {/* Top Assists */}
                      {scores.sort((a, b) => b.assists - a.assists)[0]?.assists > 0 && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 rounded-lg p-4 border border-green-200/50 dark:border-green-800/50">
                          <div className="text-[10px] text-green-600/70 dark:text-green-400/70 mb-1 font-medium uppercase tracking-wide">Top Assists</div>
                          <div className="font-semibold text-sm truncate mb-1">
                            {scores.sort((a, b) => b.assists - a.assists)[0].playerName}
                          </div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {scores.sort((a, b) => b.assists - a.assists)[0].assists}
                            <span className="text-sm font-medium ml-1">assists</span>
                          </div>
                        </div>
                      )}
                      {/* Top Blocks */}
                      {scores.sort((a, b) => b.blocks - a.blocks)[0]?.blocks > 0 && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200/50 dark:border-purple-800/50">
                          <div className="text-[10px] text-purple-600/70 dark:text-purple-400/70 mb-1 font-medium uppercase tracking-wide">Top Defender</div>
                          <div className="font-semibold text-sm truncate mb-1">
                            {scores.sort((a, b) => b.blocks - a.blocks)[0].playerName}
                          </div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {scores.sort((a, b) => b.blocks - a.blocks)[0].blocks}
                            <span className="text-sm font-medium ml-1">blocks</span>
                          </div>
                        </div>
                      )}
                      {/* MVP (highest combined) */}
                      {scores.length > 0 && (
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 rounded-lg p-4 border border-amber-200/50 dark:border-amber-800/50">
                          <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mb-1 font-medium uppercase tracking-wide">MVP Candidate</div>
                          <div className="font-semibold text-sm truncate mb-1">
                            {scores.sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))[0].playerName}
                          </div>
                          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {scores.sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))[0].goals + scores.sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))[0].assists}
                            <span className="text-sm font-medium ml-1">total</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Play-by-Play */}
            <Card className="h-fit lg:sticky lg:top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Play-by-Play
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline?.events && timeline.events.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {timeline.events.map((event: GameEvent) => {
                      const isGoal = event.eventType === 'goal' || event.eventType === 'goal_scored' || event.eventType === 'score';
                      const isAssist = event.eventType === 'assist' || event.eventType === 'assist_recorded';
                      const isTimeout = event.eventType === 'timeout' || event.eventType === 'stoppage';

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg text-sm transition-colors',
                            isGoal
                              ? 'bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50'
                              : isAssist
                                ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50'
                                : isTimeout
                                  ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/50'
                                  : 'bg-muted/50'
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            isGoal ? 'bg-green-500 text-white' :
                              isAssist ? 'bg-blue-500 text-white' :
                                isTimeout ? 'bg-amber-500 text-white' :
                                  'bg-muted text-muted-foreground'
                          )}>
                            {isGoal ? <Disc className="h-4 w-4" /> :
                              isAssist ? <Target className="h-4 w-4" /> :
                                isTimeout ? <Clock className="h-4 w-4" /> :
                                  <Activity className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {event.description || event.eventType.replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {event.minute}:{String(event.second).padStart(2, '0')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No events recorded yet</p>
                    {isLive && <p className="text-xs mt-1">Events will appear as the game progresses</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Game Totals - Top Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50">
                <Disc className="w-5 h-5 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {gameStats.total.goals}
                </div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Total Goals</div>
              </Card>
              <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
                <Target className="w-5 h-5 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {gameStats.total.assists}
                </div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">Total Assists</div>
              </Card>
              <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/50">
                <Shield className="w-5 h-5 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {gameStats.total.blocks}
                </div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">Total Blocks</div>
              </Card>
              <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/40 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/50">
                <RotateCcw className="w-5 h-5 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {gameStats.total.turns}
                </div>
                <div className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">Total Turnovers</div>
              </Card>
            </div>

            {/* Split View Stats */}
            <SplitViewStats
              scores={scores}
              homeTeamId={game.homeTeam?.id}
              awayTeamId={game.awayTeam?.id}
              homeTeamName={game.homeTeam?.name || 'Home'}
              awayTeamName={game.awayTeam?.name || 'Away'}
            />
          </div>
        )}

        {/* Spirit Tab */}
        {activeTab === 'spirit' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Spirit Scores */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                Spirit Ratings
              </h3>
              <SpiritDisplay
                spiritScores={spiritScores}
                homeTeamId={game.homeTeam?.id}
                awayTeamId={game.awayTeam?.id}
              />
            </div>

            {/* Spirit Categories Legend */}
            <Card className="p-6 h-fit lg:sticky lg:top-20">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Spirit Categories
              </h4>
              <div className="space-y-4">
                {[
                  { name: 'Rules Knowledge', desc: 'Understanding and application of game rules', icon: '📚', color: 'blue' },
                  { name: 'Fouls & Contact', desc: 'Avoiding dangerous plays and respecting space', icon: '🛡️', color: 'purple' },
                  { name: 'Fair-Mindedness', desc: 'Honest calls and objective self-officiation', icon: '⚖️', color: 'amber' },
                  { name: 'Positive Attitude', desc: 'Sportsmanship and respect for opponents', icon: '😊', color: 'green' },
                  { name: 'Communication', desc: 'Clear, calm discussion on calls', icon: '💬', color: 'cyan' },
                ].map((cat) => (
                  <div key={cat.name} className={`p-3 rounded-lg bg-${cat.color}-50 dark:bg-${cat.color}-950/20 border border-${cat.color}-200/50 dark:border-${cat.color}-800/50`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{cat.icon}</span>
                      <span className="font-medium text-sm">{cat.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{cat.desc}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`w-4 h-4 rounded-full ${i < 3 ? 'bg-primary/80' : 'bg-muted'}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">0-4 scale</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <p className="font-medium mb-1">Total Spirit Score: 0-20</p>
                <p>Teams rate each other after every game. Higher scores indicate better sportsmanship.</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
