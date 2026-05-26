import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, LifeBuoy, AlertCircle, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ticketsRoute from '@/routes/tickets';

interface Category {
    id: string;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    category: Category | null;
    assignee: User | null;
}

interface PaginatedData<T> {
    data: T[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    tickets: PaginatedData<Ticket>;
    filters: {
        search: string | null;
        status: string | null;
        priority: string | null;
    };
}

export default function TicketsIndex({ tickets, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [priority, setPriority] = useState(filters.priority || 'all');

    // Run search and filters update on value change
    const applyFilters = () => {
        router.get(
            ticketsRoute.index.url(),
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
                priority: priority !== 'all' ? priority : undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    // Trigger filters on selection changes
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search, status, priority]);

    const getStatusIcon = (status: Ticket['status']) => {
        switch (status) {
            case 'open':
                return <AlertCircle className="size-3.5" />;
            case 'in_progress':
                return <Clock className="size-3.5" />;
            case 'resolved':
                return <CheckCircle2 className="size-3.5" />;
            case 'closed':
                return <CheckCircle2 className="size-3.5" />;
            default:
                return <Clock className="size-3.5" />;
        }
    };

    const getStatusStyle = (status: Ticket['status']) => {
        switch (status) {
            case 'open':
                return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/10';
            case 'in_progress':
                return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/10';
            case 'resolved':
                return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10';
            case 'closed':
                return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/10';
            default:
                return '';
        }
    };

    const getPriorityStyle = (priority: Ticket['priority']) => {
        switch (priority) {
            case 'low':
                return 'bg-slate-500/10 text-slate-500';
            case 'medium':
                return 'bg-blue-500/10 text-blue-500';
            case 'high':
                return 'bg-orange-500/10 text-orange-500';
            case 'critical':
                return 'bg-red-500/10 text-red-500 font-semibold animate-pulse';
            default:
                return '';
        }
    };

    return (
        <>
            <Head title="My Support Tickets" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Support Tickets"
                        description="View, track, and submit your help desk tickets."
                    />

                    <Button asChild className="w-full sm:w-auto shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99]">
                        <Link href={ticketsRoute.create.url()} className="flex items-center gap-2">
                            <Plus className="size-4" />
                            New Ticket
                        </Link>
                    </Button>
                </div>

                {/* Filters Board */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/40 border border-border p-4 rounded-xl">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search tickets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="w-[140px]">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-[140px]">
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Priorities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Tickets list */}
                {tickets.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-16 text-center bg-card/25">
                        <LifeBuoy className="size-12 text-muted-foreground/60 mb-4" />
                        <h3 className="text-lg font-semibold">No tickets found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1 mb-6">
                            {search || status !== 'all' || priority !== 'all'
                                ? 'Try adjusting your filters or search terms.'
                                : "You haven't submitted any support requests yet."}
                        </p>
                        {!search && status === 'all' && priority === 'all' && (
                            <Button asChild>
                                <Link href={ticketsRoute.create.url()}>Create your first ticket</Link>
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            {tickets.data.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={ticketsRoute.show.url(ticket.id)}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border bg-card/60 backdrop-blur-md p-5 transition-all duration-200 hover:border-sidebar-border hover:shadow-sm"
                                >
                                    <div className="space-y-2 max-w-2xl">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-muted-foreground font-mono">
                                                #{ticket.id.substring(0, 8)}
                                            </span>
                                            <Badge variant="outline" className="px-2 py-0 text-xs">
                                                {ticket.category?.name || 'General'}
                                            </Badge>
                                            <Badge variant="outline" className={`px-2 py-0 text-xs ${getPriorityStyle(ticket.priority)}`}>
                                                {ticket.priority}
                                            </Badge>
                                        </div>

                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
                                            {ticket.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {ticket.description}
                                        </p>
                                    </div>

                                    <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                                        <div className="flex flex-col items-start sm:items-end gap-1.5">
                                            <Badge className={`flex items-center gap-1 font-medium capitalize text-xs ${getStatusStyle(ticket.status)}`}>
                                                {getStatusIcon(ticket.status)}
                                                {ticket.status.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                Updated {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <ArrowRight className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-1 hidden sm:block" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination component */}
                        <div className="mt-4">
                            <Pagination links={tickets.links} />
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

TicketsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Tickets',
            href: '/tickets',
        },
    ],
};
