import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PriorityBreakdownProps {
    breakdown?: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
}

export function PriorityBreakdownSkeleton() {
    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-xs">
            <CardHeader>
                <Skeleton className="h-6 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-8" />
                        </div>
                        <Skeleton className="h-2.5 w-full rounded-full" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export function PriorityBreakdownCard({ breakdown }: PriorityBreakdownProps) {
    if (!breakdown) return null;

    const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);

    const priorities = [
        { key: 'critical', label: 'Critical', color: 'bg-red-500', count: breakdown.critical },
        { key: 'high', label: 'High', color: 'bg-orange-500', count: breakdown.high },
        { key: 'medium', label: 'Medium', color: 'bg-sky-500', count: breakdown.medium },
        { key: 'low', label: 'Low', color: 'bg-slate-400', count: breakdown.low },
    ];

    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-xs">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground">Priority Breakdown</CardTitle>
                <CardDescription>Visual summary of active workloads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {priorities.map((p) => {
                    const percentage = total > 0 ? (p.count / total) * 100 : 0;
                    return (
                        <div key={p.key} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-muted-foreground">{p.label}</span>
                                <span className="font-semibold text-foreground">
                                    {p.count} <span className="text-xs text-muted-foreground font-normal">({Math.round(percentage)}%)</span>
                                </span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className={`h-full ${p.color} rounded-full`} style={{ width: `${percentage}%` }} />
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
