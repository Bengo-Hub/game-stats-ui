'use client';

import { cn } from '@/lib/utils';
import type { TeamPreview } from '@/types';
import { Users } from 'lucide-react';

// Colorful gradient backgrounds for team avatars
const AVATAR_COLORS = [
  'bg-gradient-to-br from-rose-400 to-red-500',
  'bg-gradient-to-br from-orange-400 to-amber-500',
  'bg-gradient-to-br from-emerald-400 to-green-500',
  'bg-gradient-to-br from-cyan-400 to-blue-500',
  'bg-gradient-to-br from-violet-400 to-purple-500',
  'bg-gradient-to-br from-pink-400 to-fuchsia-500',
  'bg-gradient-to-br from-indigo-400 to-blue-600',
  'bg-gradient-to-br from-teal-400 to-cyan-500',
  'bg-gradient-to-br from-yellow-400 to-orange-500',
  'bg-gradient-to-br from-lime-400 to-green-500',
];

// Generate consistent color based on team name
function getTeamColor(teamName: string, index: number): string {
  // Use a simple hash of the team name to get a consistent color
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash + index) % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
}

interface TeamAvatarStackProps {
  teams: TeamPreview[];
  maxDisplay?: number;
  totalCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TeamAvatarStack({
  teams,
  maxDisplay = 4,
  totalCount,
  size = 'md',
  className,
}: TeamAvatarStackProps) {
  const displayTeams = teams.slice(0, maxDisplay);
  const remaining = (totalCount ?? teams.length) - displayTeams.length;

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px]',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  const overlapClasses = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
  };

  if (displayTeams.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Users className="h-4 w-4" />
        <span className="text-sm">No teams yet</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex">
        {displayTeams.map((team, index) => {
          const bgColor = getTeamColor(team.name, index);
          return (
            <div
              key={team.id}
              className={cn(
                'relative rounded-full border-2 border-background flex items-center justify-center overflow-hidden ring-2 ring-background shadow-sm',
                sizeClasses[size],
                index > 0 && overlapClasses[size],
                !team.logoUrl && bgColor
              )}
              style={{ zIndex: displayTeams.length - index }}
              title={team.name}
            >
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-bold text-white drop-shadow-sm">
                  {team.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          );
        })}
        {remaining > 0 && (
          <div
            className={cn(
              'relative rounded-full border-2 border-background bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center font-bold text-white shadow-sm',
              sizeClasses[size],
              overlapClasses[size]
            )}
            style={{ zIndex: 0 }}
          >
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}
