'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={disabled || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Spirit Score'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default SpiritScoreForm;
