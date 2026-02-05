'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GameTimer, CompactTimer } from '@/components/features/games/game-timer';
import { ConnectionStatus } from '@/components/features/games/connection-status';
import { useGameStream } from '@/lib/hooks/useGameStream';
import { useGameStore } from '@/stores/game';
import { gamesApi } from '@/lib/api';
import type { Game, GameEvent } from '@/types';
import {
  ArrowLeft,
  Play,
  Square,
  Clock,
  MapPin,
  Trophy,
  Timer,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = React.useState<Game | null>(null);
  const [events, setEvents] = React.useState<GameEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Real-time state from store
  const { timer, setGame: setStoreGame, incrementTimer, startTimer, pauseTimer, startStoppage, endStoppage, addStoppageTime } = useGameStore();

  // SSE connection for live updates
  const {
    isConnected,
    connectionStatus,
    lastUpdate,
  } = useGameStream(game?.status === 'in_progress' ? gameId : null, {
    onEvent: (event) => {
      if (event.type === 'score_updated' || event.type === 'goal_scored') {
        // Refresh game data on score changes
        loadGame();
      }
    },
  });

  // Timer interval for live games
  React.useEffect(() => {
    if (game?.status !== 'in_progress' || !timer.isRunning) return;

    const interval = setInterval(() => {
      incrementTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.status, timer.isRunning, incrementTimer]);

  const loadGame = React.useCallback(async () => {
    setLoading(true);
    try {
      const [gameData, timelineData] = await Promise.all([
        gamesApi.get(gameId),
        gamesApi.getTimeline(gameId).catch(() => ({ events: [] })),
      ]);
      setGame(gameData);
      setStoreGame(gameData);
      setEvents(timelineData.events || []);
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  }, [gameId, setStoreGame]);

  React.useEffect(() => {
    if (gameId) {
      loadGame();
    }
  }, [gameId, loadGame]);

  const handleStartGame = async () => {
    try {
      const updated = await gamesApi.start(gameId);
      setGame(updated);
      setStoreGame(updated);
      startTimer();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleEndGame = async () => {
    try {
      const updated = await gamesApi.end(gameId);
      setGame(updated);
      setStoreGame(updated);
      pauseTimer();
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  };

  const handlePauseTimer = () => {
    pauseTimer();
  };

  const handleResumeTimer = () => {
    startTimer();
  };

  const handleStoppage = async () => {
    if (timer.isStoppage) {
      // End stoppage
      endStoppage();
      try {
        // Record stoppage time to backend
        const stoppageDuration = 60; // Example: 1 minute stoppage
        await gamesApi.recordStoppage(gameId, stoppageDuration, 'Injury timeout');
        addStoppageTime(stoppageDuration);
      } catch (error) {
        console.error('Failed to record stoppage:', error);
      }
    } else {
      // Start stoppage
      startStoppage();
    }
  };

  const handleRecordGoal = async (teamId: string, _isHome: boolean) => {
    try {
      // In a real implementation, this would show a dialog to select player
      await gamesApi.recordScore(gameId, {
        teamId,
        scoringPlayerId: 'player-id', // Would be selected from dialog
      });
      // Refresh game data
      loadGame();
    } catch (error) {
      console.error('Failed to record goal:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Game not found</p>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const isLive = game.status === 'in_progress';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              {game.homeTeam?.name || 'TBD'} vs {game.awayTeam?.name || 'TBD'}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <StatusBadge status={game.status} />
              <span>{formatTime(game.scheduledTime)}</span>
              {isLive && (
                <ConnectionStatus
                  status={connectionStatus}
                  lastUpdate={lastUpdate}
                  showLabel={false}
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {game.status === 'scheduled' && (
            <Button onClick={handleStartGame}>
              <Play className="h-4 w-4 mr-2" />
              Start Game
            </Button>
          )}
          {isLive && (
            <Button variant="destructive" onClick={handleEndGame}>
              <Square className="h-4 w-4 mr-2" />
              End Game
            </Button>
          )}
        </div>
      </div>

      {/* Live Connection Banner */}
      {isLive && (
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
            isConnected ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
          )}
        >
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Live updates enabled</span>
              {lastUpdate && (
                <span className="text-muted-foreground">
                  • Last update: {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              )}
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>
                {connectionStatus === 'connecting'
                  ? 'Connecting to live updates...'
                  : 'Live updates unavailable'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Game Timer - Show for live games */}
      {isLive && (
        <GameTimer
          elapsedSeconds={timer.elapsedSeconds}
          allocatedMinutes={game.allocatedTimeMinutes}
          stoppageSeconds={timer.stoppageSeconds}
          isRunning={timer.isRunning}
          isStoppage={timer.isStoppage}
          onStart={handleResumeTimer}
          onPause={handlePauseTimer}
          onEnd={handleEndGame}
          onStoppage={handleStoppage}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Scoreboard */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 items-center text-center">
              {/* Home Team */}
              <div className="space-y-2">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: game.homeTeam?.primaryColor || '#6366f1' }}
                >
                  {game.homeTeam?.name?.charAt(0) || '?'}
                </div>
                <h3 className="font-semibold text-sm sm:text-base">
                  {game.homeTeam?.name || 'TBD'}
                </h3>
                <Badge variant="secondary">Home</Badge>
              </div>

              {/* Score */}
              <div className="space-y-2">
                <div className="text-4xl sm:text-6xl font-bold font-mono">
                  {game.homeTeamScore} - {game.awayTeamScore}
                </div>
                {isLive && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                    <CompactTimer
                      elapsedSeconds={timer.elapsedSeconds}
                      allocatedMinutes={game.allocatedTimeMinutes}
                      stoppageSeconds={timer.stoppageSeconds}
                      isRunning={timer.isRunning}
                      isStoppage={timer.isStoppage}
                    />
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="space-y-2">
                <div
                  className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: game.awayTeam?.primaryColor || '#8b5cf6' }}
                >
                  {game.awayTeam?.name?.charAt(0) || '?'}
                </div>
                <h3 className="font-semibold text-sm sm:text-base">
                  {game.awayTeam?.name || 'TBD'}
                </h3>
                <Badge variant="outline">Away</Badge>
              </div>
            </div>

            {/* Quick Actions for Live Game */}
            {isLive && (
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-1"
                    onClick={() => handleRecordGoal(game.homeTeam?.id || '', true)}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">{game.homeTeam?.name} Goal</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-1"
                    onClick={() => handleRecordGoal(game.awayTeam?.id || '', false)}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">{game.awayTeam?.name} Goal</span>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Game Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Game Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Scheduled</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(game.scheduledTime)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {game.allocatedTimeMinutes} minutes
                  {game.stoppageTimeSeconds > 0 && (
                    <span className="text-yellow-500">
                      {' '}
                      (+{Math.floor(game.stoppageTimeSeconds / 60)}m stoppage)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {game.fieldLocation && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Field</p>
                  <p className="text-sm text-muted-foreground">{game.fieldLocation.name}</p>
                </div>
              </div>
            )}

            {isLive && (
              <div className="flex items-center gap-3">
                <ConnectionStatus status={connectionStatus} lastUpdate={lastUpdate} />
              </div>
            )}

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/games/${gameId}/spirit`}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Spirit Scores
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Game Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No events recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card"
                >
                  <div className="text-center min-w-[50px]">
                    <span className="text-lg font-mono font-bold">
                      {event.minute}&apos;
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium capitalize">{event.eventType}</p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">{event.eventType}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
