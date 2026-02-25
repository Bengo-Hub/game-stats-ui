'use client';

import { AddCrewMemberDialog } from '@/components/dashboard/events/AddCrewMemberDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { eventsApi } from '@/lib/api/events';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail, Plus, Shield, ShieldCheck, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

export default function EventCrewPage() {
    const params = useParams();
    const eventId = params.id as string;
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const queryClient = useQueryClient();

    const { data: event, isLoading: isLoadingEvent } = useQuery({
        queryKey: ['events', eventId],
        queryFn: () => eventsApi.get(eventId),
        enabled: !!eventId,
    });

    const { data: crew, isLoading: isLoadingCrew } = useQuery({
        queryKey: ['events', eventId, 'crew'],
        queryFn: () => eventsApi.getEventCrew(eventId),
        enabled: !!eventId,
    });

    const removeMutation = useMutation({
        mutationFn: (userId: string) => eventsApi.removeEventCrewMember(eventId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId, 'crew'] });
            toast.success('Crew member removed successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to remove crew member');
        },
    });

    if (isLoadingEvent || isLoadingCrew) {
        return (
            <div className="space-y-6 pt-4">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-96 rounded-2xl" />
                    <Skeleton className="h-96 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <PageHeader
                    title={`${event?.name || 'Event'} Crew`}
                    description="Manage event administrators and scorekeepers."
                />
                <Button className="rounded-xl" onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Event Administrators */}
                <Card className="rounded-2xl shadow-sm border-none outline outline-1 outline-muted">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Event Administrators</CardTitle>
                        </div>
                        <Badge variant="secondary" className="rounded-lg">{crew?.admins?.length || 0}</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {crew?.admins?.map((admin: any) => (
                                <StaffMemberRow
                                    key={admin.id}
                                    user={admin}
                                    role="Event Admin"
                                    onRemove={() => removeMutation.mutate(admin.id)}
                                    isRemoving={removeMutation.isPending && removeMutation.variables === admin.id}
                                />
                            ))}
                            {(!crew?.admins || crew.admins.length === 0) && (
                                <EmptyStaffMessage message="No event administrators assigned." />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Scorekeepers */}
                <Card className="rounded-2xl shadow-sm border-none outline outline-1 outline-muted">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-blue-500" />
                            <CardTitle className="text-lg">Scorekeepers</CardTitle>
                        </div>
                        <Badge variant="secondary" className="rounded-lg">{crew?.scorekeepers?.length || 0}</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {crew?.scorekeepers?.map((sk: any) => (
                                <StaffMemberRow
                                    key={sk.id}
                                    user={sk}
                                    role="Scorekeeper"
                                    onRemove={() => removeMutation.mutate(sk.id)}
                                    isRemoving={removeMutation.isPending && removeMutation.variables === sk.id}
                                />
                            ))}
                            {(!crew?.scorekeepers || crew.scorekeepers.length === 0) && (
                                <EmptyStaffMessage message="No scorekeepers assigned." />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AddCrewMemberDialog
                eventId={eventId}
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
            />
        </div>
    );
}

function StaffMemberRow({ user, role, onRemove, isRemoving }: { user: any; role: string; onRemove: () => void; isRemoving: boolean }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl border bg-card/50 hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                    <h4 className="font-semibold text-sm">{user.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider h-5 rounded-md px-1.5 border-primary/20 bg-primary/5 text-primary">
                    {role}
                </Badge>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={onRemove}
                    disabled={isRemoving}
                >
                    {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Remove'}
                </Button>
            </div>
        </div>
    );
}

function EmptyStaffMessage({ message }: { message: string }) {
    return (
        <div className="py-10 text-center flex flex-col items-center justify-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground italic">{message}</p>
        </div>
    );
}
