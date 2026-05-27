import { AlertCircle, CheckCircle2, Clock, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsProps {
    stats?: {
        total: number;
        open: number;
        in_progress: number;
        waiting: number;
        resolved: number;
        closed: number;
    };
}

export function StatsSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-sidebar-border/70 dark:border-sidebar-border shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-12 mb-1.5" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function StatsGrid({ stats }: StatsProps) {
    if (!stats) return null;

    const cards = [
        {
            title: 'Total Tickets',
            value: stats.total,
            description: 'All submitted tickets',
            icon: Ticket,
            color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
        },
        {
            title: 'Open Tickets',
            value: stats.open,
            description: 'Awaiting initial triage',
            icon: AlertCircle,
            color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
        },
        {
            title: 'In Progress',
            value: stats.in_progress,
            description: 'Actively being resolved',
            icon: Clock,
            color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
        },
        {
            title: 'Resolved',
            value: stats.resolved,
            description: 'Successfully completed',
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                    <Card
                        key={idx}
                        className="border-sidebar-border/70 dark:border-sidebar-border shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                            <div className={`p-1.5 rounded-lg ${card.color}`}>
                                <IconComponent className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-foreground">{card.value}</div>
                            <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
