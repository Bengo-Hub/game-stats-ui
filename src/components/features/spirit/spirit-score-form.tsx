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
import { Heart, Loader2, Star, Trophy as TrophyIcon } from 'lucide-react';
import * as React from 'react';

interface SpiritCategory {
  id: string;
  name: string;
  description: string;
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
  mvpNomination?: string;
  spiritNomination?: string;
}

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
    <div className="flex items-center gap-1">
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
              'p-0.5 transition-transform hover:scale-110',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <Star
              className={cn(
                'h-6 w-6 transition-colors',
                isActive ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
              )}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm text-muted-foreground">{value}/4</span>
    </div>
  );
}

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
      description: 'How well did the team know and apply the rules?',
      value: 2,
    },
    {
      id: 'foulsBodyContact',
      name: 'Fouls & Body Contact',
      description: 'Did the team avoid physical contact and fouls?',
      value: 2,
    },
    {
      id: 'fairMindedness',
      name: 'Fair-Mindedness',
      description: 'Were they objective about calls, even against themselves?',
      value: 2,
    },
    {
      id: 'attitude',
      name: 'Positive Attitude',
      description: 'Did they maintain a positive attitude throughout?',
      value: 2,
    },
    {
      id: 'communication',
      name: 'Communication',
      description: 'How well did they communicate with respect?',
      value: 2,
    },
  ]);

  const [comments, setComments] = React.useState('');
  const [mvpNomination, setMvpNomination] = React.useState<string>('');
  const [spiritNomination, setSpiritNomination] = React.useState<string>('');
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
      mvpNomination: mvpNomination || undefined,
      spiritNomination: spiritNomination || undefined,
    };

    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Spirit Score for {teamName}</CardTitle>
        <CardDescription>
          Rate the opposing team&apos;s spirit in each category (1-4 scale)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Categories */}
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{category.name}</Label>
                </div>
                <p className="text-sm text-muted-foreground">{category.description}</p>
                <StarRating
                  value={category.value}
                  onChange={(value) => handleCategoryChange(category.id, value)}
                  disabled={disabled || isSubmitting}
                />
              </div>
            ))}
          </div>

          {/* Total Score Display */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Spirit Score</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{totalScore}</span>
                <span className="text-muted-foreground">/ 20</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">Average</span>
              <span className="text-sm font-medium">{averageScore.toFixed(1)} / 4.0</span>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Any additional comments about the team's spirit..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={disabled || isSubmitting}
              rows={3}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            {/* MVP Nomination */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-amber-500" />
                MVP Nomination
              </Label>
              <Select
                value={mvpNomination}
                onValueChange={setMvpNomination}
                disabled={disabled || isSubmitting || players.length === 0}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={isLoadingTeam ? "Loading roster..." : (players.length === 0 ? "No players" : "Select player")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spirit Nomination */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                Spirit Nomination
              </Label>
              <Select
                value={spiritNomination}
                onValueChange={setSpiritNomination}
                disabled={disabled || isSubmitting || players.length === 0}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={isLoadingTeam ? "Loading roster..." : (players.length === 0 ? "No players" : "Select player")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-lg font-bold"
            disabled={disabled || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Spirit Score'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default SpiritScoreForm;
