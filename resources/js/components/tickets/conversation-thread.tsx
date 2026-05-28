import React from 'react';
import { Clock, Lock } from 'lucide-react';

interface Comment {
    id: string;
    body: string;
    is_internal: boolean;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
    user_id: number;
}

interface TimelineEvent {
    id: string;
    event: string;
    old_value: string | null;
    new_value: string | null;
    description: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    } | null;
}

interface ChatLogItem {
    type: 'comment' | 'timeline';
    id: string;
    date: Date;
    data: Comment | TimelineEvent;
}

interface ConversationThreadProps {
    creatorId: number;
    chatLog: ChatLogItem[];
}

const getUserInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

export function ConversationThread({ creatorId, chatLog }: ConversationThreadProps) {
    if (chatLog.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="size-8 text-muted-foreground/45 mb-2" />
                <p className="text-xs text-muted-foreground italic">Awaiting response from our support team...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {chatLog.map((log) => {
                if (log.type === 'timeline') {
                    const event = log.data as TimelineEvent;
                    if (event.event === 'commented') {
                        return null;
                    }

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
                const isCreator = comment.user_id === creatorId;

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
        </div>
    );
}
