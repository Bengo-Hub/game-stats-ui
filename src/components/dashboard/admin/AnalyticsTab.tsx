'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsApi } from '@/lib/api/analytics';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BarChart3, Bot, Layout, Loader2, Play, Search, Sparkle } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export function AnalyticsTab() {
    const [question, setQuestion] = React.useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'dashboards'],
        queryFn: () => analyticsApi.listDashboards(),
        staleTime: 1000 * 60 * 5,
    });

    const queryMutation = useMutation({
        mutationFn: (q: string) => analyticsApi.query({ question: q, userId: 'current' }),
        onSuccess: (data) => {
            console.log('Query result:', data);
            toast.success('Query successful');
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const handleAsk = (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim()) return;
        queryMutation.mutate(question);
    };

    return (
        <div className="space-y-6">
            {/* AI Query Section */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkle className="h-5 w-5 text-primary" />
                        <CardTitle>AI Data Assistant</CardTitle>
                    </div>
                    <CardDescription>
                        Ask questions about your tournament data using natural language.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAsk} className="flex gap-2">
                        <div className="relative flex-1">
                            <Bot className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="e.g., Which team has the most goals in the Open division?"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" disabled={queryMutation.isPending || !question.trim()}>
                            {queryMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Query
                                </>
                            )}
                        </Button>
                    </form>

                    {queryMutation.data && (
                        <div className="mt-4 p-4 rounded-lg bg-background border space-y-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <Search className="h-3 w-3" />
                                Result
                            </div>
                            <p className="text-sm font-medium">{queryMutation.data.explanation}</p>
                            {queryMutation.data.results.length > 0 && (
                                <div className="overflow-x-auto border rounded-md">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted uppercase text-[10px]">
                                            <tr>
                                                {Object.keys(queryMutation.data.results[0]).map(k => (
                                                    <th key={k} className="px-3 py-2 font-bold">{k}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {queryMutation.data.results.map((row, i) => (
                                                <tr key={i} className="border-t">
                                                    {Object.values(row).map((v: any, j) => (
                                                        <td key={j} className="px-3 py-2">{String(v)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dashboards Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : data?.dashboards.map((db) => (
                    <Card key={db.id} className="hover:border-primary/30 transition-colors">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Layout className="h-8 w-8 text-muted-foreground/50" />
                                <div className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase">
                                    {db.status}
                                </div>
                            </div>
                            <CardTitle className="text-lg pt-2">{db.title}</CardTitle>
                            <CardDescription>Superset Integrated Dashboard</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full" asChild>
                                <a href={`/admin/dashboards/${db.id}`} target="_blank" rel="noopener noreferrer">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Open Dashboard
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {!isLoading && (!data?.dashboards || data.dashboards.length === 0) && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                        <Layout className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="font-bold">No Dashboards Available</h3>
                        <p className="text-sm text-muted-foreground">Contact your data administrator to provision Superset dashboards.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AnalyticsTab;
