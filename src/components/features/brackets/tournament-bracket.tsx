'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { BracketNode, Bracket, Game, DivisionPool } from '@/types';
import { format, parseISO } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';

// ============================================
// Types
// ============================================

interface BracketMatchProps {
  node: BracketNode;
  game?: Game;
  onMatchClick?: (node: BracketNode) => void;
  isHighlighted?: boolean;
}

interface BracketRound {
  name: string;
  games: Game[];
  position: number; // For ordering (finals = highest)
}

// ============================================
// Game-Based Bracket Match Card
// ============================================

function GameBracketMatch({ game, isHighlighted }: { game: Game; isHighlighted?: boolean }) {
  const homeWinner = (game.status === 'finished' || game.status === 'ended') && game.homeTeamScore > game.awayTeamScore;
  const awayWinner = (game.status === 'finished' || game.status === 'ended') && game.awayTeamScore > game.homeTeamScore;
  const isLive = game.status === 'in_progress';
  const isEnded = game.status === 'finished' || game.status === 'ended';

  return (
    <Link href={`/live/${game.id}`}>
      <Card
        className={cn(
          'w-64 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50',
          isHighlighted && 'ring-2 ring-primary',
          isLive && 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20'
        )}
      >
        <CardContent className="p-0">
          {/* Game Info Header */}
          <div className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {game.gameRound && (
                <span className="font-medium uppercase">{game.gameRound.name}</span>
              )}
              {game.name && !game.name.includes('vs') && (
                <span className="bg-muted px-1.5 py-0.5 rounded">{game.name}</span>
              )}
            </div>
            {isLive && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white animate-pulse">
                LIVE
              </span>
            )}
            {isEnded && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                ENDED
              </span>
            )}
          </div>

          {/* Teams */}
          <div className="p-2 space-y-1">
            {/* Home Team */}
            <div
              className={cn(
                'flex items-center justify-between px-2 py-2 rounded transition-colors',
                homeWinner ? 'bg-primary/10' : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {game.homeTeam?.logoUrl ? (
                  <img
                    src={game.homeTeam.logoUrl}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: game.homeTeam?.primaryColor || '#6366f1' }}
                  >
                    {game.homeTeam?.name?.charAt(0) || 'H'}
                  </div>
                )}
                <span className={cn('text-sm truncate', homeWinner && 'font-semibold')}>
                  {game.homeTeam?.name || 'TBD'}
                </span>
              </div>
              <span className={cn(
                'font-mono font-bold text-lg min-w-[2rem] text-right',
                homeWinner && 'text-primary'
              )}>
                {game.status === 'scheduled' ? '-' : game.homeTeamScore}
              </span>
            </div>

            {/* Away Team */}
            <div
              className={cn(
                'flex items-center justify-between px-2 py-2 rounded transition-colors',
                awayWinner ? 'bg-primary/10' : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {game.awayTeam?.logoUrl ? (
                  <img
                    src={game.awayTeam.logoUrl}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: game.awayTeam?.primaryColor || '#f43f5e' }}
                  >
                    {game.awayTeam?.name?.charAt(0) || 'A'}
                  </div>
                )}
                <span className={cn('text-sm truncate', awayWinner && 'font-semibold')}>
                  {game.awayTeam?.name || 'TBD'}
                </span>
              </div>
              <span className={cn(
                'font-mono font-bold text-lg min-w-[2rem] text-right',
                awayWinner && 'text-primary'
              )}>
                {game.status === 'scheduled' ? '-' : game.awayTeamScore}
              </span>
            </div>
          </div>

          {/* Footer with date/time and field */}
          <div className="px-3 py-2 border-t bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(parseISO(game.scheduledTime), 'MMM d')}
              {' '}
              {format(parseISO(game.scheduledTime), 'HH:mm')}
            </span>
            {game.fieldLocation && (
              <span className="flex items-center gap-1 truncate max-w-[100px]">
                <MapPin className="w-3 h-3" />
                {game.fieldLocation.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================
// Bracket Column Component
// ============================================

interface BracketColumnProps {
  roundName: string;
  games: Game[];
  position: number;
  totalRounds: number;
}

function BracketColumn({ roundName, games, position, totalRounds }: BracketColumnProps) {
  // Calculate vertical spacing based on position (later rounds have more space)
  const gapMultiplier = Math.pow(2, position);

  return (
    <div className="flex flex-col items-center min-w-[280px]">
      <h3 className="text-sm font-semibold text-foreground mb-4 sticky top-0 bg-background py-2 px-4 rounded-lg border">
        {roundName}
      </h3>
      <div
        className="flex flex-col items-center"
        style={{ gap: `${Math.max(1, gapMultiplier * 0.5)}rem` }}
      >
        {games.length > 0 ? (
          games.map((game) => (
            <div key={game.id} className="relative">
              <GameBracketMatch game={game} />
              {/* Connector lines would go here for visual bracket */}
            </div>
          ))
        ) : (
          <Card className="w-64 p-4 text-center text-muted-foreground">
            <p className="text-sm">No matches scheduled</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================
// Games-Based Tournament Bracket
// ============================================

interface GamesBracketProps {
  games: Game[];
  rounds?: DivisionPool[];
  className?: string;
}

export function GamesBracket({ games, rounds, className }: GamesBracketProps) {
  // Organize games by round type/name
  const bracketRounds = React.useMemo(() => {
    const roundMap = new Map<string, BracketRound>();

    // Define round order (finals is highest/last, quarters is first)
    const roundPriority: Record<string, number> = {
      'quarterfinal': 0,
      'quarter': 0,
      'quarter-final': 0,
      'quarter final': 0,
      'quater finals': 0, // Handle typo
      'semifinal': 1,
      'semi': 1,
      'semi-final': 1,
      'semi final': 1,
      'semi-finals': 1,
      'final': 2,
      'finals': 2,
      'third': 1.5, // Third place match
      'third place': 1.5,
      '3rd place': 1.5,
    };

    games.forEach(game => {
      const roundName = game.gameRound?.name?.toLowerCase() || 'unknown';
      const roundType = game.gameRound?.roundType?.toLowerCase() || '';

      // Determine position based on name or type
      let position = -1;
      for (const [key, priority] of Object.entries(roundPriority)) {
        if (roundName.includes(key) || roundType.includes(key)) {
          position = Math.max(position, priority);
        }
      }

      // If no match found, use round number or default
      if (position === -1) {
        // Try to extract position from bracket/playoff type
        if (roundType === 'bracket' || roundType === 'playoff') {
          position = 0; // Earlier round
        } else {
          position = -1;
        }
      }

      const displayName = game.gameRound?.name || 'Bracket';
      const key = `${displayName}-${position}`;

      if (!roundMap.has(key)) {
        roundMap.set(key, {
          name: displayName,
          games: [],
          position: position,
        });
      }

      roundMap.get(key)!.games.push(game);
    });

    // Convert to array and sort by position
    return Array.from(roundMap.values())
      .filter(r => r.position >= 0) // Only include bracket rounds
      .sort((a, b) => a.position - b.position);
  }, [games]);

  if (bracketRounds.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p>No bracket games available</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto pb-4', className)}>
      <div className="flex items-start gap-8 p-4 min-w-max">
        {bracketRounds.map((round, idx) => (
          <BracketColumn
            key={round.name}
            roundName={round.name}
            games={round.games}
            position={idx}
            totalRounds={bracketRounds.length}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Tree-Based Bracket Match (Original Implementation)
// ============================================

function BracketMatch({ node, onMatchClick, isHighlighted }: BracketMatchProps) {
  const homeWinner = node.status === 'completed' && (node.homeScore ?? 0) > (node.awayScore ?? 0);
  const awayWinner = node.status === 'completed' && (node.awayScore ?? 0) > (node.homeScore ?? 0);

  return (
    <Card
      className={cn(
        'w-48 cursor-pointer transition-all hover:shadow-md',
        isHighlighted && 'ring-2 ring-primary',
        node.status === 'in_progress' && 'ring-2 ring-green-500'
      )}
      onClick={() => onMatchClick?.(node)}
    >
      <CardContent className="p-2 space-y-1">
        {/* Home Team */}
        <div
          className={cn(
            'flex items-center justify-between px-2 py-1.5 rounded text-sm',
            homeWinner ? 'bg-primary/10 font-semibold' : 'bg-muted/50'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {node.homeTeam?.primaryColor && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: node.homeTeam.primaryColor }}
              />
            )}
            <span className="truncate">
              {node.homeTeam?.name || 'TBD'}
            </span>
          </div>
          <span className={cn('font-mono ml-2', homeWinner && 'text-primary')}>
            {node.homeScore ?? '-'}
          </span>
        </div>

        {/* Away Team */}
        <div
          className={cn(
            'flex items-center justify-between px-2 py-1.5 rounded text-sm',
            awayWinner ? 'bg-primary/10 font-semibold' : 'bg-muted/50'
          )}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {node.awayTeam?.primaryColor && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: node.awayTeam.primaryColor }}
              />
            )}
            <span className="truncate">
              {node.awayTeam?.name || 'TBD'}
            </span>
          </div>
          <span className={cn('font-mono ml-2', awayWinner && 'text-primary')}>
            {node.awayScore ?? '-'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Tree-Based Bracket Column
// ============================================

interface TreeBracketColumnProps {
  nodes: BracketNode[];
  roundNumber: number;
  totalRounds: number;
  onMatchClick?: (node: BracketNode) => void;
  highlightedMatchId?: string;
}

function TreeBracketColumn({
  nodes,
  roundNumber,
  totalRounds,
  onMatchClick,
  highlightedMatchId,
}: TreeBracketColumnProps) {
  const roundNames: Record<number, string> = {
    1: 'Finals',
    2: 'Semi-Finals',
    3: 'Quarter-Finals',
    4: 'Round of 16',
    5: 'Round of 32',
  };

  const roundFromEnd = totalRounds - roundNumber + 1;
  const roundName = roundNames[roundFromEnd] || `Round ${roundNumber}`;
  const gap = Math.pow(2, totalRounds - roundNumber) * 2;

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        {roundName}
      </h3>
      <div
        className="flex flex-col items-center"
        style={{ gap: `${gap}rem` }}
      >
        {nodes.map((node) => (
          <BracketMatch
            key={node.id}
            node={node}
            onMatchClick={onMatchClick}
            isHighlighted={highlightedMatchId === node.id}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Tree-Based Tournament Bracket (Original)
// ============================================

interface TournamentBracketProps {
  bracket: Bracket;
  onMatchClick?: (node: BracketNode) => void;
  highlightedMatchId?: string;
  className?: string;
}

function flattenBracketByRound(
  node: BracketNode,
  result: Map<number, BracketNode[]> = new Map()
): Map<number, BracketNode[]> {
  const roundNodes = result.get(node.round) || [];
  roundNodes.push(node);
  result.set(node.round, roundNodes);

  if (node.children) {
    for (const child of node.children) {
      flattenBracketByRound(child, result);
    }
  }

  return result;
}

export function TournamentBracket({
  bracket,
  onMatchClick,
  highlightedMatchId,
  className,
}: TournamentBracketProps) {
  const roundsMap = React.useMemo(
    () => flattenBracketByRound(bracket.bracketTree),
    [bracket.bracketTree]
  );

  const rounds = Array.from(roundsMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([round, nodes]) => ({
      round,
      nodes: nodes.sort((a, b) => a.position - b.position),
    }));

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="flex items-start gap-8 p-4 min-w-max">
        {rounds.map(({ round, nodes }) => (
          <TreeBracketColumn
            key={round}
            nodes={nodes}
            roundNumber={round}
            totalRounds={bracket.totalRounds}
            onMatchClick={onMatchClick}
            highlightedMatchId={highlightedMatchId}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Simple Bracket (Mobile-Friendly)
// ============================================

interface SimpleBracketProps {
  bracket: Bracket;
  onMatchClick?: (node: BracketNode) => void;
  className?: string;
}

export function SimpleBracket({ bracket, onMatchClick, className }: SimpleBracketProps) {
  const roundsMap = flattenBracketByRound(bracket.bracketTree);

  const rounds = Array.from(roundsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([round, nodes]) => ({
      round,
      nodes: nodes.sort((a, b) => a.position - b.position),
    }));

  const roundNames: Record<number, string> = {
    1: 'Finals',
    2: 'Semi-Finals',
    3: 'Quarter-Finals',
    4: 'Round of 16',
  };

  return (
    <div className={cn('space-y-6', className)}>
      {rounds.map(({ round, nodes }) => {
        const roundFromEnd = bracket.totalRounds - round + 1;
        const roundName = roundNames[roundFromEnd] || `Round ${round}`;

        return (
          <div key={round}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {roundName}
            </h3>
            <div className="space-y-2">
              {nodes.map((node) => (
                <BracketMatch
                  key={node.id}
                  node={node}
                  onMatchClick={onMatchClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TournamentBracket;
