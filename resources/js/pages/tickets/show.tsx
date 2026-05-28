import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    LifeBuoy,
    Send,
    ShieldAlert,
    Tag,
    User,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ticketsRoute from '@/routes/tickets';
import commentsRoute from '@/routes/tickets/comments';

interface Category {
    id: string;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface Comment {
    id: string;
    body: string;
    is_internal: boolean;
    created_at: string;
    user: User;
    user_id: number;
}

interface TimelineEvent {
    id: string;
    event: string;
    old_value: string | null;
    new_value: string | null;
    description: string | null;
    created_at: string;
    user: User | null;
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
    comments: Comment[];
    timelines: TimelineEvent[];
}

interface Props {
    ticket: Ticket;
}

const STATUS_CONFIG = {
    open: {
        label: 'Open',
        icon: Clock,
        bg: 'bg-blue-500/8 text-blue-600 dark:text-blue-400 border-blue-500/10',
    },
    in_progress: {
        label: 'In Progress',
        icon: Clock,
        bg: 'bg-amber-500/8 text-amber-600 dark:text-amber-400 border-amber-500/10',
    },
    waiting: {
        label: 'Waiting',
        icon: Clock,
        bg: 'bg-purple-500/8 text-purple-600 dark:text-purple-400 border-purple-500/10',
    },
    resolved: {
        label: 'Resolved',
        icon: CheckCircle2,
        bg: 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/10',
    },
    closed: {
        label: 'Closed',
        icon: XCircle,
        bg: 'bg-slate-500/8 text-slate-500 border-slate-500/10',
    },
} as const;

const PRIORITY_CONFIG = {
    low: { label: 'Low', style: 'text-slate-500 bg-slate-500/8 border-slate-500/10' },
    medium: { label: 'Medium', style: 'text-sky-600 bg-sky-500/8 dark:text-sky-400 border-sky-500/10' },
    high: { label: 'High', style: 'text-orange-600 bg-orange-500/8 dark:text-orange-400 border-orange-500/10' },
    critical: { label: 'Critical', style: 'text-red-600 bg-red-500/8 font-semibold dark:text-red-400 border-red-500/10 animate-pulse' },
} as const;

const getUserInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TicketsShow({ ticket }: Props) {
    const form = useForm({
        body: '',
    });

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.data.body.trim()) return;

        form.post(commentsRoute.store.url(ticket.id), {
            onSuccess: () => {
                form.reset('body');
                toast.success('Comment added successfully.');
            },
            onError: () => {
                toast.error('Failed to post comment.');
            },
        });
    };

    const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
    const StatusIcon = statusCfg.icon;
    const priorityCfg = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium;

    // Combine comments and timeline events into a single sorted log for the chat thread
    const chatLog = [
        ...ticket.comments.map((c) => ({
            type: 'comment',
            id: c.id,
            date: new Date(c.created_at),
            data: c,
        })),
        ...ticket.timelines.map((t) => ({
            type: 'timeline',
            id: t.id,
            date: new Date(t.created_at),
            data: t,
        })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    return (
        <>
            <Head title={`${ticket.code ?? `Ticket Details`} - Fastic`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild className="size-8">
                        <Link href={ticketsRoute.index.url()}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <span className="text-sm text-muted-foreground">Back to tickets list</span>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary">
                            {ticket.code ?? `#${ticket.id.substring(0, 8)}`}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-xs text-muted-foreground font-mono">{ticket.id}</span>
                    </div>
                    <Heading
                        title={ticket.title}
                        description={`Submitted on ${formatDate(ticket.created_at)}`}
                    />
                </div>

                {/* Two-Column split screen */}
                <div className="grid gap-4 sm:gap-6 md:grid-cols-3 items-start">
                    {/* Left side: Timeline Conversation Stream */}
                    <div className="md:col-span-2 space-y-4 sm:space-y-6">
                        <Card className="overflow-hidden border border-border bg-card/60 backdrop-blur-md shadow-sm rounded-2xl">
                            <CardHeader className="border-b border-border bg-muted/10 pb-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <LifeBuoy className="size-4 text-primary" strokeWidth={2.25} />
                                    Support Conversation Thread
                                </CardTitle>
                            </CardHeader>

                            {/* Original Ticket Description Card */}
                            <div className="border-b border-border bg-muted/25 p-5">
                                <div className="flex items-start gap-4">
                                    <span className="flex size-9 items-center justify-center rounded-xl border border-primary/10 bg-primary/8 text-primary shrink-0">
                                        <LifeBuoy className="size-4.5" />
                                    </span>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-foreground">Issue Description</h4>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {formatDate(ticket.created_at)} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                                            {ticket.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <CardContent className="pt-6 space-y-6 max-h-[60vh] overflow-y-auto min-h-[300px]">
                                {/* Dynamic Chronological Logs */}
                                {chatLog.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Clock className="size-8 text-muted-foreground/45 mb-2" />
                                        <p className="text-xs text-muted-foreground italic">Awaiting response from our support team...</p>
                                    </div>
                                ) : (
                                    chatLog.map((log) => {
                                        if (log.type === 'timeline') {
                                            const event = log.data as TimelineEvent;
                                            if (event.event === 'commented') return null;

                                            return (
                                                <div key={log.id} className="flex justify-center my-2">
                                                    <span className="text-[11px] bg-muted/70 border border-border/60 text-muted-foreground py-1 px-3 rounded-full flex items-center gap-1.5 font-mono shadow-xs">
                                                        <Clock className="size-3 text-muted-foreground/75" />
                                                        {event.description}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        const comment = log.data as Comment;
                                        const isCreator = comment.user_id === ticket.user_id;

                                        return (
                                            <div
                                                key={log.id}
                                                className={`flex gap-3 max-w-[85%] items-end ${
                                                    isCreator ? 'mr-auto' : 'ml-auto flex-row-reverse'
                                                }`}
                                            >
                                                {/* Initials Avatar */}
                                                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border select-none shadow-xs transition-all duration-200 hover:rotate-6 ${
                                                    isCreator 
                                                        ? 'bg-muted border-border/80 text-foreground' 
                                                        : 'bg-primary/10 border-primary/20 text-primary'
                                                }`}>
                                                    {getUserInitials(comment.user.name)}
                                                </div>

                                                {isCreator ? (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="text-[10px] text-muted-foreground/80 font-medium px-1">
                                                            You
                                                        </span>
                                                        <div className="p-3.5 px-4 bg-muted/65 dark:bg-muted/40 border border-border/80 rounded-2xl rounded-tl-xs text-sm text-foreground shadow-xs leading-relaxed whitespace-pre-wrap hover:scale-[1.005] hover:shadow-xs transition-all duration-200">
                                                            {comment.body}
                                                        </div>
                                                        <span className="text-[9px] text-muted-foreground/60 px-1 font-mono">
                                                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold px-1">
                                                            {comment.user.name} (Support)
                                                        </span>
                                                        <div className="p-3.5 px-4 bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/25 text-orange-950 dark:text-orange-100 rounded-2xl rounded-tr-xs text-sm shadow-xs leading-relaxed whitespace-pre-wrap hover:scale-[1.005] hover:shadow-xs transition-all duration-200">
                                                            {comment.body}
                                                        </div>
                                                        <span className="text-[9px] text-muted-foreground/60 px-1 font-mono">
                                                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>

                        {/* Comment Submission Card */}
                        {ticket.status !== 'closed' && (
                            <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm rounded-xl">
                                <CardContent className="p-4">
                                    <form onSubmit={handleCommentSubmit} className="space-y-3">
                                        <textarea
                                            value={form.data.body}
                                            onChange={(e) => form.setData('body', e.target.value)}
                                            placeholder="Write your response here..."
                                            rows={3}
                                            required
                                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <div className="flex items-center justify-end">
                                            <Button type="submit" size="sm" className="flex items-center gap-1.5" disabled={form.processing}>
                                                <Send className="size-3.5" />
                                                {form.processing ? 'Sending...' : 'Send Message'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right side: Sidebar Metadata Panel */}
                    <div className="space-y-6">
                        <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm rounded-xl">
                            <CardHeader className="border-b border-border pb-4">
                                <CardTitle className="text-sm font-semibold">Ticket Details</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {/* Status */}
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="size-4 text-muted-foreground/70" />
                                        Status
                                    </span>
                                    <Badge className={`flex items-center gap-1 border font-medium capitalize text-xs shadow-xs ${statusCfg.bg}`}>
                                        <StatusIcon className="size-3 shrink-0" />
                                        {statusCfg.label}
                                    </Badge>
                                </div>

                                {/* Priority */}
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <ShieldAlert className="size-4 text-muted-foreground/70" />
                                        Priority
                                    </span>
                                    <Badge className={`flex items-center gap-1 border font-medium capitalize text-xs shadow-xs ${priorityCfg.style}`}>
                                        {priorityCfg.label}
                                    </Badge>
                                </div>

                                {/* Category */}
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Tag className="size-4 text-muted-foreground/70" />
                                        Category
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {ticket.category?.name || 'General'}
                                    </span>
                                </div>

                                {/* Assignee */}
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="size-4 text-muted-foreground/70" />
                                        Assignee
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {ticket.assignee ? (
                                            <span className="font-semibold">{ticket.assignee.name}</span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">Awaiting Agent...</span>
                                        )}
                                    </span>
                                </div>

                                {/* Created at */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="size-4 text-muted-foreground/70" />
                                        Submitted
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {formatDate(ticket.created_at)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

TicketsShow.layout = {
    breadcrumbs: [
        {
            title: 'Tickets',
            href: '/tickets',
        },
        {
            title: 'Ticket Details',
            href: '/tickets/show',
        },
    ],
};
