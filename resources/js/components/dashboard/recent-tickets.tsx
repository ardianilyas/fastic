import { Link } from '@inertiajs/react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Inbox, Plus, User, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import ticketsRoute from '@/routes/tickets';
import adminTicketsRoute from '@/routes/admin/tickets';

// --- TYPE DEFINITIONS ---

interface Category {
    id: string;
    name: string;
}

interface UserType {
    id: number;
    name: string;
}

interface TicketType {
    id: string;
    code: string;
    title: string;
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category_id: string;
    assigned_to: number | null;
    created_at: string;
    category: Category | null;
    assignee: UserType | null;
}

interface RecentTicketsProps {
    tickets?: TicketType[];
    isAdmin: boolean;
}

// --- CONFIGURATIONS ---

const STATUS_CONFIG = {
    open: {
        label: 'Open',
        icon: AlertCircle,
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    in_progress: {
        label: 'In Progress',
        icon: Clock,
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    waiting: {
        label: 'Waiting',
        icon: Clock,
        bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    resolved: {
        label: 'Resolved',
        icon: CheckCircle2,
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    closed: {
        label: 'Closed',
        icon: XCircle,
        bg: 'bg-slate-500/10 text-slate-500',
    },
} as const;

const PRIORITY_CONFIG = {
    low: { label: 'Low', style: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
    medium: { label: 'Medium', style: 'text-sky-600 bg-sky-500/10 border-sky-500/20 dark:text-sky-400' },
    high: { label: 'High', style: 'text-orange-600 bg-orange-500/10 border-orange-500/20 dark:text-orange-400' },
    critical: { label: 'Critical', style: 'text-red-600 bg-red-500/10 border-red-500/20 font-semibold dark:text-red-400 animate-pulse' },
} as const;

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- COMPONENTS ---

export function RecentTicketsSkeleton() {
    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-xs flex-1">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="space-y-1">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-border/50 pb-3.5 last:border-0 last:pb-0">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-12" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-16 rounded-full" />
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export function RecentTicketsCard({ tickets, isAdmin }: RecentTicketsProps) {
    if (!tickets) return null;

    const showRoute = isAdmin ? adminTicketsRoute.show : ticketsRoute.show;
    const indexRoute = isAdmin ? adminTicketsRoute.index : ticketsRoute.index;

    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-xs flex-1 flex flex-col justify-between">
            <div>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold text-foreground">Recent Support Tickets</CardTitle>
                        <CardDescription>
                            {isAdmin ? 'Overview of lately submitted requests' : 'Your latest support ticket updates'}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex text-xs h-8">
                        <Link href={indexRoute.url()}>
                            View All
                            <ArrowRight className="ml-1.5 size-3.5" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {tickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="p-3 bg-muted rounded-full text-muted-foreground mb-3">
                                <Inbox className="size-6" />
                            </div>
                            <p className="text-sm font-medium text-foreground">No tickets yet</p>
                            <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                {isAdmin ? 'No tickets found in the system.' : 'You have not submitted any support tickets yet.'}
                            </p>
                            {!isAdmin && (
                                <Button size="sm" asChild className="mt-4 flex items-center gap-1.5 h-8 text-xs">
                                    <Link href={ticketsRoute.create.url()}>
                                        <Plus className="size-3.5" />
                                        Create Ticket
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {tickets.map((ticket) => {
                                const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                                const priority = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
                                const StatusIcon = status.icon;

                                return (
                                    <div
                                        key={ticket.id}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3.5 first:pt-0 last:pb-0 gap-3"
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-mono font-semibold text-muted-foreground">
                                                    #{ticket.code}
                                                </span>
                                                <Link
                                                    href={showRoute.url(ticket.id)}
                                                    className="font-medium text-sm text-foreground hover:text-primary transition-colors hover:underline truncate max-w-[280px]"
                                                >
                                                    {ticket.title}
                                                </Link>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                {ticket.category && (
                                                    <span className="bg-muted px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-400 font-medium">
                                                        {ticket.category.name}
                                                    </span>
                                                )}
                                                <span>•</span>
                                                <span>Submitted {formatDate(ticket.created_at)}</span>
                                                {isAdmin && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1 text-neutral-500">
                                                            <User className="size-3" />
                                                            {ticket.assignee?.name || 'Unassigned'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                            <Badge variant="outline" className={`text-xs gap-1 border-0 ${status.bg}`}>
                                                <StatusIcon className="size-3" />
                                                {status.label}
                                            </Badge>
                                            <Badge variant="outline" className={`text-xs ${priority.style}`}>
                                                {priority.label}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </div>
            {tickets.length > 0 && (
                <div className="px-6 pb-6 pt-2 block sm:hidden">
                    <Button variant="outline" size="sm" asChild className="w-full text-xs">
                        <Link href={indexRoute.url()}>
                            View All Tickets
                            <ArrowRight className="ml-1.5 size-3.5" />
                        </Link>
                    </Button>
                </div>
            )}
        </Card>
    );
}
