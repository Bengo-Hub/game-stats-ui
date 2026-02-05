'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface EventListSkeletonProps {
  count?: number;
  className?: string;
}

function EventCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      {/* Header skeleton */}
      <Skeleton className="h-24 w-full rounded-none" />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>

        {/* Categories */}
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        {/* Location */}
        <Skeleton className="h-4 w-2/3" />

        {/* Date */}
        <Skeleton className="h-4 w-1/2" />

        {/* Stats row */}
        <div className="mt-auto flex items-center justify-between border-t pt-3">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Team preview */}
        <div className="flex">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="-ml-2 h-6 w-6 rounded-full" />
          <Skeleton className="-ml-2 h-6 w-6 rounded-full" />
          <Skeleton className="-ml-2 h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function EventListSkeleton({ count = 8, className }: EventListSkeletonProps) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:gap-6',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
