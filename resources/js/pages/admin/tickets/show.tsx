import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Inbox,
    Lock,
    Send,
    ShieldAlert,
    Tag,
    User,
    Mail,
    UserCheck,
    MessageSquare,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    user: User;
    assignee: User | null;
    comments: Comment[];
    timelines: TimelineEvent[];
    assigned_to?: number | null;
}

interface CannedResponse {
    id: string;
    title: string;
    shortcut: string;
    body: string;
}

interface Props {
    ticket: Ticket;
    admins: User[];
    categories: Category[];
    cannedResponses?: CannedResponse[];
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
        icon: Clock,
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

export default function AdminTicketsShow({ ticket, admins, categories, cannedResponses = [] }: Props) {
    const [activeTab, setActiveTab] = useState<'public' | 'internal'>('public');

    const handleCannedResponseSelect = (value: string) => {
        const selected = cannedResponses.find(r => r.id === value);
        if (selected) {
            commentForm.setData('body', commentForm.data.body + (commentForm.data.body ? "\n\n" : "") + selected.body);
            toast.success(`Inserted template "${selected.title}"`);
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        commentForm.setData('body', val);

        if (activeTab !== 'public') return;

        // Detect if user typed a shortcut followed by space or newline
        const lastWordMatch = val.match(/(\/[a-zA-Z0-9_-]+)(\s)$/);
        if (lastWordMatch) {
            const shortcut = lastWordMatch[1];
            const whitespace = lastWordMatch[2];
            const found = cannedResponses.find(r => r.shortcut.toLowerCase() === shortcut.toLowerCase());
            if (found) {
                const replacedText = val.slice(0, val.length - shortcut.length - whitespace.length) + found.body + whitespace;
                commentForm.setData('body', replacedText);
                toast.success(`Injected template "${found.title}"`);
            }
        }
    };

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
        assigned_to: ticket.assignee ? ticket.assignee.id.toString() : 'unassigned',
    });

    // Submissions
    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!commentForm.data.body.trim()) return;

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
        statusForm.setData('status', value as any);
        
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
        priorityForm.setData('priority', value as any);

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
            <Head title={`${ticket.code ?? ticket.id.substring(0, 8)} - Support Workspace`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild className="size-8">
                        <Link href={adminTicketsRoute.index.url()}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <span className="text-sm text-muted-foreground">Back to all tickets</span>
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
                        description={`Submitted on ${formatDate(ticket.created_at)} by ${ticket.user.name} (${ticket.user.email})`}
                    />
                </div>

                {/* Two-Column split screen */}
                <div className="grid gap-4 sm:gap-6 md:grid-cols-3 items-start">
                    {/* Left side: Timeline Conversation Stream */}
                    <div className="md:col-span-2 space-y-4 sm:space-y-6">
                        <Card className="overflow-hidden border border-border bg-card/60 backdrop-blur-md shadow-sm rounded-2xl">
                            <CardHeader className="border-b border-border bg-muted/10 pb-4">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Inbox className="size-4 text-primary" strokeWidth={2.25} />
                                    Support Conversation Thread
                                </CardTitle>
                            </CardHeader>

                            {/* Original Ticket Description Card */}
                            <div className="border-b border-border bg-muted/25 p-5">
                                <div className="flex items-start gap-4">
                                    <span className="flex size-9 items-center justify-center rounded-xl border border-primary/10 bg-primary/8 text-primary shrink-0">
                                        <Inbox className="size-4.5" />
                                    </span>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-foreground">{ticket.user.name} (Creator)</h4>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {formatDate(ticket.created_at)} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                            {ticket.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <CardContent className="pt-6 space-y-6 max-h-[60vh] overflow-y-auto min-h-[300px]">
                                {/* Dynamic Chronological Logs */}
                                {chatLog.map((log) => {
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
                                            {/* Dynamic Initials Avatars */}
                                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold border select-none shadow-xs transition-all duration-200 hover:rotate-6 ${
                                                comment.is_internal 
                                                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
                                                    : isCreator 
                                                        ? 'bg-muted border-border/80 text-foreground' 
                                                        : 'bg-primary/10 border-primary/20 text-primary'
                                            }`}>
                                                {getUserInitials(comment.user.name)}
                                            </div>

                                            {comment.is_internal ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-1 flex items-center gap-1">
                                                        <Lock className="size-2.5" /> {comment.user.name} (Internal Note)
                                                    </span>
                                                    <div className="p-3.5 px-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 rounded-2xl rounded-tr-xs text-sm text-foreground shadow-xs leading-relaxed whitespace-pre-wrap hover:scale-[1.005] hover:shadow-xs transition-all duration-200">
                                                        {comment.body}
                                                    </div>
                                                    <span className="text-[9px] text-muted-foreground/60 px-1 font-mono">
                                                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ) : isCreator ? (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="text-[10px] text-muted-foreground/80 font-medium px-1">
                                                        {comment.user.name}
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
                                })}
                            </CardContent>
                        </Card>

                        {/* Dual Tab Comment Submission Card */}
                        {ticket.status !== 'closed' && (
                            <Card className={`overflow-hidden border backdrop-blur-md shadow-sm transition-all duration-300 rounded-2xl ${
                                activeTab === 'internal' 
                                    ? 'border-orange-500/20 bg-orange-500/[0.02]' 
                                    : 'border-border bg-card/60'
                            }`}>
                                <div className="flex p-2 select-none gap-2 bg-muted/30 border-b border-border/80">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('public')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                                            activeTab === 'public'
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <MessageSquare className="size-3.5 text-primary" />
                                        Public Response
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('internal')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                                            activeTab === 'internal'
                                                ? 'bg-orange-500 text-white shadow-sm'
                                                : 'text-muted-foreground hover:text-orange-500 hover:bg-muted/50'
                                        }`}
                                    >
                                        <Lock className={`size-3.5 ${activeTab === 'internal' ? 'text-white' : 'text-orange-500'}`} />
                                        Internal Note
                                    </button>
                                </div>
                                <CardContent className="p-4 pt-4">
                                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                                        <div className={`relative rounded-xl border transition-all duration-200 bg-background/50 ${
                                            activeTab === 'internal'
                                                ? 'border-orange-500/30 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10'
                                                : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'
                                        }`}>
                                            <textarea
                                                value={commentForm.data.body}
                                                onChange={handleTextareaChange}
                                                placeholder={activeTab === 'internal' ? 'Write a private internal note for other admins...' : 'Reply to the customer...'}
                                                rows={4}
                                                required
                                                className="w-full bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-hidden min-h-[100px] resize-none"
                                            />
                                            
                                            <div className="flex items-center justify-between border-t border-border/60 px-4 py-2 bg-muted/20 rounded-b-xl text-[11px] text-muted-foreground gap-4">
                                                <span className="flex items-center gap-1">
                                                    {activeTab === 'internal' ? (
                                                        <>
                                                            <Lock className="size-3 text-orange-500" />
                                                            Private note: Only visible to support team
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="size-3 text-primary" />
                                                            Customer reply: Sent directly to client inbox
                                                        </>
                                                    )}
                                                </span>

                                                {cannedResponses.length > 0 && activeTab === 'public' && (
                                                    <div className="flex items-center gap-1.5 select-none" onClick={(e) => e.stopPropagation()}>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Template:</span>
                                                        <Select onValueChange={handleCannedResponseSelect}>
                                                            <SelectTrigger className="h-6 text-[11px] px-2 py-0.5 w-[150px] bg-background border-border/60 shadow-none hover:bg-muted/30 transition-colors">
                                                                <SelectValue placeholder="Insert canned reply..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-w-[250px] bg-background">
                                                                {cannedResponses.map((item) => (
                                                                    <SelectItem key={item.id} value={item.id} className="text-[11px] cursor-pointer">
                                                                        <div className="flex flex-col gap-0.5 items-start">
                                                                            <span className="font-semibold text-foreground">{item.title}</span>
                                                                            <span className="text-[10px] text-muted-foreground font-mono">{item.shortcut}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                type="submit" 
                                                size="sm" 
                                                className={`flex items-center gap-1.5 transition-all duration-200 px-4 py-2 font-medium cursor-pointer ${
                                                    activeTab === 'internal' 
                                                        ? 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-orange-500/10 hover:shadow-md' 
                                                        : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-primary/10 hover:shadow-md'
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
                    <div className="space-y-4 sm:space-y-6">
                        {/* Customer Information Card */}
                        <Card className="border border-border bg-card/60 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden">
                            <div className="p-4 bg-muted/30 border-b border-border flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold border bg-primary/10 border-primary/20 text-primary select-none shadow-xs">
                                    {getUserInitials(ticket.user.name)}
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="text-sm font-bold text-foreground truncate">{ticket.user.name}</h4>
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Mail className="size-3 shrink-0" />
                                        <span className="truncate">{ticket.user.email}</span>
                                    </span>
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Account Type</span>
                                    <Badge variant="secondary" className="capitalize text-[10px] font-semibold py-0.5 px-2">
                                        {ticket.user.role}
                                    </Badge>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full text-xs font-semibold cursor-pointer border-border/80 hover:bg-muted/50" 
                                    asChild
                                >
                                    <a href={`mailto:${ticket.user.email}`}>
                                        <Mail className="size-3 mr-1.5" />
                                        Contact Customer
                                    </a>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Ticket Controls Panel */}
                        <Card className="border border-border bg-card/60 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-border bg-muted/10 pb-4">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    Ticket Controls
                                </CardTitle>
                                <CardDescription className="text-xs">Update priority, assignments, and status.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-6 space-y-5">
                                {/* Status Selection */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="status" className="text-xs font-bold text-muted-foreground/90 flex items-center gap-1.5">
                                        <Clock className="size-3.5 text-muted-foreground/75" />
                                        Ticket Status
                                    </Label>
                                    <Select value={statusForm.data.status} onValueChange={handleStatusChange}>
                                        <SelectTrigger id="status" className="w-full rounded-xl cursor-pointer">
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="open" className="cursor-pointer">Open</SelectItem>
                                            <SelectItem value="in_progress" className="cursor-pointer">In Progress</SelectItem>
                                            <SelectItem value="waiting" className="cursor-pointer">Waiting</SelectItem>
                                            <SelectItem value="resolved" className="cursor-pointer">Resolved</SelectItem>
                                            <SelectItem value="closed" className="cursor-pointer">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Priority Selection */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="priority" className="text-xs font-bold text-muted-foreground/90 flex items-center gap-1.5">
                                        <ShieldAlert className="size-3.5 text-muted-foreground/75" />
                                        Issue Priority
                                    </Label>
                                    <Select value={priorityForm.data.priority} onValueChange={handlePriorityChange}>
                                        <SelectTrigger id="priority" className="w-full rounded-xl cursor-pointer">
                                            <SelectValue placeholder="Select Priority" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="low" className="cursor-pointer">Low</SelectItem>
                                            <SelectItem value="medium" className="cursor-pointer">Medium</SelectItem>
                                            <SelectItem value="high" className="cursor-pointer">High</SelectItem>
                                            <SelectItem value="critical" className="cursor-pointer">Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Assignee Selection */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="assigned_to" className="text-xs font-bold text-muted-foreground/90 flex items-center gap-1.5">
                                        <UserCheck className="size-3.5 text-muted-foreground/75" />
                                        Assigned Staff
                                    </Label>
                                    <Select value={assigneeForm.data.assigned_to} onValueChange={handleAssigneeChange}>
                                        <SelectTrigger id="assigned_to" className="w-full rounded-xl cursor-pointer">
                                            <SelectValue placeholder="Assignee" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="unassigned" className="cursor-pointer">Unassigned</SelectItem>
                                            {admins.map((admin) => (
                                                <SelectItem key={admin.id} value={admin.id.toString()} className="cursor-pointer">
                                                    {admin.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-2 border-t border-border/60 space-y-3">
                                    {/* Category metadata */}
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Tag className="size-3.5 text-muted-foreground/70" />
                                            Category
                                        </span>
                                        <span className="font-semibold text-foreground px-2 py-0.5 bg-muted/60 border border-border/80 rounded-md">
                                            {ticket.category?.name || 'General'}
                                        </span>
                                    </div>

                                    {/* Submitted timestamp */}
                                    <div className="flex items-center justify-between text-xs py-1">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <Calendar className="size-3.5 text-muted-foreground/70" />
                                            Submitted
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {formatDate(ticket.created_at)}
                                        </span>
                                    </div>
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
