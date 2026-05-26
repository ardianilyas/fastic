import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, LifeBuoy, AlertCircle, Clock, CheckCircle2, User, Send, Calendar, Tag, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

    const getStatusIcon = (status: Ticket['status']) => {
        switch (status) {
            case 'open':
                return <AlertCircle className="size-4" />;
            case 'in_progress':
                return <Clock className="size-4" />;
            case 'resolved':
            case 'closed':
                return <CheckCircle2 className="size-4" />;
            default:
                return <Clock className="size-4" />;
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
            <Head title={`Ticket #${ticket.id.substring(0, 8)}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
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
                        <span className="text-xs font-mono text-muted-foreground">
                            Ticket Reference: #{ticket.id}
                        </span>
                    </div>
                    <Heading
                        title={ticket.title}
                        description={`Submitted on ${new Date(ticket.created_at).toLocaleDateString()} by You`}
                    />
                </div>

                {/* Two-Column split screen */}
                <div className="grid gap-6 lg:grid-cols-3 items-start">
                    {/* Left side: Timeline Conversation Stream */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm rounded-xl">
                            <CardHeader className="border-b border-border pb-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <LifeBuoy className="size-4 text-primary" />
                                    Support Conversation Thread
                                </CardTitle>
                            </CardHeader>
                            
                            <CardContent className="pt-6 space-y-6 max-h-[60vh] overflow-y-auto min-h-[300px]">
                                {/* Initial Description from creator */}
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="size-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                                        <User className="size-4 text-muted-foreground" />
                                    </div>
                                    <div className="space-y-1 bg-muted p-4 rounded-xl rounded-tl-none border border-border">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground">You (Creator)</span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                            {ticket.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Dynamic Chronological Logs */}
                                {chatLog.map((log) => {
                                    if (log.type === 'timeline') {
                                        const event = log.data as TimelineEvent;
                                        // Ignore comments events as we show comments natively
                                        if (event.event === 'commented') return null;

                                        return (
                                            <div key={log.id} className="flex justify-center my-2">
                                                <span className="text-xs bg-secondary/80 border border-border text-muted-foreground py-1 px-3 rounded-full flex items-center gap-1.5 font-mono">
                                                    <Clock className="size-3" />
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
                                            className={`flex gap-3 max-w-[85%] ${
                                                isCreator ? 'mr-auto' : 'ml-auto flex-row-reverse'
                                            }`}
                                        >
                                            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 border ${
                                                isCreator ? 'bg-secondary border-border' : 'bg-primary/10 border-primary/20'
                                            }`}>
                                                <User className={`size-4 ${isCreator ? 'text-muted-foreground' : 'text-primary'}`} />
                                            </div>
                                            <div className={`space-y-1 p-4 rounded-xl border ${
                                                isCreator 
                                                    ? 'bg-muted rounded-tl-none border-border' 
                                                    : 'bg-primary/5 rounded-tr-none border-primary/10'
                                            }`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold ${isCreator ? 'text-foreground' : 'text-primary'}`}>
                                                        {isCreator ? 'You' : `${comment.user.name} (Support)`}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                                    {comment.body}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
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
                                        <Clock className="size-4" />
                                        Status
                                    </span>
                                    <Badge className={`flex items-center gap-1 font-medium capitalize text-xs ${getStatusStyle(ticket.status)}`}>
                                        {getStatusIcon(ticket.status)}
                                        {ticket.status.replace('_', ' ')}
                                    </Badge>
                                </div>

                                {/* Priority */}
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <ShieldAlert className="size-4" />
                                        Priority
                                    </span>
                                    <Badge variant="outline" className={`px-2 py-0 text-xs capitalize ${getPriorityStyle(ticket.priority)}`}>
                                        {ticket.priority}
                                    </Badge>
                                </div>

                                {/* Category */}
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Tag className="size-4" />
                                        Category
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {ticket.category?.name || 'General'}
                                    </span>
                                </div>

                                {/* Assignee */}
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="size-4" />
                                        Assignee
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {ticket.assignee 
                                            ? ticket.assignee.name 
                                            : <span className="text-muted-foreground text-xs italic">Awaiting Agent...</span>}
                                    </span>
                                </div>

                                {/* Created at */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="size-4" />
                                        Submitted
                                    </span>
                                    <span className="text-sm font-medium text-foreground">
                                        {new Date(ticket.created_at).toLocaleDateString()}
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
