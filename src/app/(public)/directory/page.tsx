'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton } from '@/components/ui/skeleton';
import { publicApi, type ListTeamsParams } from '@/lib/api';
import type { Event, Team } from '@/types';
import {
  AlertCircle,
  ChevronDown,
  Crown,
  Filter,
  Heart,
  MapPin,
  RefreshCw,
  Trophy,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

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
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [divisionFilter, setDivisionFilter] = React.useState('All Divisions');
  const [selectedEventId, setSelectedEventId] = React.useState<string>('all');
  const [totalTeams, setTotalTeams] = React.useState(0);
  const [offset, setOffset] = React.useState(0);

  // Fetch events for filter
  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await publicApi.listEvents({ limit: 100 });
        setEvents(data.data || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch teams from API
  const fetchTeams = React.useCallback(async (reset = true) => {
    setLoading(true);
    setError(null);

    try {
      const currentOffset = reset ? 0 : offset;
      const params: ListTeamsParams = {
        limit: 10,
        offset: currentOffset,
      };

      // Apply search filter
      if (search) {
        params.search = search;
      }

      // Apply division filter (backend-side)
      if (divisionFilter !== 'All Divisions') {
        params.division = divisionFilter;
      }

      // Apply event filter
      if (selectedEventId !== 'all') {
        params.eventId = selectedEventId;
      }

      const response = await publicApi.listTeams(params);

      // Transform to display format
      const displayTeams: DisplayTeam[] = response.data.map((team) => ({
        ...team,
        division: team.divisionName || undefined,
        location: team.locationName || 'Location TBD',
      }));

      setTeams(displayTeams);
      setTotalTeams(response.total);
      if (reset) {
        setOffset(0);
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [search, divisionFilter, selectedEventId, offset]);

  // Handle search with debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTeams(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, divisionFilter, selectedEventId]);

  // Handle page change
  React.useEffect(() => {
    fetchTeams(false);
  }, [offset]);

  const handleRefresh = () => fetchTeams(true);
  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
    // fetchTeams will be triggered by useEffect
  };

  const filteredTeams = teams; // Filtering now happens on backend

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
        <div className="flex flex-wrap gap-2">
          {/* Event Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[160px] justify-between">
                <Trophy className="h-4 w-4 mr-2 text-amber-500" />
                <span className="truncate max-w-[120px]">
                  {selectedEventId === 'all'
                    ? 'All Events'
                    : events.find((e) => e.id === selectedEventId)?.name || 'Select Event'}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto w-[240px]">
              <DropdownMenuItem onClick={() => setSelectedEventId('all')}>
                All Events
              </DropdownMenuItem>
              {events.map((event) => (
                <DropdownMenuItem
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{event.name}</span>
                    <span className="text-xs text-muted-foreground">{event.year}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Division Filter */}
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
            onClick={handleRefresh}
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
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {/* Results count */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Showing {teams.length} of {totalTeams} team{totalTeams !== 1 ? 's' : ''}
        </div>
        {selectedEventId !== 'all' && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
            Filtered by Event
          </Badge>
        )}
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
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teams.map((team) => (
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
                            <span className="text-sm truncate font-medium">{team.captain.name}</span>
                          </div>
                        )}
                        {team.spiritCaptain && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs font-medium">
                              <Heart className="h-3 w-3" />
                              S
                            </span>
                            <span className="text-sm truncate font-medium text-muted-foreground italic">
                              {team.spiritCaptain.name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Player Count */}
                    <div className="flex items-center gap-2 pt-3 border-t text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{team.playersCount ?? 0} player{team.playersCount !== 1 ? 's' : ''}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            total={totalTeams}
            limit={10}
            offset={offset}
            onPageChange={handlePageChange}
            className="mt-8"
          />
        </div>
      )}
    </div>
  );
}
