'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { publicApi } from '@/lib/api/public';
import { useQuery } from '@tanstack/react-query';
import { Filter, X } from 'lucide-react';

interface AnalyticsFiltersProps {
    onFilterChange: (filters: { eventId?: string; divisionId?: string; teamId?: string }) => void;
    selectedEventId?: string;
    selectedDivisionId?: string;
    selectedTeamId?: string;
}

export function AnalyticsFilters({
    onFilterChange,
    selectedEventId,
    selectedDivisionId,
    selectedTeamId,
}: AnalyticsFiltersProps) {
    // Fetch events
    const { data: eventsResponse } = useQuery({
        queryKey: ['events', 'list', 'filters'],
        queryFn: () => publicApi.listEvents({ limit: 100 }),
    });
    const events = eventsResponse?.data || [];

    // Fetch divisions for selected event
    const { data: divisions = [] } = useQuery({
        queryKey: ['events', selectedEventId, 'divisions'],
        queryFn: () => publicApi.getEventDivisions(selectedEventId!),
        enabled: !!selectedEventId,
    });

    // Fetch teams for selected event/division
    const { data: teamsResponse } = useQuery({
        queryKey: ['teams', 'list', selectedEventId, selectedDivisionId],
        queryFn: () => publicApi.listTeams({
            eventId: selectedEventId,
            division: selectedDivisionId,
            limit: 100
        }),
        enabled: !!selectedEventId,
    });
    const teams = teamsResponse?.data || [];

    const handleReset = () => {
        onFilterChange({ eventId: '', divisionId: '', teamId: '' });
    };

    return (
        <Card className="bg-muted/30 border-none shadow-none">
            <CardContent className="p-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex items-center gap-2 mb-1 mr-2 text-sm font-medium text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span>Filters:</span>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground ml-1">Event</span>
                        <Select
                            value={selectedEventId || 'all'}
                            onValueChange={(val) => onFilterChange({ eventId: val === 'all' ? '' : val, divisionId: '', teamId: '' })}
                        >
                            <SelectTrigger className="w-[180px] bg-background">
                                <SelectValue placeholder="All Events" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                {events.map((e) => (
                                    <SelectItem key={e.id} value={e.id}>
                                        {e.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground ml-1">Division</span>
                        <Select
                            disabled={!selectedEventId}
                            value={selectedDivisionId || 'all'}
                            onValueChange={(val) => onFilterChange({ eventId: selectedEventId, divisionId: val === 'all' ? '' : val, teamId: '' })}
                        >
                            <SelectTrigger className="w-[180px] bg-background">
                                <SelectValue placeholder="All Divisions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Divisions</SelectItem>
                                {divisions.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground ml-1">Team</span>
                        <Select
                            disabled={!selectedEventId}
                            value={selectedTeamId || 'all'}
                            onValueChange={(val) => onFilterChange({ eventId: selectedEventId, divisionId: selectedDivisionId, teamId: val === 'all' ? '' : val })}
                        >
                            <SelectTrigger className="w-[180px] bg-background">
                                <SelectValue placeholder="All Teams" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Teams</SelectItem>
                                {teams.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(selectedEventId || selectedDivisionId || selectedTeamId) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-10 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
