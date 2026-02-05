'use client';

import { cn } from '@/lib/utils';
import type { EventCategory } from '@/types';
import { Sun, Shuffle, Waves, Building2, Trophy } from 'lucide-react';

interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  className: string;
}

const categoryConfigs: Record<EventCategory, CategoryConfig> = {
  outdoor: {
    label: 'Outdoor',
    icon: Sun,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  },
  hat: {
    label: 'Hat',
    icon: Shuffle,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  },
  beach: {
    label: 'Beach',
    icon: Waves,
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  },
  indoor: {
    label: 'Indoor',
    icon: Building2,
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  },
  league: {
    label: 'League',
    icon: Trophy,
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  },
};

export function getCategoryConfig(category: EventCategory): CategoryConfig {
  return categoryConfigs[category] || categoryConfigs.outdoor;
}

interface EventCategoryBadgeProps {
  category: EventCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function EventCategoryBadge({
  category,
  showIcon = true,
  size = 'sm',
  className,
}: EventCategoryBadgeProps) {
  const config = getCategoryConfig(category);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />}
      {config.label}
    </span>
  );
}
