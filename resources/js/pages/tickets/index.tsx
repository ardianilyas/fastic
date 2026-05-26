import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    FolderSearch,
    Plus,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    code: string;
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
    categories: Category[];
    filters: {
        search: string | null;
        status: string | null;
        priority: string | null;
        category_id: string | null;
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
    critical: { label: 'Critical', style: 'text-red-600 bg-red-500/8 font-semibold dark:text-red-400 animate-pulse' },
} as const;

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TicketsIndex({ tickets, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [priority, setPriority] = useState(filters.priority || 'all');
    const [categoryId, setCategoryId] = useState(filters.category_id || 'all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const hasFilters = search || status !== 'all' || priority !== 'all' || categoryId !== 'all';

    // Create Form
    const createForm = useForm({
        category_id: '',
        title: '',
        description: '',
        priority: 'medium',
    });

    const handleCreateClick = () => {
        createForm.reset();
        createForm.clearErrors();
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createForm.post(ticketsRoute.store.url(), {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
                toast.success('Ticket submitted successfully.');
            },
            onError: () => {
                toast.error('Failed to submit ticket. Please check form errors.');
            },
        });
    };

    // Run search and filters update on value change
    const applyFilters = () => {
        router.get(
            ticketsRoute.index.url(),
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
                priority: priority !== 'all' ? priority : undefined,
                category_id: categoryId !== 'all' ? categoryId : undefined,
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
    }, [search, status, priority, categoryId]);

    const handleClearFilters = () => {
        setSearch('');
        setStatus('all');
        setPriority('all');
        setCategoryId('all');
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

                    <Button onClick={handleCreateClick} className="w-full sm:w-auto shadow-xs transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2">
                        <Plus className="size-4" />
                        New Ticket
                    </Button>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-border bg-card/60 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative min-w-48 flex-1">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search ticket, code…"
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

                {/* Tickets Table Grid */}
                {tickets.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/25 p-16 text-center">
                        <FolderSearch className="mb-4 size-12 text-muted-foreground/50" />
                        <h3 className="text-base font-semibold">No tickets found</h3>
                        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                            {hasFilters
                                ? 'No tickets match your filter criteria. Try expanding your search scope.'
                                : "You haven't submitted any support requests yet."}
                        </p>
                        {!hasFilters && (
                            <Button onClick={handleCreateClick} className="mt-6">
                                Create your first ticket
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-border bg-card">
                            <div className="min-w-[800px]">
                                {/* Header row */}
                                <div className="grid grid-cols-[7rem_1fr_7rem_7rem_9rem_8rem] items-center border-b border-border bg-muted/40 px-4 py-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                    <span>Code</span>
                                    <span>Ticket</span>
                                    <span>Status</span>
                                    <span>Priority</span>
                                    <span>Agent</span>
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
                                            href={ticketsRoute.show.url(ticket.id)}
                                            className="group grid grid-cols-[7rem_1fr_7rem_7rem_9rem_8rem] items-center px-4 py-3 transition-colors duration-150 hover:bg-muted/30"
                                        >
                                            {/* Code */}
                                            <span className="font-mono text-xs font-semibold text-primary">
                                                {ticket.code || `#${ticket.id.substring(0, 6)}`}
                                            </span>

                                            {/* Title + category */}
                                            <div className="flex min-w-0 flex-col gap-0.5 pr-4">
                                                <span className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                                    {ticket.title}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    {ticket.category && (
                                                        <span className="truncate">{ticket.category.name}</span>
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

                                            {/* Agent */}
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

                        {/* Pagination component */}
                        <div className="mt-4">
                            <Pagination links={tickets.links} />
                        </div>
                    </>
                )}
            </div>

            {/* Create Ticket Modal Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[560px]">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Submit a Ticket</DialogTitle>
                            <DialogDescription>
                                Provide details below to let our team resolve your issue quickly.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Title */}
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    type="text"
                                    placeholder="e.g. Cannot log in to the dashboard"
                                    value={createForm.data.title}
                                    onChange={(e) => createForm.setData('title', e.target.value)}
                                    required
                                />
                                {createForm.errors.title && (
                                    <p className="text-xs text-destructive">{createForm.errors.title}</p>
                                )}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {/* Category */}
                                <div className="grid gap-2">
                                    <Label htmlFor="category_id">Category</Label>
                                    <Select
                                        value={createForm.data.category_id}
                                        onValueChange={(value) => createForm.setData('category_id', value)}
                                    >
                                        <SelectTrigger id="category_id">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {createForm.errors.category_id && (
                                        <p className="text-xs text-destructive">{createForm.errors.category_id}</p>
                                    )}
                                </div>

                                {/* Priority */}
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={createForm.data.priority}
                                        onValueChange={(value) => createForm.setData('priority', value)}
                                    >
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {createForm.errors.priority && (
                                        <p className="text-xs text-destructive">{createForm.errors.priority}</p>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    placeholder="Describe your issue in detail. Add any steps to reproduce or error messages."
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    required
                                    rows={4}
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {createForm.errors.description && (
                                    <p className="text-xs text-destructive">{createForm.errors.description}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'Submitting...' : 'Submit Ticket'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
