'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, Clock, Edit2, Pause, Play, StopCircle } from 'lucide-react';
import { useState } from 'react';

interface GameTimerProps {
  elapsedSeconds: number;
  allocatedMinutes: number;
  stoppageSeconds?: number;
  isRunning: boolean;
  isStoppage?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onStoppage?: () => void;
  onEditTime?: (newElapsedSeconds: number) => void;
  showControls?: boolean;
  className?: string;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function GameTimer({
  elapsedSeconds,
  allocatedMinutes,
  stoppageSeconds = 0,
  isRunning,
  isStoppage = false,
  onStart,
  onPause,
  onEnd,
  onStoppage,
  onEditTime,
  showControls = true,
  className,
}: GameTimerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMinutes, setEditMinutes] = useState('');
  const [editSeconds, setEditSeconds] = useState('');

  const handleEditSubmit = () => {
    if (onEditTime) {
      const m = parseInt(editMinutes) || 0;
      const s = parseInt(editSeconds) || 0;
      onEditTime(m * 60 + s);
    }
    setIsEditing(false);
  };

  const startEditing = () => {
    setEditMinutes(Math.floor(elapsedSeconds / 60).toString());
    setEditSeconds((elapsedSeconds % 60).toString().padStart(2, '0'));
    setIsEditing(true);
  };
  const allocatedSeconds = allocatedMinutes * 60;
  const totalElapsed = elapsedSeconds;
  const remainingSeconds = Math.max(0, allocatedSeconds - totalElapsed + stoppageSeconds);
  const isOvertime = totalElapsed > allocatedSeconds + stoppageSeconds;
  const overtimeSeconds = isOvertime ? totalElapsed - allocatedSeconds - stoppageSeconds : 0;

  const progressPercent = Math.min(100, (totalElapsed / allocatedSeconds) * 100);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        {/* Timer Display */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            {isStoppage ? (
              <span className="text-yellow-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Stoppage
              </span>
            ) : isRunning ? (
              <span className="text-green-500">Running</span>
            ) : (
              <span className="text-muted-foreground">Paused</span>
            )}
          </div>

          {/* Main Time */}
          <div
            className={cn(
              'font-mono text-5xl sm:text-6xl font-bold tracking-tight flex items-center justify-center gap-2 group relative',
              isOvertime && 'text-red-500',
              isStoppage && 'text-yellow-500'
            )}
          >
            {isEditing ? (
              <div className="flex items-center gap-2 text-4xl sm:text-5xl">
                <Input
                  type="number"
                  value={editMinutes}
                  onChange={e => setEditMinutes(e.target.value)}
                  className="w-20 text-center font-mono text-4xl sm:text-5xl h-14"
                  min="0"
                />:
                <Input
                  type="number"
                  value={editSeconds}
                  onChange={e => setEditSeconds(e.target.value)}
                  className="w-20 text-center font-mono text-4xl sm:text-5xl h-14"
                  min="0" max="59"
                />
              </div>
            ) : (
              isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(remainingSeconds)
            )}

            {showControls && onEditTime && (
              <Button
                variant="ghost"
                size="icon"
                onClick={isEditing ? handleEditSubmit : startEditing}
                className={cn(
                  "h-10 w-10 absolute -right-12",
                  isEditing ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                )}
              >
                {isEditing ? <Check className="h-6 w-6 text-green-500" /> : <Edit2 className="h-5 w-5 text-muted-foreground" />}
              </Button>
            )}
          </div>

          {/* Remaining / Allocated */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
            <span>
              Elapsed: <span className="font-medium text-foreground">{formatTime(totalElapsed)}</span>
            </span>
            <span>
              Allocated: <span className="font-medium">{allocatedMinutes} min</span>
            </span>
          </div>

          {/* Stoppage Time */}
          {stoppageSeconds > 0 && (
            <div className="text-sm text-yellow-500">
              +{formatTime(stoppageSeconds)} stoppage
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                isOvertime ? 'bg-red-500' : 'bg-primary'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {isRunning ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onStart}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {elapsedSeconds > 0 ? 'Resume' : 'Start'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onStoppage}
              className={cn(
                'flex items-center gap-2',
                isStoppage && 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
              )}
            >
              <AlertCircle className="h-4 w-4" />
              {isStoppage ? 'End Stoppage' : 'Stoppage'}
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onEnd}
              className="flex items-center gap-2"
            >
              <StopCircle className="h-4 w-4" />
              End Game
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact timer for display without controls
export function CompactTimer({
  elapsedSeconds,
  allocatedMinutes,
  stoppageSeconds = 0,
  isRunning,
  isStoppage = false,
  className,
}: Omit<GameTimerProps, 'showControls' | 'onStart' | 'onPause' | 'onEnd' | 'onStoppage'>) {
  const allocatedSeconds = allocatedMinutes * 60;
  const remainingSeconds = Math.max(0, allocatedSeconds - elapsedSeconds + stoppageSeconds);
  const isOvertime = elapsedSeconds > allocatedSeconds + stoppageSeconds;
  const overtimeSeconds = isOvertime ? elapsedSeconds - allocatedSeconds - stoppageSeconds : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-md text-sm font-mono',
          isRunning && 'animate-pulse',
          isOvertime && 'bg-red-500/10 text-red-500',
          isStoppage && 'bg-yellow-500/10 text-yellow-500',
          !isOvertime && !isStoppage && 'bg-muted'
        )}
      >
        <Clock className="h-3 w-3" />
        <span className="font-bold">
          {isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(remainingSeconds)}
        </span>
      </div>
      {stoppageSeconds > 0 && (
        <span className="text-xs text-yellow-500">+{Math.floor(stoppageSeconds / 60)}m</span>
      )}
    </div>
  );
}

export default GameTimer;
