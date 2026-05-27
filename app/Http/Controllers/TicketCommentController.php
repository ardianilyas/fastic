<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Ticket;
use App\Models\TicketTimeline;
use App\Services\TicketNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TicketCommentController extends Controller
{
    /**
     * Store a newly created comment on a ticket.
     */
    public function store(Request $request, Ticket $ticket, TicketNotificationService $notificationService): RedirectResponse
    {
        Gate::authorize('comment', $ticket);

        $validated = $request->validate([
            'body' => 'required|string|min:1',
        ]);

        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'body' => $validated['body'],
            'is_internal' => false, // User comments are always public
        ]);

        // Record the commented timeline event
        TicketTimeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'event' => 'commented',
            'description' => 'User posted a public comment.',
        ]);

        $notificationService->notifyStakeholdersOfNewComment($comment);

        return redirect()->route('tickets.show', $ticket->id)
            ->with('success', 'Comment posted successfully.');
    }
}
