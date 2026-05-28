import React from 'react';
import { Calendar, Clock, ShieldAlert, Tag, User, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Category {
    id: string;
    name: string;
}

interface SupportUser {
    id: number;
    name: string;
    email: string;
}

interface Ticket {
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: Category | null;
    assignee: SupportUser | null;
    created_at: string;
    assigned_to?: number | null;
}

interface TicketDetailsSidebarProps {
    ticket: Ticket;
    isAdmin?: boolean;
    admins?: SupportUser[];
    onStatusChange?: (status: string) => void;
    onPriorityChange?: (priority: string) => void;
    onAssigneeChange?: (assignee: string) => void;
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

// Fallback icon for Resolved
function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}

const PRIORITY_CONFIG = {
    low: { label: 'Low', style: 'text-slate-500 bg-slate-500/8 border-slate-500/10' },
    medium: { label: 'Medium', style: 'text-sky-600 bg-sky-500/8 dark:text-sky-400 border-sky-500/10' },
    high: { label: 'High', style: 'text-orange-600 bg-orange-500/8 dark:text-orange-400 border-orange-500/10' },
    critical: { label: 'Critical', style: 'text-red-600 bg-red-500/8 font-semibold dark:text-red-400 border-red-500/10 animate-pulse' },
} as const;

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function TicketDetailsSidebar({
    ticket,
    isAdmin = false,
    admins = [],
    onStatusChange,
    onPriorityChange,
    onAssigneeChange,
}: TicketDetailsSidebarProps) {
    const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
    const StatusIcon = statusCfg.icon;
    const priorityCfg = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.medium;

    return (
        <Card className="border border-border bg-card/60 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/80 bg-muted/10 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldAlert className="size-4 text-primary" />
                    Ticket Metadata Workspace
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {/* Status */}
                <div className="flex flex-col gap-1.5 border-b border-border/60 pb-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wider">
                        <Clock className="size-3.5" />
                        Status
                    </span>
                    {isAdmin && onStatusChange ? (
                        <div onClick={(e) => e.stopPropagation()}>
                            <Select value={ticket.status} onValueChange={onStatusChange}>
                                <SelectTrigger className="h-9 text-xs w-full bg-background border-border/60">
                                    <SelectValue placeholder="Select Status..." />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                    <SelectItem value="open" className="text-xs cursor-pointer">Open</SelectItem>
                                    <SelectItem value="in_progress" className="text-xs cursor-pointer">In Progress</SelectItem>
                                    <SelectItem value="waiting" className="text-xs cursor-pointer">Waiting</SelectItem>
                                    <SelectItem value="resolved" className="text-xs cursor-pointer">Resolved</SelectItem>
                                    <SelectItem value="closed" className="text-xs cursor-pointer">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div>
                            <Badge className={`flex w-fit items-center gap-1 border font-medium capitalize text-[11px] shadow-xs px-2 py-0.5 ${statusCfg.bg}`}>
                                <StatusIcon className="size-3 shrink-0" />
                                {statusCfg.label}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1.5 border-b border-border/60 pb-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wider">
                        <ShieldAlert className="size-3.5" />
                        Priority
                    </span>
                    {isAdmin && onPriorityChange ? (
                        <div onClick={(e) => e.stopPropagation()}>
                            <Select value={ticket.priority} onValueChange={onPriorityChange}>
                                <SelectTrigger className="h-9 text-xs w-full bg-background border-border/60">
                                    <SelectValue placeholder="Select Priority..." />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                    <SelectItem value="low" className="text-xs cursor-pointer">Low</SelectItem>
                                    <SelectItem value="medium" className="text-xs cursor-pointer">Medium</SelectItem>
                                    <SelectItem value="high" className="text-xs cursor-pointer">High</SelectItem>
                                    <SelectItem value="critical" className="text-xs cursor-pointer">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div>
                            <Badge className={`flex w-fit items-center gap-1 border font-medium capitalize text-[11px] shadow-xs px-2 py-0.5 ${priorityCfg.style}`}>
                                {priorityCfg.label}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1 border-b border-border/60 pb-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wider">
                        <Tag className="size-3.5" />
                        Category
                    </span>
                    <span className="text-sm font-semibold text-foreground px-2.5 py-1 bg-muted/50 border border-border/80 rounded-xl w-fit">
                        {ticket.category?.name || 'General'}
                    </span>
                </div>

                {/* Assignee */}
                <div className="flex flex-col gap-1.5 border-b border-border/60 pb-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wider">
                        <User className="size-3.5" />
                        Assignee
                    </span>
                    {isAdmin && onAssigneeChange ? (
                        <div onClick={(e) => e.stopPropagation()}>
                            <Select 
                                value={ticket.assigned_to ? String(ticket.assigned_to) : 'unassigned'} 
                                onValueChange={onAssigneeChange}
                            >
                                <SelectTrigger className="h-9 text-xs w-full bg-background border-border/60">
                                    <SelectValue placeholder="Assign ticket..." />
                                </SelectTrigger>
                                <SelectContent className="bg-background">
                                    <SelectItem value="unassigned" className="text-xs cursor-pointer italic text-muted-foreground">Unassigned</SelectItem>
                                    {admins.map((admin) => (
                                        <SelectItem key={admin.id} value={String(admin.id)} className="text-xs cursor-pointer">
                                            {admin.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            {ticket.assignee ? (
                                <span className="px-2.5 py-1 bg-primary/8 border border-primary/25 rounded-xl text-primary font-bold text-xs">{ticket.assignee.name}</span>
                            ) : (
                                <span className="text-muted-foreground text-xs italic">Awaiting Agent...</span>
                            )}
                        </span>
                    )}
                </div>

                {/* Created at */}
                <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium uppercase tracking-wider">
                        <Calendar className="size-3.5" />
                        Submitted
                    </span>
                    <span className="text-sm font-medium text-foreground">
                        {formatDate(ticket.created_at)}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
