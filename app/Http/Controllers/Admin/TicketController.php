<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CannedResponse;
use App\Models\Category;
use App\Models\Ticket;
use App\Models\TicketTimeline;
use App\Models\User;
use App\Services\TicketNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    /**
     * Display a listing of all support tickets.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $priority = $request->input('priority');
        $categoryId = $request->input('category_id');
        $assignedTo = $request->input('assigned_to');

        // Ticket Counter Stats
        $stats = [
            'total' => Ticket::count(),
            'open' => Ticket::where('status', 'open')->count(),
            'in_progress' => Ticket::where('status', 'in_progress')->count(),
            'resolved' => Ticket::where('status', 'resolved')->count(),
            'closed' => Ticket::where('status', 'closed')->count(),
        ];

        $tickets = Ticket::with(['user', 'category', 'assignee'])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($uq) use ($search) {
                            $uq->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->when($priority, function ($query) use ($priority) {
                $query->where('priority', $priority);
            })
            ->when($categoryId, function ($query) use ($categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($assignedTo, function ($query) use ($assignedTo) {
                if ($assignedTo === 'unassigned') {
                    $query->whereNull('assigned_to');
                } else {
                    $query->where('assigned_to', $assignedTo);
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $categories = Category::orderBy('name')->get(['id', 'name']);
        $admins = User::where('role', 'admin')->orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/tickets/index', [
            'tickets' => $tickets,
            'stats' => $stats,
            'categories' => $categories,
            'admins' => $admins,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'priority' => $priority,
                'category_id' => $categoryId,
                'assigned_to' => $assignedTo,
            ],
        ]);
    }

    /**
     * Display the specified ticket.
     */
    public function show(Ticket $ticket): Response
    {
        Gate::authorize('view', $ticket);

        $ticket->load([
            'user',
            'category',
            'assignee',
            'comments.user',
            'timelines.user',
        ]);

        $admins = User::where('role', 'admin')->orderBy('name')->get(['id', 'name', 'email']);
        $categories = Category::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $cannedResponses = CannedResponse::orderBy('title', 'asc')->get(['id', 'title', 'shortcut', 'body']);

        return Inertia::render('admin/tickets/show', [
            'ticket' => $ticket,
            'admins' => $admins,
            'categories' => $categories,
            'cannedResponses' => $cannedResponses,
        ]);
    }

    /**
     * Update the specified ticket's properties (status, priority, assignment).
     */
    public function update(Request $request, Ticket $ticket, TicketNotificationService $notificationService): RedirectResponse
    {
        Gate::authorize('update', $ticket);

        $validated = $request->validate([
            'status' => 'sometimes|string|in:open,in_progress,waiting,resolved,closed',
            'priority' => 'sometimes|string|in:low,medium,high,critical',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
        ]);

        $statusChanged = false;
        $oldStatus = $ticket->status;

        // Status Update & Timeline Logging
        if (isset($validated['status']) && $validated['status'] !== $ticket->status) {
            $ticket->status = $validated['status'];
            $statusChanged = true;

            if ($validated['status'] === 'resolved') {
                $ticket->resolved_at = now();
            } elseif ($validated['status'] === 'closed') {
                $ticket->closed_at = now();
            }

            TicketTimeline::create([
                'ticket_id' => $ticket->id,
                'user_id' => auth()->id(),
                'event' => 'status_changed',
                'old_value' => $oldStatus,
                'new_value' => $validated['status'],
                'description' => "Status changed from {$oldStatus} to {$validated['status']}.",
            ]);
        }

        // Priority Update & Timeline Logging
        if (isset($validated['priority']) && $validated['priority'] !== $ticket->priority) {
            $oldPriority = $ticket->priority;
            $ticket->priority = $validated['priority'];

            TicketTimeline::create([
                'ticket_id' => $ticket->id,
                'user_id' => auth()->id(),
                'event' => 'priority_changed',
                'old_value' => $oldPriority,
                'new_value' => $validated['priority'],
                'description' => "Priority updated from {$oldPriority} to {$validated['priority']}.",
            ]);
        }

        $assignmentChanged = false;

        // Assignment Update & Timeline Logging
        if (array_key_exists('assigned_to', $validated) && $validated['assigned_to'] !== $ticket->assigned_to) {
            $oldAssigneeId = $ticket->assigned_to;
            $newAssigneeId = $validated['assigned_to'];

            $ticket->assigned_to = $newAssigneeId;
            $assignmentChanged = $newAssigneeId !== null;

            $oldName = $oldAssigneeId ? User::find($oldAssigneeId)?->name : 'Unassigned';
            $newName = $newAssigneeId ? User::find($newAssigneeId)?->name : 'Unassigned';

            TicketTimeline::create([
                'ticket_id' => $ticket->id,
                'user_id' => auth()->id(),
                'event' => 'assigned',
                'old_value' => $oldName,
                'new_value' => $newName,
                'description' => $newAssigneeId
                    ? "Ticket assigned to {$newName}."
                    : 'Ticket was unassigned.',
            ]);
        }

        $ticket->save();

        // Dispatch notifications after saving to ensure db consistency
        if ($statusChanged) {
            $notificationService->notifyCreatorOfStatusChange($ticket, $oldStatus, $validated['status']);
        }

        if ($assignmentChanged) {
            $notificationService->notifyAssigneeOfAssignment($ticket);
        }

        return redirect()->route('admin.tickets.show', $ticket->id)
            ->with('success', 'Ticket properties updated successfully.');
    }
}
