<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
     * Store a newly created comment/internal note on a ticket.
     */
    public function store(Request $request, Ticket $ticket, TicketNotificationService $notificationService): RedirectResponse
    {
        Gate::authorize('comment', $ticket);

        $validated = $request->validate([
            'body' => 'required|string|min:1',
            'is_internal' => 'required|boolean',
        ]);

        $comment = Comment::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'body' => $validated['body'],
            'is_internal' => $validated['is_internal'],
        ]);

        // Record comment timeline event
        TicketTimeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'event' => 'commented',
            'description' => $validated['is_internal']
                ? 'Admin posted an internal note.'
                : 'Admin posted a public response.',
        ]);

        $notificationService->notifyStakeholdersOfNewComment($comment);

        return redirect()->route('admin.tickets.show', $ticket->id)
            ->with('success', $validated['is_internal'] ? 'Internal note added.' : 'Reply posted successfully.');
    }
}
