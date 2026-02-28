'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { publicApi } from '@/lib/api/public';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2, MessageSquare, Sparkles, Star, Trophy as TrophyIcon } from 'lucide-react';
import * as React from 'react';

interface SpiritCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  value: number;
}

interface SpiritScoreFormProps {
  gameId: string;
  teamId: string;
  teamName: string;
  onSubmit: (data: SpiritScoreData) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export interface SpiritScoreData {
  gameId: string;
  teamId: string;
  rulesKnowledge: number;
  foulsBodyContact: number;
  fairMindedness: number;
  attitude: number;
  communication: number;
  comments?: string;
  mvpMaleNomination?: string;
  mvpFemaleNomination?: string;
  spiritMaleNomination?: string;
  spiritFemaleNomination?: string;
}

// ============================================
// Star Rating Component — Larger, more tactile
// ============================================

function StarRating({
  value,
  onChange,
  max = 4,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  disabled?: boolean;
}) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((rating) => {
        const isActive = (hoverValue ?? value) >= rating;
        return (
          <button
            key={rating}
            type="button"
            onClick={() => !disabled && onChange(rating)}
            onMouseEnter={() => !disabled && setHoverValue(rating)}
            onMouseLeave={() => setHoverValue(null)}
            disabled={disabled}
            className={cn(
              'p-1 transition-all duration-150 rounded-lg',
              'hover:scale-125 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <Star
              className={cn(
                'h-7 w-7 sm:h-8 sm:w-8 transition-colors duration-150',
                isActive
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                  : 'text-muted-foreground/40'
              )}
            />
          </button>
        );
      })}
      <span className={cn(
        'ml-2 text-sm font-bold tabular-nums rounded-full px-2 py-0.5',
        value >= 3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
          value === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
      )}>
        {value}/{max}
      </span>
    </div>
  );
}

// ============================================
// Score Progress Ring
// ============================================

function ScoreRing({ score, max = 20 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color = pct >= 75 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-rose-500';
  const bgColor = pct >= 75 ? 'stroke-emerald-100 dark:stroke-emerald-900/30' : pct >= 50 ? 'stroke-amber-100 dark:stroke-amber-900/30' : 'stroke-rose-100 dark:stroke-rose-900/30';

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle
          className={bgColor}
          strokeWidth="6"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
        />
        <circle
          className={cn(color, 'transition-all duration-500 ease-out')}
          strokeWidth="6"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-black tabular-nums leading-none', color.replace('text-', 'text-'))}>{score}</span>
        <span className="text-[10px] text-muted-foreground font-medium">/ {max}</span>
      </div>
    </div>
  );
}

// ============================================
// Category Icons
// ============================================

const categoryIcons: Record<string, string> = {
  rulesKnowledge: '📖',
  foulsBodyContact: '🤝',
  fairMindedness: '⚖️',
  attitude: '😊',
  communication: '💬',
};

// ============================================
// Spirit Score Form — Main Component
// ============================================

export function SpiritScoreForm({
  gameId,
  teamId,
  teamName,
  onSubmit,
  disabled = false,
  className,
}: SpiritScoreFormProps) {
  const [categories, setCategories] = React.useState<SpiritCategory[]>([
    {
      id: 'rulesKnowledge',
      name: 'Rules Knowledge',
      description: 'Knowledge and application of rules',
      icon: '📖',
      value: 2,
    },
    {
      id: 'foulsBodyContact',
      name: 'Fouls & Body Contact',
      description: 'Avoidance of physical contact and fouls',
      icon: '🤝',
      value: 2,
    },
    {
      id: 'fairMindedness',
      name: 'Fair-Mindedness',
      description: 'Objectivity about calls, even against themselves',
      icon: '⚖️',
      value: 2,
    },
    {
      id: 'attitude',
      name: 'Positive Attitude',
      description: 'Positive and respectful demeanor throughout',
      icon: '😊',
      value: 2,
    },
    {
      id: 'communication',
      name: 'Communication',
      description: 'Respectful and clear communication on field',
      icon: '💬',
      value: 2,
    },
  ]);

  const [comments, setComments] = React.useState('');
  const [mvpMaleNomination, setMvpMaleNomination] = React.useState<string>('');
  const [mvpFemaleNomination, setMvpFemaleNomination] = React.useState<string>('');
  const [spiritMaleNomination, setSpiritMaleNomination] = React.useState<string>('');
  const [spiritFemaleNomination, setSpiritFemaleNomination] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch team roster for nominations
  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['teams', teamId, 'roster'],
    queryFn: () => publicApi.getTeam(teamId),
    enabled: !!teamId,
  });

  const players = team?.players || [];

  const totalScore = categories.reduce((sum, cat) => sum + cat.value, 0);
  const averageScore = totalScore / categories.length;

  const handleCategoryChange = (categoryId: string, value: number) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, value } : cat))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data: SpiritScoreData = {
      gameId,
      teamId,
      rulesKnowledge: categories.find((c) => c.id === 'rulesKnowledge')?.value ?? 2,
      foulsBodyContact: categories.find((c) => c.id === 'foulsBodyContact')?.value ?? 2,
      fairMindedness: categories.find((c) => c.id === 'fairMindedness')?.value ?? 2,
      attitude: categories.find((c) => c.id === 'attitude')?.value ?? 2,
      communication: categories.find((c) => c.id === 'communication')?.value ?? 2,
      comments: comments || undefined,
      mvpMaleNomination: mvpMaleNomination || undefined,
      mvpFemaleNomination: mvpFemaleNomination || undefined,
      spiritMaleNomination: spiritMaleNomination || undefined,
      spiritFemaleNomination: spiritFemaleNomination || undefined,
    };

    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Spirit Score</CardTitle>
            <CardDescription className="text-xs">
              Rate <span className="font-semibold text-foreground">{teamName}</span> in each category (1–4)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          {/* Categories — Card-per-category layout */}
          <div className="divide-y">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0" role="img" aria-label={category.name}>
                    {category.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{category.name}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">{category.description}</p>
                  </div>
                </div>
                <StarRating
                  value={category.value}
                  onChange={(value) => handleCategoryChange(category.id, value)}
                  disabled={disabled || isSubmitting}
                />
              </div>
            ))}
          </div>

          {/* Total Score Summary */}
          <div className="px-4 sm:px-6 py-5 bg-gradient-to-r from-muted/50 to-muted/30 border-y">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground mb-1">Total Spirit Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tabular-nums">{totalScore}</span>
                  <span className="text-muted-foreground font-medium">/ 20</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Average: {averageScore.toFixed(1)} / 4.0
                </p>
              </div>
              <ScoreRing score={totalScore} />
            </div>
          </div>

          {/* Comments */}
          <div className="px-4 sm:px-6 py-4 space-y-3">
            <Label htmlFor="comments" className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Comments
              <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="comments"
              placeholder="Any additional comments about the team's spirit..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={disabled || isSubmitting}
              rows={3}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Nominations */}
          <div className="px-4 sm:px-6 py-4 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* MVP Male Nomination */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <TrophyIcon className="h-4 w-4 text-amber-500" />
                  MVP Nomination (Male)
                </Label>
                <Select
                  value={mvpMaleNomination}
                  onValueChange={setMvpMaleNomination}
                  disabled={disabled || isSubmitting || players.length === 0}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={isLoadingTeam ? 'Loading...' : (players.length === 0 ? 'No players' : 'Select player')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {players.filter((p: any) => p.gender === 'M').map((player: any) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* MVP Female Nomination */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <TrophyIcon className="h-4 w-4 text-amber-500" />
                  MVP Nomination (Female)
                </Label>
                <Select
                  value={mvpFemaleNomination}
                  onValueChange={setMvpFemaleNomination}
                  disabled={disabled || isSubmitting || players.length === 0}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={isLoadingTeam ? 'Loading...' : (players.length === 0 ? 'No players' : 'Select player')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {players.filter((p: any) => p.gender === 'F').map((player: any) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Spirit Male Nomination */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Spirit Nomination (Male)
                </Label>
                <Select
                  value={spiritMaleNomination}
                  onValueChange={setSpiritMaleNomination}
                  disabled={disabled || isSubmitting || players.length === 0}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={isLoadingTeam ? 'Loading...' : (players.length === 0 ? 'No players' : 'Select player')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {players.filter((p: any) => p.gender === 'M').map((player: any) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Spirit Female Nomination */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Heart className="h-4 w-4 text-rose-500" />
                  Spirit Nomination (Female)
                </Label>
                <Select
                  value={spiritFemaleNomination}
                  onValueChange={setSpiritFemaleNomination}
                  disabled={disabled || isSubmitting || players.length === 0}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={isLoadingTeam ? 'Loading...' : (players.length === 0 ? 'No players' : 'Select player')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {players.filter((p: any) => p.gender === 'F').map((player: any) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="px-4 sm:px-6 py-4 border-t bg-muted/20">
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20 transition-all"
              disabled={disabled || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Submit Spirit Score
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default SpiritScoreForm;
