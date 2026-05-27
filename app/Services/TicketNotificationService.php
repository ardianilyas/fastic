<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\Ticket;
use App\Models\User;
use App\Notifications\TicketUpdateNotification;

class TicketNotificationService
{
    /**
     * Notify all administrators that a new ticket has been submitted.
     */
    public function notifyAdminsOfNewTicket(Ticket $ticket): void
    {
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            $admin->notify(new TicketUpdateNotification(
                $ticket->id,
                $ticket->code,
                $ticket->title,
                "New ticket #{$ticket->code} submitted: {$ticket->title}",
                'created'
            ));
        }
    }

    /**
     * Notify the ticket creator that the ticket status has been changed.
     */
    public function notifyCreatorOfStatusChange(Ticket $ticket, string $oldStatus, string $newStatus): void
    {
        $creator = $ticket->user;

        if ($creator && $creator->id !== auth()->id()) {
            $creator->notify(new TicketUpdateNotification(
                $ticket->id,
                $ticket->code,
                $ticket->title,
                "Your ticket #{$ticket->code} status has been updated from {$oldStatus} to {$newStatus}.",
                'status_changed'
            ));
        }
    }

    /**
     * Notify the assigned admin that they have been assigned to the ticket.
     */
    public function notifyAssigneeOfAssignment(Ticket $ticket): void
    {
        $assignee = $ticket->assignee;

        if ($assignee && $assignee->id !== auth()->id()) {
            $assignee->notify(new TicketUpdateNotification(
                $ticket->id,
                $ticket->code,
                $ticket->title,
                "You have been assigned to ticket #{$ticket->code}: {$ticket->title}",
                'assigned'
            ));
        }
    }

    /**
     * Notify relevant stakeholders when a new comment is posted.
     */
    public function notifyStakeholdersOfNewComment(Comment $comment): void
    {
        $ticket = $comment->ticket;
        if (! $ticket) {
            return;
        }

        $commenter = $comment->user;
        if (! $commenter) {
            return;
        }

        $isCommenterAdmin = $commenter->isAdmin();

        if ($isCommenterAdmin) {
            // Admin comment
            if (! $comment->is_internal) {
                // Public reply: notify the ticket creator
                $creator = $ticket->user;
                if ($creator && $creator->id !== $commenter->id) {
                    $creator->notify(new TicketUpdateNotification(
                        $ticket->id,
                        $ticket->code,
                        $ticket->title,
                        "New public reply on ticket #{$ticket->code} from {$commenter->name}.",
                        'comment_added'
                    ));
                }
            }
        } else {
            // Regular user comment
            if ($ticket->assigned_to) {
                // Ticket is assigned: notify the assignee
                $assignee = $ticket->assignee;
                if ($assignee && $assignee->id !== $commenter->id) {
                    $assignee->notify(new TicketUpdateNotification(
                        $ticket->id,
                        $ticket->code,
                        $ticket->title,
                        "New comment on ticket #{$ticket->code} from {$commenter->name}.",
                        'comment_added'
                    ));
                }
            } else {
                // Ticket is unassigned: notify all admins
                $admins = User::where('role', 'admin')->get();
                foreach ($admins as $admin) {
                    if ($admin->id !== $commenter->id) {
                        $admin->notify(new TicketUpdateNotification(
                            $ticket->id,
                            $ticket->code,
                            $ticket->title,
                            "New comment on unassigned ticket #{$ticket->code} from {$commenter->name}.",
                            'comment_added'
                        ));
                    }
                }
            }
        }
    }
}
