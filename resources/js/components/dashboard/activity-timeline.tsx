import { Activity, MessageSquare, Plus, RefreshCw, Ticket, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// --- TYPE DEFINITIONS ---

interface TicketTimeline {
    id: number;
    ticket_id: string;
    user_id: number;
    event: string;
    description: string;
    created_at: string;
    ticket: {
        id: string;
        code: string;
        title: string;
    } | null;
    user: {
        id: number;
        name: string;
    } | null;
}

interface ActivityTimelineProps {
    activity?: TicketTimeline[];
}

// --- CONFIGURATIONS ---

const EVENT_CONFIG: Record<string, { icon: typeof Activity; className: string; iconClassName: string }> = {
    created: { 
        icon: Plus, 
        className: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800', 
        iconClassName: 'text-emerald-600 dark:text-emerald-400' 
    },
    assigned: { 
        icon: User, 
        className: 'bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:border-blue-800', 
        iconClassName: 'text-blue-600 dark:text-blue-400' 
    },
    status_changed: { 
        icon: RefreshCw, 
        className: 'bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800', 
        iconClassName: 'text-amber-600 dark:text-amber-400' 
    },
    comment_added: { 
        icon: MessageSquare, 
        className: 'bg-pink-50 border-pink-200 dark:bg-pink-950/60 dark:border-pink-800', 
        iconClassName: 'text-pink-600 dark:text-pink-400' 
    },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDate(dateStr);
}

// --- COMPONENTS ---

export function RecentActivitySkeleton() {
    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-xs h-full">
            <CardHeader>
                <Skeleton className="h-6 w-36 mb-1" />
                <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
                <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-muted">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="relative">
                            <Skeleton className="absolute -left-7.5 top-1 h-5 w-5 rounded-full border border-background bg-muted" />
                            <div className="space-y-2 pl-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function RecentActivityCard({ activity }: ActivityTimelineProps) {
    if (!activity) return null;

    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-xs h-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-foreground">Activity Timeline</CardTitle>
                <CardDescription>Live timeline of recent ticket events</CardDescription>
            </CardHeader>
            <CardContent>
                {activity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="p-3 bg-muted rounded-full text-muted-foreground mb-2">
                            <Activity className="size-5" />
                        </div>
                        <p className="text-xs font-medium text-foreground">No recent activity</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">Timeline events will appear as tickets progress.</p>
                    </div>
                ) : (
                    <div className="max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        <div className="relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border pb-1">
                            {activity.map((timeline) => {
                                const config = EVENT_CONFIG[timeline.event] || {
                                    icon: Activity,
                                    className: 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800',
                                    iconClassName: 'text-slate-600 dark:text-slate-400',
                                };
                                const EventIcon = config.icon;

                                return (
                                    <div key={timeline.id} className="relative group text-sm pl-8 pb-5 last:pb-0">
                                        <div
                                            className={`absolute left-0.5 top-0.5 flex size-5 items-center justify-center rounded-full border shadow-xs group-hover:scale-105 transition-transform duration-200 z-10 ${config.className}`}
                                        >
                                            <EventIcon className={`size-3 ${config.iconClassName}`} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-muted-foreground">
                                                <span className="font-semibold text-foreground">{timeline.user?.name || 'System'}</span>{' '}
                                                {timeline.description}
                                            </div>
                                            {timeline.ticket && (
                                                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 font-medium hover:text-foreground transition-colors">
                                                    <Ticket className="size-3 flex-shrink-0" />
                                                    <span className="truncate max-w-[200px]">
                                                        #{timeline.ticket.code}: {timeline.ticket.title}
                                                    </span>
                                                </div>
                                            )}
                                            <span className="text-[10px] text-muted-foreground block font-normal">
                                                {formatRelativeTime(timeline.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
