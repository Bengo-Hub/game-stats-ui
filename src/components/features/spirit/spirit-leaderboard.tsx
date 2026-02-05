'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamSpirit {
  teamId: string;
  teamName: string;
  averageScore: number;
  gamesPlayed: number;
  trend?: 'up' | 'down' | 'stable';
  previousRank?: number;
  categories?: {
    rulesKnowledge: number;
    foulsBodyContact: number;
    fairMindedness: number;
    attitude: number;
    communication: number;
  };
}

interface SpiritLeaderboardProps {
  teams: TeamSpirit[];
  title?: string;
  description?: string;
  showDetails?: boolean;
  className?: string;
}

function SpiritBar({ value, max = 4 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            percentage >= 80
              ? 'bg-green-500'
              : percentage >= 60
                ? 'bg-yellow-500'
                : percentage >= 40
                  ? 'bg-orange-500'
                  : 'bg-red-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8">{value.toFixed(1)}</span>
    </div>
  );
}

function TrendIndicator({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (!trend) return null;

  const config = {
    up: { icon: TrendingUp, className: 'text-green-500' },
    down: { icon: TrendingDown, className: 'text-red-500' },
    stable: { icon: Minus, className: 'text-muted-foreground' },
  };

  const { icon: Icon, className } = config[trend];

  return <Icon className={cn('h-4 w-4', className)} />;
}

export function SpiritLeaderboard({
  teams,
  title = 'Spirit Leaderboard',
  description = 'Teams ranked by average spirit score',
  showDetails = false,
  className,
}: SpiritLeaderboardProps) {
  const sortedTeams = [...teams].sort((a, b) => b.averageScore - a.averageScore);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTeams.map((team, index) => {
            const rank = index + 1;
            const isTopThree = rank <= 3;

            return (
              <div
                key={team.teamId}
                className={cn(
                  'p-3 rounded-lg transition-colors hover:bg-muted/50',
                  isTopThree && 'bg-muted/30'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
                      rank === 1 && 'bg-yellow-500/20 text-yellow-600',
                      rank === 2 && 'bg-slate-400/20 text-slate-600',
                      rank === 3 && 'bg-amber-600/20 text-amber-700',
                      rank > 3 && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {rank}
                  </div>

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{team.teamName}</p>
                      <TrendIndicator trend={team.trend} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {team.gamesPlayed} games played
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-lg">
                      {team.averageScore.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Category Breakdown */}
                {showDetails && team.categories && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Rules</span>
                        <SpiritBar value={team.categories.rulesKnowledge} />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fouls</span>
                        <SpiritBar value={team.categories.foulsBodyContact} />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fair-Mind</span>
                        <SpiritBar value={team.categories.fairMindedness} />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Attitude</span>
                        <SpiritBar value={team.categories.attitude} />
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Communication</span>
                        <SpiritBar value={team.categories.communication} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {teams.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No spirit scores recorded yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SpiritLeaderboard;
