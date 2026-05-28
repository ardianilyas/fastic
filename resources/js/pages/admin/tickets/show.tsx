import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Inbox,
    Lock,
    Send,
    Mail,
    MessageSquare,
    Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import adminTicketsRoute from '@/routes/admin/tickets';
import adminCommentsRoute from '@/routes/admin/tickets/comments';
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
    user: User;
    assignee: User | null;
    comments: Comment[];
    timelines: TimelineEvent[];
    assigned_to?: number | null;
    user_id: number;
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
    const [backUrl, setBackUrl] = useState(adminTicketsRoute.index.url());

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedFilters = sessionStorage.getItem('admin_tickets_filters');
            if (savedFilters) {
                setBackUrl(`${adminTicketsRoute.index.url()}${savedFilters}`);
            }
        }
    }, []);

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

    const handleTabChange = (tab: 'public' | 'internal') => {
        setActiveTab(tab);
        commentForm.setData('is_internal', tab === 'internal');
    };

    const statusForm = useForm({
        status: ticket.status,
    });

    const priorityForm = useForm({
        priority: ticket.priority,
    });

    const assigneeForm = useForm({
        assigned_to: ticket.assignee ? ticket.assignee.id.toString() : 'unassigned',
    });

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!commentForm.data.body.trim()) return;

        const isInternal = activeTab === 'internal';

        commentForm.post(adminCommentsRoute.store.url(ticket.id), {
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
            <Head title={`${ticket.code ?? ticket.id.substring(0, 8)} - Support Workspace`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild className="size-8">
                        <Link href={backUrl}>
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
                                <ConversationThread creatorId={ticket.user_id} chatLog={chatLog} />
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
                                        onClick={() => handleTabChange('public')}
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
                                        onClick={() => handleTabChange('internal')}
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
                        <TicketDetailsSidebar 
                            ticket={ticket} 
                            isAdmin={true} 
                            admins={admins} 
                            onStatusChange={handleStatusChange}
                            onPriorityChange={handlePriorityChange}
                            onAssigneeChange={handleAssigneeChange}
                        />
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
