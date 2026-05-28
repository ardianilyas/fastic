import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    FolderSearch,
    RefreshCw,
    Search,
    Ticket,
    User,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import adminTicketsRoute from '@/routes/admin/tickets';

interface Category {
    id: string;
    name: string;
}

interface TicketUser {
    id: number;
    name: string;
    email: string;
}

interface Ticket {
    id: string;
    code: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    created_at: string;
    category: Category | null;
    user: TicketUser;
    assignee: TicketUser | null;
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
    admins: TicketUser[];
    filters: {
        search: string | null;
        status: string | null;
        priority: string | null;
        category_id: string | null;
        assigned_to: string | null;
    };
}

const STATUS_CONFIG = {
    open: {
        label: 'Open',
        icon: AlertCircle,
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/8 text-blue-600 dark:text-blue-400',
        dot: 'bg-blue-500',
    },
    in_progress: {
        label: 'In Progress',
        icon: Clock,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/8 text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-500',
    },
    waiting: {
        label: 'Waiting',
        icon: Clock,
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-500/8 text-purple-600 dark:text-purple-400',
        dot: 'bg-purple-500',
    },
    resolved: {
        label: 'Resolved',
        icon: CheckCircle2,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400',
        dot: 'bg-emerald-500',
    },
    closed: {
        label: 'Closed',
        icon: XCircle,
        color: 'text-slate-500',
        bg: 'bg-slate-500/8 text-slate-500',
        dot: 'bg-slate-400',
    },
} as const;

const PRIORITY_CONFIG = {
    low: { label: 'Low', style: 'text-slate-500 bg-slate-500/8' },
    medium: { label: 'Medium', style: 'text-sky-600 bg-sky-500/8 dark:text-sky-400' },
    high: { label: 'High', style: 'text-orange-600 bg-orange-500/8 dark:text-orange-400' },
    critical: { label: 'Critical', style: 'text-red-600 bg-red-500/8 font-semibold dark:text-red-400' },
} as const;

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface StatCardConfig {
    label: string;
    value: number;
    total?: number;
    icon: React.ElementType;
    gradient: string;
    iconColor: string;
    numColor: string;
    bar: string;
}

function StatCard({ label, value, total, icon: Icon, gradient, iconColor, numColor, bar }: StatCardConfig) {
    const pct = total && total > 0 ? Math.round((value / total) * 100) : 100;

    return (
        <div
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${gradient}`}
        >
            {/* Decorative blurred circle */}
            <span
                className={`pointer-events-none absolute -right-4 -top-4 size-24 rounded-full opacity-20 blur-2xl ${iconColor.replace('text-', 'bg-')}`}
            />

            {/* Top row: label + icon */}
            <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                    {label}
                </span>
                <span className={`flex size-8 items-center justify-center rounded-lg bg-white/60 dark:bg-black/20 ${iconColor}`}>
                    <Icon className="size-4" strokeWidth={1.75} />
                </span>
            </div>

            {/* Number */}
            <div className="mt-3">
                <span className={`text-4xl font-bold tracking-tight ${numColor}`}>{value}</span>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${bar}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default function AdminTicketsIndex({ tickets, stats, categories, admins, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [priority, setPriority] = useState(filters.priority || 'all');
    const [categoryId, setCategoryId] = useState(filters.category_id || 'all');
    const [assignedTo, setAssignedTo] = useState(filters.assigned_to || 'all');

    const hasFilters = search || status !== 'all' || priority !== 'all' || categoryId !== 'all' || assignedTo !== 'all';

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
            { preserveState: true, replace: true },
        );
    };

    useEffect(() => {
        const timer = setTimeout(applyFilters, 300);
        return () => clearTimeout(timer);
    }, [search, status, priority, categoryId, assignedTo]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (status !== 'all') queryParams.append('status', status);
            if (priority !== 'all') queryParams.append('priority', priority);
            if (categoryId !== 'all') queryParams.append('category_id', categoryId);
            if (assignedTo !== 'all') queryParams.append('assigned_to', assignedTo);
            
            const searchStr = queryParams.toString();
            sessionStorage.setItem('admin_tickets_filters', searchStr ? `?${searchStr}` : '');
        }
    }, [search, status, priority, categoryId, assignedTo]);

    const handleClearFilters = () => {
        setSearch('');
        setStatus('all');
        setPriority('all');
        setCategoryId('all');
        setAssignedTo('all');
    };

    return (
        <>
            <Head title="Ticket Control Center" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <Heading
                    title="Support Ticket Control Board"
                    description="Monitor, assign, and manage all support requests across Fastic."
                />

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <StatCard
                        label="Total Tickets"
                        value={stats.total}
                        icon={Ticket}
                        gradient="bg-gradient-to-br from-orange-50 to-amber-100/60 dark:from-orange-950/40 dark:to-amber-900/20"
                        iconColor="text-primary"
                        numColor="text-primary"
                        bar="bg-primary"
                    />
                    <StatCard
                        label="Open"
                        value={stats.open}
                        total={stats.total}
                        icon={AlertCircle}
                        gradient="bg-gradient-to-br from-blue-50 to-sky-100/60 dark:from-blue-950/40 dark:to-sky-900/20"
                        iconColor="text-blue-500"
                        numColor="text-blue-600 dark:text-blue-400"
                        bar="bg-blue-500"
                    />
                    <StatCard
                        label="In Progress"
                        value={stats.in_progress}
                        total={stats.total}
                        icon={Clock}
                        gradient="bg-gradient-to-br from-amber-50 to-yellow-100/60 dark:from-amber-950/40 dark:to-yellow-900/20"
                        iconColor="text-amber-500"
                        numColor="text-amber-600 dark:text-amber-400"
                        bar="bg-amber-500"
                    />
                    <StatCard
                        label="Resolved"
                        value={stats.resolved}
                        total={stats.total}
                        icon={CheckCircle2}
                        gradient="bg-gradient-to-br from-emerald-50 to-green-100/60 dark:from-emerald-950/40 dark:to-green-900/20"
                        iconColor="text-emerald-500"
                        numColor="text-emerald-600 dark:text-emerald-400"
                        bar="bg-emerald-500"
                    />
                    <StatCard
                        label="Closed"
                        value={stats.closed}
                        total={stats.total}
                        icon={XCircle}
                        gradient="bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-900/40 dark:to-slate-800/20"
                        iconColor="text-slate-400"
                        numColor="text-slate-500"
                        bar="bg-slate-400"
                    />
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative min-w-48 flex-1">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search ticket, code, user…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-8 pl-8 text-sm"
                            />
                        </div>

                        {/* Status */}
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="waiting">Waiting</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Priority */}
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Category */}
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Assignee */}
                        <Select value={assignedTo} onValueChange={setAssignedTo}>
                            <SelectTrigger className="h-8 w-36 text-sm">
                                <SelectValue placeholder="Assignee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Assignees</SelectItem>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {admins.map((a) => (
                                    <SelectItem key={a.id} value={a.id.toString()}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Clear button — inline */}
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="h-8 gap-1.5 px-2.5 text-xs text-primary hover:bg-primary/8 hover:text-primary"
                            >
                                <RefreshCw className="size-3" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tickets Table */}
                {tickets.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/25 p-16 text-center">
                        <FolderSearch className="mb-4 size-12 text-muted-foreground/50" />
                        <h3 className="text-base font-semibold">No tickets found</h3>
                        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                            No tickets match your filter criteria. Try expanding your search scope.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-border bg-card">
                        <div className="min-w-[800px]">
                            {/* Table header */}
                            <div className="grid grid-cols-[7rem_1fr_7rem_7rem_9rem_8rem] items-center border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                <span>Code</span>
                                <span>Ticket</span>
                                <span>Status</span>
                                <span>Priority</span>
                                <span>Assignee</span>
                                <span className="text-right">Created</span>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-border">
                                {tickets.data.map((ticket) => {
                                    const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                                    const priorityCfg = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium;
                                    const StatusIcon = statusCfg.icon;

                                    return (
                                        <Link
                                            key={ticket.id}
                                            href={adminTicketsRoute.show.url(ticket.id)}
                                            className="group grid grid-cols-[7rem_1fr_7rem_7rem_9rem_8rem] items-center px-4 py-3 transition-colors duration-150 hover:bg-muted/30"
                                        >
                                            {/* Code */}
                                            <span className="font-mono text-xs font-semibold text-primary">
                                                {ticket.code || `#${ticket.id.substring(0, 6)}`}
                                            </span>

                                            {/* Title + meta */}
                                            <div className="flex min-w-0 flex-col gap-0.5 pr-4">
                                                <span className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                    {ticket.title}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <User className="size-3 shrink-0" />
                                                    <span className="truncate">{ticket.user.name}</span>
                                                    {ticket.category && (
                                                        <>
                                                            <span>·</span>
                                                            <span className="truncate">{ticket.category.name}</span>
                                                        </>
                                                    )}
                                                </span>
                                            </div>

                                            {/* Status */}
                                            <span
                                                className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusCfg.bg}`}
                                            >
                                                <StatusIcon className="size-3 shrink-0" />
                                                {statusCfg.label}
                                            </span>

                                            {/* Priority */}
                                            <span
                                                className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${priorityCfg.style}`}
                                            >
                                                {priorityCfg.label}
                                            </span>

                                            {/* Assignee */}
                                            <span className="truncate text-xs text-muted-foreground">
                                                {ticket.assignee ? (
                                                    <span className="font-medium text-foreground">{ticket.assignee.name}</span>
                                                ) : (
                                                    <span className="italic text-muted-foreground/60">Unassigned</span>
                                                )}
                                            </span>

                                            {/* Created date */}
                                            <span className="text-right text-xs text-muted-foreground">
                                                {formatDate(ticket.created_at)}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Pagination */}
                    <Pagination links={tickets.links} />
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
