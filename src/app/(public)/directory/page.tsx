'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  MapPin,
  ChevronDown,
  Filter,
  RefreshCw,
  AlertCircle,
  Crown,
  Heart,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { publicApi, type ListTeamsParams } from '@/lib/api';
import type { Team } from '@/types';

// Extended team type for display
interface DisplayTeam extends Team {
  location?: string;
  country?: string;
  division?: string;
  playersCount?: number;
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  spiritAvg?: number;
}

const divisions = ['All Divisions', 'Open', 'Womens', 'Mixed', 'Masters'];

// Generate a consistent color based on team name
const getTeamColor = (teamName: string): string => {
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];
  const hash = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getDivisionColor = (division: string) => {
  const colors: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Womens: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    womens: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    Mixed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    mixed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    Masters: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    masters: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return colors[division] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
};

export default function PublicTeamsPage() {
  const [teams, setTeams] = React.useState<DisplayTeam[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [divisionFilter, setDivisionFilter] = React.useState('All Divisions');

  // Fetch teams from API
  const fetchTeams = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: ListTeamsParams = {};

      // Apply search filter
      if (search) {
        params.search = search;
      }

      const data = await publicApi.listTeams(params);

      // Transform to display format - use actual API response data
      const displayTeams: DisplayTeam[] = data.map((team) => ({
        ...team,
        // Use actual division name from API response
        division: team.divisionName || undefined,
        location: team.locationName || 'Location TBD',
        // playersCount is now included in API response
      }));

      setTeams(displayTeams);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTeams();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchTeams]);

  // Client-side division filtering
  const filteredTeams = React.useMemo(() => {
    if (divisionFilter === 'All Divisions') return teams;
    return teams.filter(
      (team) => team.division?.toLowerCase() === divisionFilter.toLowerCase()
    );
  }, [teams, divisionFilter]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Teams Directory
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse teams from around the world. Find team profiles, rosters, and statistics.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search teams..."
          className="sm:max-w-md flex-1"
        />
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[140px] justify-between">
                <Filter className="h-4 w-4 mr-2" />
                {divisionFilter}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {divisions.map((division) => (
                <DropdownMenuItem
                  key={division}
                  onClick={() => setDivisionFilter(division)}
                >
                  {division}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchTeams}
            disabled={loading}
            title="Refresh teams"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTeams}>
            Retry
          </Button>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground mb-4">
        {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} found
      </div>

      {/* Teams Grid */}
      {loading && teams.length === 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No teams found</h2>
          <p className="text-muted-foreground">
            {search || divisionFilter !== 'All Divisions'
              ? 'Try adjusting your search or filters'
              : 'Check back later for team listings'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTeams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5">
                  {/* Team Avatar */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center text-white text-xl font-bold shrink-0"
                      style={{ backgroundColor: team.primaryColor || getTeamColor(team.name) }}
                    >
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        team.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {team.name}
                      </h3>
                      {team.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{team.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Division Badge */}
                  {team.division && (
                    <div className="mb-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getDivisionColor(team.division)}`}
                      >
                        {team.division}
                      </span>
                    </div>
                  )}

                  {/* Captains Section */}
                  {(team.captain || team.spiritCaptain) && (
                    <div className="space-y-1.5 mb-3">
                      {team.captain && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium">
                            <Crown className="h-3 w-3" />
                            C
                          </span>
                          <span className="text-sm truncate">{team.captain.name}</span>
                        </div>
                      )}
                      {team.spiritCaptain && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs font-medium">
                            <Heart className="h-3 w-3" />
                            S
                          </span>
                          <span className="text-sm truncate">{team.spiritCaptain.name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Player Count */}
                  <div className="flex items-center gap-2 pt-3 border-t text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{team.playersCount ?? 0} players</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
