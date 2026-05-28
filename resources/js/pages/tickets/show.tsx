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
import { ConversationThread } from '@/components/tickets/conversation-thread';
import { TicketDetailsSidebar } from '@/components/tickets/ticket-details-sidebar';

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
    user_id: number;
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

// Date format helper

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
            type: 'comment' as const,
            id: c.id,
            date: new Date(c.created_at),
            data: c,
        })),
        ...ticket.timelines.map((t) => ({
            type: 'timeline' as const,
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
                                <ConversationThread creatorId={ticket.user_id} chatLog={chatLog} />
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
                        <TicketDetailsSidebar ticket={ticket} />
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
