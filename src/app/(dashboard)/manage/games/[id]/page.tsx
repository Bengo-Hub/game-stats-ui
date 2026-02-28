'use client';

import { UnifiedScoreForm } from '@/components/dashboard/games/UnifiedScoreForm';
import { ConnectionStatus } from '@/components/features/games/connection-status';
import { CompactTimer, GameTimer } from '@/components/features/games/game-timer';
import SpiritScoreForm, { type SpiritScoreData } from '@/components/features/spirit/spirit-score-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminApi, gamesApi, publicApi } from '@/lib/api';
import { useGameStream } from '@/lib/hooks/useGameStream';
import { cn } from '@/lib/utils';
import { useUser } from '@/stores/auth';
import { useGameStore } from '@/stores/game';
import type { Game, GameEvent } from '@/types';
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Heart,
  History,
  Loader2,
  MapPin,
  Play,
  ShieldCheck,
  Square,
  Star,
  Timer,
  Trophy
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = React.useState<Game | null>(null);
  const [events, setEvents] = React.useState<GameEvent[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showOverrideDialog, setShowOverrideDialog] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [showSpiritDialog, setShowSpiritDialog] = React.useState(false);
  const [spiritScores, setSpiritScores] = React.useState<any[]>([]);
  const [eventCrew, setEventCrew] = React.useState<any | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
  const user = useUser();

  // Real-time state from store
  const { timer, setGame: setStoreGame, incrementTimer, startTimer, pauseTimer, startStoppage, endStoppage, addStoppageTime, setElapsedTime } = useGameStore();


  // Timer interval for live games
  React.useEffect(() => {
    if (game?.status !== 'in_progress' || !timer.isRunning) return;

    const interval = setInterval(() => {
      incrementTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [game?.status, timer.isRunning, incrementTimer]);

  const loadSpiritScores = React.useCallback(async () => {
    try {
      const scores = await publicApi.getGameSpiritScores(gameId);
      setSpiritScores(scores || []);
    } catch (e) {
      console.error('Failed to load spirit scores:', e);
    }
  }, [gameId]);

  const loadGame = React.useCallback(async () => {
    setLoading(true);
    try {
      const [gameData, timelineData, auditData] = await Promise.all([
        publicApi.getGame(gameId),
        publicApi.getGameTimeline(gameId).catch(() => ({ events: [] })),
        adminApi.getGameAuditHistory(gameId).catch(() => []),
        loadSpiritScores(),
      ]);
      setGame(gameData);
      setStoreGame(gameData);
      setEvents(timelineData.events || []);
      setAuditLogs(auditData || []);

      // Fetch event crew if gameData has eventId
      if (gameData.eventId) {
        publicApi.getEventCrew(gameData.eventId)
          .then(setEventCrew)
          .catch(e => console.error('Failed to load event crew:', e));
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  }, [gameId, setStoreGame, loadSpiritScores]);

  // Use a stable ref for loadGame so SSE doesn't cause re-render cascades
  const loadGameRef = React.useRef(loadGame);
  React.useEffect(() => { loadGameRef.current = loadGame; }, [loadGame]);

  // SSE connection for live updates — use stable ref to prevent reconnect loops
  const sseOptions = React.useMemo(() => ({
    onEvent: (event: any) => {
      if (event.type === 'score_updated' || event.type === 'goal_scored') {
        loadGameRef.current();
      }
    },
  }), []); // empty deps — stable forever

  const {
    isConnected,
    connectionStatus,
    lastUpdate,
  } = useGameStream(game?.status === 'in_progress' ? gameId : null, sseOptions);

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

  const handleFinishGame = async () => {
    try {
      const updated = await gamesApi.end(gameId);
      setGame(updated);
      setStoreGame(updated);
      pauseTimer();
      toast.success('Game finished. Waiting for final score submission.');
    } catch (error) {
      console.error('Failed to finish game:', error);
      toast.error('Failed to finish game');
    }
  };

  const handleCompleteGame = async () => {
    try {
      const updated = await gamesApi.complete(gameId);
      setGame(updated);
      setStoreGame(updated);
      pauseTimer();
      toast.success('Game completed and scores finalized.');
    } catch (error) {
      console.error('Failed to complete game:', error);
      toast.error('Failed to complete game');
    }
  };

  const handlePauseTimer = () => {
    pauseTimer();
  };

  const handleResumeTimer = () => {
    startTimer();
  };

  const handleEditTime = (newElapsedSeconds: number) => {
    setElapsedTime(newElapsedSeconds);
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



  const handleCancelGame = async () => {
    setCancelling(true);
    try {
      await gamesApi.cancel(gameId);
      toast.success('Game cancelled successfully');
      setShowCancelDialog(false);
      loadGame();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel game');
    } finally {
      setCancelling(false);
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
  const isEnded = game.status === 'ended';
  const isCompleted = game.status === 'completed';
  const isCancelled = game.status === 'canceled';
  const isLiveOrEnded = isLive || isEnded;
  const isAdmin = user?.role === 'admin' || user?.role === 'event_manager';

  // Check event-specific permissions
  const isEventCrewScorekeeper = eventCrew?.scorekeepers?.some((s: any) => s.id === user?.id);
  const isEventCrewAdmin = eventCrew?.admins?.some((a: any) => a.id === user?.id);

  const isScorekeeper = user?.id === game.scorekeeper?.id || isEventCrewScorekeeper;
  const canOverride = isAdmin || isEventCrewAdmin;
  const canRecordDetailed = isScorekeeper || isAdmin || isEventCrewAdmin;

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
            <Button variant="destructive" onClick={handleFinishGame}>
              <Square className="h-4 w-4 mr-2" />
              Finish Game
            </Button>
          )}
          {isEnded && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCompleteGame}>
              <Trophy className="h-4 w-4 mr-2" />
              Complete Game
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

      {isLiveOrEnded && (
        <GameTimer
          elapsedSeconds={timer.elapsedSeconds}
          allocatedMinutes={game.allocatedTimeMinutes}
          stoppageSeconds={timer.stoppageSeconds}
          isRunning={timer.isRunning}
          isStoppage={timer.isStoppage}
          onStart={handleResumeTimer}
          onPause={handlePauseTimer}
          onEnd={handleFinishGame}
          onStoppage={handleStoppage}
          onEditTime={handleEditTime}
          showControls={isLive}
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
                {isLiveOrEnded && (
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

            {/* Score Game Action - For live or ended (override) */}
            {(isLive || isEnded) && (canRecordDetailed || canOverride) && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  className={cn(
                    "w-full h-14 text-base font-semibold rounded-xl",
                    isEnded ? "bg-amber-600 hover:bg-amber-700" : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                  )}
                  onClick={() => setShowOverrideDialog(true)}
                >
                  <Trophy className="h-5 w-5 mr-2" />
                  {isEnded ? 'Override Scores' : 'Score Game'}
                </Button>
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

            <div className="pt-4 border-t space-y-2">
              <Button
                variant="outline"
                className="w-full h-10 rounded-xl"
                onClick={() => setShowSpiritDialog(true)}
              >
                <Trophy className="h-4 w-4 mr-2 text-amber-500" />
                Submit Spirit Score
              </Button>
              {(game.status === 'scheduled' || isLive) && (
                <Button
                  variant="outline"
                  className="w-full h-10 rounded-xl text-rose-600 border-rose-100 hover:bg-rose-50"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Cancel Game
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline, Spirit & Audit Trail */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Tabs defaultValue="timeline" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-full sm:w-[450px] grid-cols-3">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="spirit">Spirit Scores</TabsTrigger>
                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              </TabsList>
              {!isLive && (canOverride || canRecordDetailed) && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "rounded-xl",
                    canOverride ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-primary border-primary/20 hover:bg-primary/5"
                  )}
                  onClick={() => setShowOverrideDialog(true)}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {canOverride ? 'Score Override' : 'Record Detailed Scores'}
                </Button>
              )}
            </div>

            <TabsContent value="timeline">
              <CardTitle className="text-lg mb-4">Game Timeline</CardTitle>
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No events recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border bg-card">
                      <div className="text-center min-w-[50px]">
                        <span className="text-lg font-mono font-bold">{event.minute}&apos;</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">{event.eventType}</p>
                        {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                      </div>
                      <Badge variant="outline">{event.eventType}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="spirit">
              <CardTitle className="text-lg mb-4">Spirit Scores Summary</CardTitle>
              {spiritScores.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">No spirit scores submitted yet</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {spiritScores.map((score) => (
                    <Card key={score.id} className="rounded-2xl border-none shadow-sm bg-muted/30">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="rounded-lg">
                            From {score.scoredByTeam?.name}
                          </Badge>
                          <div className="flex items-center gap-1 font-bold text-lg">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {score.totalScore?.toFixed(1) || '0.0'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Rules:</span> <span className="font-medium text-foreground">{score.rulesKnowledge}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fouls:</span> <span className="font-medium text-foreground">{score.foulsBodyContact}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fair:</span> <span className="font-medium text-foreground">{score.fairMindedness}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Attitude:</span> <span className="font-medium text-foreground">{score.attitude}</span>
                          </div>
                        </div>
                        {score.comments && (
                          <p className="text-xs italic border-l-2 border-primary pl-2 mt-2 truncate">
                            &quot;{score.comments}&quot;
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="audit">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg">Administrative Audit Log</CardTitle>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Admin Only</Badge>
              </div>
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                  <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">No administrative actions recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card/50 hover:bg-card transition-colors">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm uppercase tracking-tight">{log.action?.replace(/_/g, ' ') || 'Action'}</p>
                          <span className="text-[10px] font-mono text-muted-foreground">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">by <span className="text-foreground font-medium">{log.userName}</span></p>
                        {log.details?.reason && (
                          <div className="mt-2 p-2 rounded bg-muted/50 text-[11px] italic border-l-2 border-amber-500">
                            &quot;{log.details.reason}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {showOverrideDialog && (
        <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-2xl font-black">
                <ShieldCheck className="h-6 w-6 text-primary" />
                {isAdmin ? 'Administrative Score Override' : 'Record Detailed Match Scores'}
              </DialogTitle>
              <DialogDescription className="text-base">
                {isAdmin
                  ? 'Update individual player statistics and the final game score. All changes require a reason and will be audited.'
                  : 'Enter precise player statistics for both teams. Total scores will be calculated automatically.'}
              </DialogDescription>
            </DialogHeader>

            <UnifiedScoreForm
              game={game}
              isAdmin={isAdmin}
              onSuccess={() => {
                setShowOverrideDialog(false);
                loadGame();
              }}
              onCancel={() => setShowOverrideDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {showSpiritDialog && game && (
        <Dialog open={showSpiritDialog} onOpenChange={setShowSpiritDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
            <DialogHeader className="mb-4">
              <DialogTitle className="flex items-center gap-2 text-2xl font-black">
                <Heart className="h-6 w-6 text-rose-500" />
                Submit Spirit Score
              </DialogTitle>
              <DialogDescription className="text-base">
                Rate the opposing team&apos;s spirit of the game.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="home" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="home">
                  Score {game.homeTeam?.name || 'Home Team'}
                </TabsTrigger>
                <TabsTrigger value="away">
                  Score {game.awayTeam?.name || 'Away Team'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="home">
                <SpiritScoreForm
                  gameId={gameId}
                  teamId={game.homeTeam?.id || ''}
                  teamName={game.homeTeam?.name || 'Home Team'}
                  onSubmit={async (data: SpiritScoreData) => {
                    await gamesApi.submitSpiritScore(gameId, {
                      scored_by_team_id: game.awayTeam?.id || '',
                      team_id: data.teamId,
                      rules_knowledge: data.rulesKnowledge,
                      fouls_body_contact: data.foulsBodyContact,
                      fair_mindedness: data.fairMindedness,
                      attitude: data.attitude,
                      communication: data.communication,
                      comments: data.comments,
                      mvp_nomination: data.mvpNomination,
                      spirit_nomination: data.spiritNomination,
                    });
                    toast.success('Spirit score submitted!');
                    loadSpiritScores();
                    setShowSpiritDialog(false);
                  }}
                />
              </TabsContent>

              <TabsContent value="away">
                <SpiritScoreForm
                  gameId={gameId}
                  teamId={game.awayTeam?.id || ''}
                  teamName={game.awayTeam?.name || 'Away Team'}
                  onSubmit={async (data: SpiritScoreData) => {
                    await gamesApi.submitSpiritScore(gameId, {
                      scored_by_team_id: game.homeTeam?.id || '',
                      team_id: data.teamId,
                      rules_knowledge: data.rulesKnowledge,
                      fouls_body_contact: data.foulsBodyContact,
                      fair_mindedness: data.fairMindedness,
                      attitude: data.attitude,
                      communication: data.communication,
                      comments: data.comments,
                      mvp_nomination: data.mvpNomination,
                      spirit_nomination: data.spiritNomination,
                    });
                    toast.success('Spirit score submitted!');
                    loadSpiritScores();
                    setShowSpiritDialog(false);
                  }}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {showCancelDialog && (
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="h-5 w-5" />
                Cancel Game?
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this game? This action cannot be undone and will notify all participants.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="rounded-xl">Keep Game</Button>
              <Button
                variant="destructive"
                onClick={handleCancelGame}
                disabled={cancelling}
                className="rounded-xl bg-rose-600 hover:bg-rose-700"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

