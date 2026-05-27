import { router, usePage, usePoll } from '@inertiajs/react';
import { Activity, Bell, Check, Inbox, MessageSquare, Plus, RefreshCw, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// --- CONFIGURATIONS ---

const EVENT_CONFIG: Record<string, { icon: typeof Activity; className: string; iconClassName: string }> = {
    created: { 
        icon: Plus, 
        className: 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800', 
        iconClassName: 'text-emerald-600 dark:text-emerald-400' 
    },
    assigned: { 
        icon: User, 
        className: 'bg-blue-50 border border-blue-200 dark:bg-blue-950/60 dark:border-blue-800', 
        iconClassName: 'text-blue-600 dark:text-blue-400' 
    },
    status_changed: { 
        icon: RefreshCw, 
        className: 'bg-amber-50 border border-amber-200 dark:bg-amber-950/60 dark:border-amber-800', 
        iconClassName: 'text-amber-600 dark:text-amber-400' 
    },
    comment_added: { 
        icon: MessageSquare, 
        className: 'bg-pink-50 border border-pink-200 dark:bg-pink-950/60 dark:border-pink-800', 
        iconClassName: 'text-pink-600 dark:text-pink-400' 
    },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDate(dateStr);
}

// --- MAIN EXPORT COMPONENT ---

export function NotificationBell() {
    const { auth } = usePage().props;
    const user = auth.user;

    // Polling triggers every 10 seconds silently in the background
    usePoll(10000);

    if (!user) return null;

    const unreadCount = user.unreadNotificationsCount as number ?? 0;
    const notifications = user.notifications as Array<{
        id: string;
        data: {
            ticket_id: string;
            ticket_code: string;
            ticket_title: string;
            message: string;
            type: 'created' | 'assigned' | 'status_changed' | 'comment_added';
        };
        read_at: string | null;
        created_at: string;
    }> ?? [];

    const prevNotifications = useRef<string[]>([]);
    const isMounted = useRef(false);

    useEffect(() => {
        const currentIds = notifications.map((n) => n.id);

        if (!isMounted.current) {
            prevNotifications.current = currentIds;
            isMounted.current = true;
            return;
        }

        // Find new unread notifications that were not in prevNotifications
        const newUnread = notifications.filter(
            (n) => !prevNotifications.current.includes(n.id) && n.read_at === null
        );

        if (newUnread.length > 0) {
            newUnread.forEach((notification) => {
                toast.info(`New Notification: #${notification.data.ticket_code}`, {
                    description: notification.data.message,
                    action: {
                        label: 'View',
                        onClick: () => {
                            router.post(`/notifications/${notification.id}/read`);
                        },
                    },
                });
            });
        }

        prevNotifications.current = currentIds;
    }, [notifications]);

    const handleNotificationClick = (id: string) => {
        router.post(`/notifications/${id}/read`);
    };

    const handleMarkAllRead = (e: React.MouseEvent) => {
        e.preventDefault();
        router.post('/notifications/read-all');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative group size-9 cursor-pointer flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                >
                    <span className="sr-only">Notifications</span>
                    <Bell className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in fade-in zoom-in duration-200">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 sm:w-96 p-0 rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg" align="end">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                    <div className="space-y-0.5">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </h4>
                        <p className="text-xs text-muted-foreground font-normal">Support desk notification activity</p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                        >
                            <Check className="size-3" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* List Container */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40 scrollbar-thin">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className="p-3 bg-muted rounded-full text-muted-foreground mb-2.5">
                                <Inbox className="size-5" />
                            </div>
                            <p className="text-xs font-medium text-foreground">All caught up!</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs font-normal leading-normal">
                                You have no recent notifications. Live updates will show up here.
                            </p>
                        </div>
                    ) : (
                        notifications.map((notification) => {
                            const isUnread = notification.read_at === null;
                            const config = EVENT_CONFIG[notification.data.type] || {
                                icon: Activity,
                                className: 'bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800',
                                iconClassName: 'text-slate-600 dark:text-slate-400',
                            };
                            const EventIcon = config.icon;

                            return (
                                <DropdownMenuItem
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification.id)}
                                    className={`flex items-start gap-3 p-3.5 cursor-pointer focus:bg-accent/80 transition-colors select-none ${
                                        isUnread ? 'bg-muted/10 font-medium' : ''
                                    }`}
                                >
                                    {/* Icon Indicator Container */}
                                    <div
                                        className={`flex size-8 flex-shrink-0 items-center justify-center rounded-full shadow-xs ${config.className}`}
                                    >
                                        <EventIcon className={`size-4 ${config.iconClassName}`} />
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <div className="text-xs text-muted-foreground leading-normal font-normal">
                                            <span className="font-semibold text-foreground">
                                                #{notification.data.ticket_code}
                                            </span>{' '}
                                            {notification.data.message}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-normal">
                                            {formatRelativeTime(notification.created_at)}
                                        </div>
                                    </div>

                                    {/* Unread Active Dot */}
                                    {isUnread && (
                                        <div className="flex-shrink-0 flex items-center justify-center h-5">
                                            <span className="size-2 rounded-full bg-primary animate-pulse" />
                                        </div>
                                    )}
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
