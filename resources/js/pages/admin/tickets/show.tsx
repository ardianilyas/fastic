import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Inbox, AlertCircle, Clock, CheckCircle2, User, Send, Calendar, Tag, ShieldAlert, Lock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import adminTicketsRoute from '@/routes/admin/tickets';
import adminCommentsRoute from '@/routes/admin/tickets/comments';

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
    user: User;
    assignee: User | null;
    comments: Comment[];
    timelines: TimelineEvent[];
}

interface Props {
    ticket: Ticket;
    admins: User[];
    categories: Category[];
}

export default function AdminTicketsShow({ ticket, admins, categories }: Props) {
    const [activeTab, setActiveTab] = useState<'public' | 'internal'>('public');

    // Forms
    const commentForm = useForm({
        body: '',
        is_internal: false,
    });

    const statusForm = useForm({
        status: ticket.status,
    });

    const priorityForm = useForm({
        priority: ticket.priority,
    });

    const assigneeForm = useForm({
        assigned_to: ticket.assigned_to ? ticket.assigned_to.toString() : 'unassigned',
    });

    // Submissions
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!commentForm.data.body.trim()) return;

        // Ensure current active tab state matches form payload
        const isInternal = activeTab === 'internal';

        commentForm.post(adminCommentsRoute.store.url(ticket.id), {
            data: {
                body: commentForm.data.body,
                is_internal: isInternal,
            },
            onSuccess: () => {
                commentForm.reset('body');
                toast.success(isInternal ? 'Internal note added.' : 'Public reply posted.');
            },
            onError: () => {
                toast.error('Failed to post comment.');
            },
        });
    };

    const handleStatusChange = (value: string) => {
        statusForm.setData('status', value);
        
        router.put(
            adminTicketsRoute.update.url(ticket.id),
            { status: value },
            {
                onSuccess: () => toast.success('Status updated successfully.'),
                onError: () => toast.error('Failed to update status.'),
            }
        );
    };

    const handlePriorityChange = (value: string) => {
        priorityForm.setData('priority', value);

        router.put(
            adminTicketsRoute.update.url(ticket.id),
            { priority: value },
            {
                onSuccess: () => toast.success('Priority updated successfully.'),
                onError: () => toast.error('Failed to update priority.'),
            }
        );
    };

    const handleAssigneeChange = (value: string) => {
        assigneeForm.setData('assigned_to', value);

        router.put(
            adminTicketsRoute.update.url(ticket.id),
            { assigned_to: value === 'unassigned' ? null : value },
            {
                onSuccess: () => toast.success('Assignee updated successfully.'),
                onError: () => toast.error('Failed to assign ticket.'),
            }
        );
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
            <Head title={`Ticket #${ticket.id.substring(0, 8)} - Admin Dashboard`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild className="size-8">
                        <Link href={adminTicketsRoute.index.url()}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <span className="text-sm text-muted-foreground">Back to all tickets list</span>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                            Ticket Reference: #{ticket.id}
                        </span>
                    </div>
                    <Heading
                        title={ticket.title}
                        description={`Submitted on ${new Date(ticket.created_at).toLocaleDateString()} by ${ticket.user.name} (${ticket.user.email})`}
                    />
                </div>

                {/* Two-Column split screen */}
                <div className="grid gap-6 lg:grid-cols-3 items-start">
                    {/* Left side: Timeline Conversation Stream */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm rounded-xl">
                            <CardHeader className="border-b border-border pb-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Inbox className="size-4 text-primary" />
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
                                            <span className="text-sm font-semibold text-foreground">{ticket.user.name} (Creator)</span>
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
                                    const isUser = comment.user.role !== 'admin';

                                    return (
                                        <div
                                            key={log.id}
                                            className={`flex gap-3 max-w-[85%] ${
                                                isUser ? 'mr-auto' : 'ml-auto flex-row-reverse'
                                            }`}
                                        >
                                            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 border ${
                                                comment.is_internal 
                                                    ? 'bg-orange-500/10 border-orange-500/20'
                                                    : isUser 
                                                        ? 'bg-secondary border-border' 
                                                        : 'bg-primary/10 border-primary/20'
                                            }`}>
                                                <User className={`size-4 ${
                                                    comment.is_internal 
                                                        ? 'text-orange-500' 
                                                        : isUser 
                                                            ? 'text-muted-foreground' 
                                                            : 'text-primary'
                                                }`} />
                                            </div>
                                            <div className={`space-y-1 p-4 rounded-xl border ${
                                                comment.is_internal
                                                    ? 'bg-orange-500/5 rounded-tr-none border-orange-500/20'
                                                    : isUser 
                                                        ? 'bg-muted rounded-tl-none border-border' 
                                                        : 'bg-primary/5 rounded-tr-none border-primary/10'
                                            }`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold flex items-center gap-1.5 ${
                                                        comment.is_internal 
                                                            ? 'text-orange-500' 
                                                            : isUser 
                                                                ? 'text-foreground' 
                                                                : 'text-primary'
                                                    }`}>
                                                        {isUser ? comment.user.name : `${comment.user.name} (Support)`}
                                                        {comment.is_internal && (
                                                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-1 py-0 text-[10px] flex items-center gap-0.5">
                                                                <Lock className="size-2.5" /> Internal Note
                                                            </Badge>
                                                        )}
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

                        {/* Dual Tab Comment Submission Card */}
                        {ticket.status !== 'closed' && (
                            <Card className="border border-border bg-card/60 backdrop-blur-md shadow-sm rounded-xl overflow-hidden">
                                <div className="flex border-b border-border bg-muted/40">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('public')}
                                        className={`flex-1 py-2.5 text-xs font-medium border-r border-border transition-colors hover:bg-muted/80 ${
                                            activeTab === 'public'
                                                ? 'bg-card text-foreground font-semibold border-b-2 border-b-primary'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        Public Response
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('internal')}
                                        className={`flex-1 py-2.5 text-xs font-medium transition-colors hover:bg-muted/80 flex items-center justify-center gap-1 ${
                                            activeTab === 'internal'
                                                ? 'bg-card text-orange-500 font-semibold border-b-2 border-b-orange-500'
                                                : 'text-muted-foreground'
                                        }`}
                                    >
                                        <Lock className="size-3" />
                                        Internal Note
                                    </button>
                                </div>
                                <CardContent className="p-4 pt-4">
                                    <form onSubmit={handleCommentSubmit} className="space-y-3">
                                        <textarea
                                            value={commentForm.data.body}
                                            onChange={(e) => commentForm.setData('body', e.target.value)}
                                            placeholder={activeTab === 'internal' ? 'Write a private internal note for other admins...' : 'Reply to the customer...'}
                                            rows={3}
                                            required
                                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        <div className="flex items-center justify-end">
                                            <Button 
                                                type="submit" 
                                                size="sm" 
                                                className={`flex items-center gap-1.5 ${
                                                    activeTab === 'internal' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''
                                                }`} 
                                                disabled={commentForm.processing}
                                            >
                                                <Send className="size-3.5" />
                                                {commentForm.processing ? 'Saving...' : activeTab === 'internal' ? 'Save Note' : 'Send Reply'}
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
                                <CardTitle className="text-sm font-semibold">Admin Panel</CardTitle>
                                <CardDescription>Update status and assignment details dynamically.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                {/* Status */}
                                <div className="grid gap-2 border-b border-border/60 pb-4">
                                    <Label htmlFor="status" className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="size-4" />
                                        Status
                                    </Label>
                                    <Select value={statusForm.data.status} onValueChange={handleStatusChange}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="waiting">Waiting</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Priority */}
                                <div className="grid gap-2 border-b border-border/60 pb-4">
                                    <Label htmlFor="priority" className="text-sm text-muted-foreground flex items-center gap-2">
                                        <ShieldAlert className="size-4" />
                                        Priority
                                    </Label>
                                    <Select value={priorityForm.data.priority} onValueChange={handlePriorityChange}>
                                        <SelectTrigger id="priority">
                                            <SelectValue placeholder="Select Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="critical">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Assignee */}
                                <div className="grid gap-2 border-b border-border/60 pb-4">
                                    <Label htmlFor="assigned_to" className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="size-4" />
                                        Assignee
                                    </Label>
                                    <Select value={assigneeForm.data.assigned_to} onValueChange={handleAssigneeChange}>
                                        <SelectTrigger id="assigned_to">
                                            <SelectValue placeholder="Assignee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {admins.map((admin) => (
                                                <SelectItem key={admin.id} value={admin.id.toString()}>
                                                    {admin.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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

                                {/* Submitted at */}
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

AdminTicketsShow.layout = {
    breadcrumbs: [
        {
            title: 'Tickets Management',
            href: '/admin/tickets',
        },
        {
            title: 'Ticket Workspace',
            href: '/admin/tickets/show',
        },
    ],
};
