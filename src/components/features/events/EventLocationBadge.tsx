'use client';

import { cn } from '@/lib/utils';
import type { EventLocation } from '@/types';
import { MapPin } from 'lucide-react';

// Convert ISO 2-letter country code to flag emoji
export function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface EventLocationBadgeProps {
  location?: EventLocation;
  showIcon?: boolean;
  showCity?: boolean;
  className?: string;
  iconClassName?: string;
}

export function EventLocationBadge({
  location,
  showIcon = true,
  showCity = true,
  className,
  iconClassName,
}: EventLocationBadgeProps) {
  if (!location) return null;

  const flag = location.country?.code ? getCountryFlag(location.country.code) : '';
  const displayText = showCity && location.city
    ? `${location.city}, ${location.country?.name || location.name}`
    : location.country?.name || location.name;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
        className
      )}
    >
      {showIcon && <MapPin className={cn("h-4 w-4 shrink-0", iconClassName)} />}
      {flag && <span className="text-base">{flag}</span>}
      <span className="truncate">{displayText}</span>
    </span>
  );
}
