<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Ticket;
use App\Models\TicketTimeline;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the user's tickets.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $priority = $request->input('priority');
        $categoryId = $request->input('category_id');

        $tickets = Ticket::with(['category', 'assignee'])
            ->where('user_id', auth()->id())
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
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
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $categories = Category::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('tickets/index', [
            'tickets' => $tickets,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'priority' => $priority,
                'category_id' => $categoryId,
            ],
        ]);
    }

    /**
     * Show the form for creating a new ticket.
     */
    public function create(): Response
    {
        $categories = Category::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('tickets/create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created ticket in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'required|string|in:low,medium,high,critical',
        ]);

        $ticket = Ticket::create([
            'user_id' => auth()->id(),
            'category_id' => $validated['category_id'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => 'open',
        ]);

        // Record the created timeline event
        TicketTimeline::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'event' => 'created',
            'new_value' => 'open',
            'description' => 'Ticket was created and submitted.',
        ]);

        return redirect()->route('tickets.show', $ticket->id)
            ->with('success', 'Ticket has been successfully created.');
    }

    /**
     * Display the specified ticket.
     */
    public function show(Ticket $ticket): Response
    {
        Gate::authorize('view', $ticket);

        $ticket->load([
            'category',
            'assignee',
            'comments.user',
            'timelines.user',
        ]);

        // Filter out internal comments for regular users
        if (! auth()->user()->isAdmin()) {
            $ticket->setRelation('comments', $ticket->comments->where('is_internal', false)->values());
        }

        return Inertia::render('tickets/show', [
            'ticket' => $ticket,
        ]);
    }
}
