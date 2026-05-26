import { Head, Link, router } from '@inertiajs/react';
import { Search, Inbox, AlertCircle, Clock, CheckCircle2, User, ArrowRight, RefreshCw, FolderSearch } from 'lucide-react';
import { useState, useEffect } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import adminTicketsRoute from '@/routes/admin/tickets';

interface Category {
    id: string;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    category: Category | null;
    user: User;
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
    stats: {
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
    };
    categories: Category[];
    admins: User[];
    filters: {
        search: string | null;
        status: string | null;
        priority: string | null;
        category_id: string | null;
        assigned_to: string | null;
    };
}

export default function AdminTicketsIndex({ tickets, stats, categories, admins, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [priority, setPriority] = useState(filters.priority || 'all');
    const [categoryId, setCategoryId] = useState(filters.category_id || 'all');
    const [assignedTo, setAssignedTo] = useState(filters.assigned_to || 'all');

    const applyFilters = () => {
        router.get(
            adminTicketsRoute.index.url(),
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
                priority: priority !== 'all' ? priority : undefined,
                category_id: categoryId !== 'all' ? categoryId : undefined,
                assigned_to: assignedTo !== 'all' ? assignedTo : undefined,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search, status, priority, categoryId, assignedTo]);

    const handleClearFilters = () => {
        setSearch('');
        setStatus('all');
        setPriority('all');
        setCategoryId('all');
        setAssignedTo('all');
    };

    const getStatusIcon = (status: Ticket['status']) => {
        switch (status) {
            case 'open':
                return <AlertCircle className="size-3.5" />;
            case 'in_progress':
                return <Clock className="size-3.5" />;
            case 'resolved':
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
            <Head title="Ticket Control Center" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Support Ticket Control Board"
                        description="Monitor, assign, and manage all support requests across Fastic."
                    />
                </div>

                {/* Counters / Stats cards */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                    {/* Total */}
                    <Card className="border border-border bg-card/65 shadow-xs rounded-xl">
                        <CardContent className="p-4 flex flex-col justify-center">
                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Tickets</span>
                            <span className="text-2xl font-bold mt-1 text-foreground">{stats.total}</span>
                        </CardContent>
                    </Card>

                    {/* Open */}
                    <Card className="border border-border bg-card/65 shadow-xs rounded-xl">
                        <CardContent className="p-4 flex flex-col justify-center">
                            <span className="text-xs text-blue-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-blue-500" />
                                Open
                            </span>
                            <span className="text-2xl font-bold mt-1 text-foreground">{stats.open}</span>
                        </CardContent>
                    </Card>

                    {/* In Progress */}
                    <Card className="border border-border bg-card/65 shadow-xs rounded-xl">
                        <CardContent className="p-4 flex flex-col justify-center">
                            <span className="text-xs text-amber-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                In Progress
                            </span>
                            <span className="text-2xl font-bold mt-1 text-foreground">{stats.in_progress}</span>
                        </CardContent>
                    </Card>

                    {/* Resolved */}
                    <Card className="border border-border bg-card/65 shadow-xs rounded-xl">
                        <CardContent className="p-4 flex flex-col justify-center">
                            <span className="text-xs text-emerald-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Resolved
                            </span>
                            <span className="text-2xl font-bold mt-1 text-foreground">{stats.resolved}</span>
                        </CardContent>
                    </Card>

                    {/* Closed */}
                    <Card className="border border-border bg-card/65 shadow-xs rounded-xl">
                        <CardContent className="p-4 flex flex-col justify-center">
                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-slate-500" />
                                Closed
                            </span>
                            <span className="text-2xl font-bold mt-1 text-foreground">{stats.closed}</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Board */}
                <div className="flex flex-col gap-2 bg-card/40 border border-border p-4 rounded-xl">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Search */}
                        <div className="relative lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by title, desc, user..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status: All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Status: All</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Priority: All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Priority: All</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category */}
                        <div>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Category: All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Category: All</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <Select value={assignedTo} onValueChange={setAssignedTo}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Assignee: All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Assignee: All</SelectItem>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {admins.map((a) => (
                                        <SelectItem key={a.id} value={a.id.toString()}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {(search || status !== 'all' || priority !== 'all' || categoryId !== 'all' || assignedTo !== 'all') && (
                        <div className="flex items-center justify-end">
                            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs h-7 flex items-center gap-1">
                                <RefreshCw className="size-3" />
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* Tickets list */}
                {tickets.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-16 text-center bg-card/25">
                        <FolderSearch className="size-12 text-muted-foreground/60 mb-4" />
                        <h3 className="text-lg font-semibold">No tickets found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                            No tickets match your filter criteria. Try expanding your search scope.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            {tickets.data.map((ticket) => (
                                <Link
                                    key={ticket.id}
                                    href={adminTicketsRoute.show.url(ticket.id)}
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
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <User className="size-3" />
                                                By {ticket.user.name}
                                            </span>
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
                                                Assignee:{' '}
                                                <span className="font-semibold text-foreground">
                                                    {ticket.assignee ? ticket.assignee.name : 'Unassigned'}
                                                </span>
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

AdminTicketsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Tickets Management',
            href: '/admin/tickets',
        },
    ],
};
