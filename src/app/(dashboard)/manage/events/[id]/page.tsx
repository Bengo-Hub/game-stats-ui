'use client';

import { EditEventDialog } from '@/components/dashboard/events';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { eventsApi } from '@/lib/api/events';
import type { TeamPreview } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
    Calendar,
    ChevronRight,
    CircleDot,
    Flag,
    LayoutGrid,
    MapPin,
    Plus,
    RefreshCw,
    Settings,
    Trophy,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [editDialogOpen, setEditDialogOpen] = React.useState(false);

    const {
        data: event,
        isLoading: isLoadingEvent,
        isError: isErrorEvent,
        refetch: refetchEvent,
    } = useQuery({
        queryKey: ['events', eventId],
        queryFn: () => eventsApi.get(eventId),
        enabled: !!eventId,
    });

    const { data: divisions = [], isLoading: isLoadingDivisions } = useQuery({
        queryKey: ['events', eventId, 'divisions'],
        queryFn: () => eventsApi.getDivisions(eventId),
        enabled: !!eventId,
    });

    const { data: rounds = [], isLoading: isLoadingRounds } = useQuery({
        queryKey: ['events', eventId, 'rounds'],
        queryFn: () => eventsApi.getRounds(eventId),
        enabled: !!eventId,
    });

    if (isLoadingEvent) {
        return (
            <div className="space-y-6 pt-4">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <div className="grid gap-6 lg:grid-cols-4">
                    <Skeleton className="h-64 lg:col-span-1 rounded-2xl" />
                    <Skeleton className="h-64 lg:col-span-3 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (isErrorEvent || !event) {
        return (
            <div className="text-center py-20">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
                <p className="text-muted-foreground mb-8">This tournament might have been cancelled or the link is outdated.</p>
                <Button onClick={() => router.push('/manage/events')} size="lg">Back to Events</Button>
            </div>
        );
    }

    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);

    return (
        <div className="space-y-6 pt-4">
            {/* Header / Banner */}
            <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white min-h-[180px] flex flex-col justify-end relative">
                {event.bannerUrl && (
                    <div className="absolute inset-0 opacity-40">
                        <img src={event.bannerUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <CardContent className="relative p-6 sm:p-10 z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <Badge className="bg-primary/20 hover:bg-primary/30 text-primary-foreground border-primary/50 backdrop-blur-md">
                                {event.year} Tournament
                            </Badge>
                            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase italic">{event.name}</h1>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-300">
                                <span className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                                </span>
                                {event.location && (
                                    <span className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        {event.location.name}, {event.location.city}
                                    </span>
                                )}
                                <StatusBadge status={event.status} className="border-none bg-white/10 text-white" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-md" onClick={() => setEditDialogOpen(true)}>
                                <Settings className="h-4 w-4 mr-2" />
                                Manage
                            </Button>
                            <Button className="shadow-lg shadow-primary/20">
                                <LayoutGrid className="h-4 w-4 mr-2" />
                                Operations
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Stats & Metadata Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <EventStat icon={<Users />} label="Teams" value={event.teamsCount} />
                            <EventStat icon={<Calendar />} label="Games" value={event.gamesCount} />
                            <EventStat icon={<CircleDot />} label="Divs" value={divisions.length} />
                            <EventStat icon={<Flag />} label="Rounds" value={rounds.length} />
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {event.categories?.map(cat => (
                                <Badge key={cat} variant="secondary" className="capitalize px-3 py-1">
                                    {cat}
                                </Badge>
                            ))}
                        </CardContent>
                    </Card>

                    <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => refetchEvent()}>
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        Refresh Event Data
                    </Button>
                </div>

                {/* Tabbed Content Area */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList className="bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
                            <TabsTrigger value="divisions" className="rounded-lg">Divisions</TabsTrigger>
                            <TabsTrigger value="teams" className="rounded-lg">Teams</TabsTrigger>
                            <TabsTrigger value="rounds" className="rounded-lg">Rounds</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <Card className="rounded-2xl shadow-sm border-none bg-gradient-to-br from-card to-muted/20">
                                <CardHeader>
                                    <CardTitle>Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {event.description || 'No description provided for this event.'}
                                    </p>
                                </CardContent>
                            </Card>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <Card className="rounded-2xl shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-base font-bold">Recent Divisions</CardTitle>
                                        <Plus className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {divisions.slice(0, 3).map(div => (
                                            <div key={div.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                                        <CircleDot className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{div.name}</p>
                                                        <p className="text-xs text-muted-foreground uppercase">{div.divisionType}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        ))}
                                        {divisions.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground italic">No divisions added.</p>}
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-base font-bold">Management Links</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <QuickLink href={`/manage/events/${eventId}/spirit`} label="Spirit Dashboard" icon={<Trophy />} />
                                        <QuickLink href={`/manage/events/${eventId}/bracket`} label="Bracket Builder" icon={<LayoutGrid />} />
                                        <QuickLink href={`/manage/events/${eventId}/crew`} label="Crew Management" icon={<Users />} />
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="divisions">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {divisions.map(div => (
                                    <Card key={div.id} className="rounded-2xl hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg">{div.name}</CardTitle>
                                            <CardDescription>{div.divisionType}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button variant="secondary" className="w-full rounded-xl" asChild>
                                                <Link href={`/manage/events/${eventId}/divisions/${div.id}`}>
                                                    View Standings
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="teams">
                            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {event.teamPreview?.map((team: TeamPreview) => (
                                    <Link href={`/manage/teams/${team.id}`} key={team.id}>
                                        <Card className="rounded-2xl p-4 text-center hover:bg-muted/50 transition-colors border-dashed border-2">
                                            {team.logoUrl ? (
                                                <img src={team.logoUrl} className="w-12 h-12 rounded-full mx-auto mb-3 object-cover shadow-sm" alt="" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-bold">
                                                    {team.name[0]}
                                                </div>
                                            )}
                                            <p className="text-sm font-bold truncate">{team.name}</p>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="rounds">
                            <div className="space-y-4">
                                {rounds.map(round => (
                                    <div key={round.id} className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-black">
                                            {round.roundOrder}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold">{round.name}</h4>
                                            <p className="text-sm text-muted-foreground capitalize">{round.roundType} Round</p>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            {round.startDate && format(parseISO(round.startDate), 'MMM d')}
                                        </div>
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/manage/rounds/${round.id}`}>
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {event && (
                <EditEventDialog
                    event={event}
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    onSuccess={() => refetchEvent()}
                />
            )}
        </div>
    );
}

function EventStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="bg-background/60 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1 text-primary">
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-3.5 w-3.5' })}
                <span className="text-[10px] uppercase font-black tracking-tighter text-muted-foreground">{label}</span>
            </div>
            <div className="text-xl font-black">{value}</div>
        </div>
    );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    return (
        <Link href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-sm font-medium border border-transparent hover:border-muted-foreground/20">
            <div className="text-muted-foreground">
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-4 w-4' })}
            </div>
            {label}
        </Link>
    );
}
