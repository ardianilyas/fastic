<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketTimeline;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the user's dashboard with ticket statistics and recent activity.
     */
    public function __invoke(): Response
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();

        // Data array to hold deferred props
        $data = [
            'stats' => Inertia::defer(function () use ($user, $isAdmin) {
                $ticketQuery = Ticket::query()
                    ->when(! $isAdmin, fn ($q) => $q->where('user_id', $user->id));

                return [
                    'total' => (clone $ticketQuery)->count(),
                    'open' => (clone $ticketQuery)->where('status', 'open')->count(),
                    'in_progress' => (clone $ticketQuery)->where('status', 'in_progress')->count(),
                    'waiting' => (clone $ticketQuery)->where('status', 'waiting')->count(),
                    'resolved' => (clone $ticketQuery)->where('status', 'resolved')->count(),
                    'closed' => (clone $ticketQuery)->where('status', 'closed')->count(),
                ];
            }),
            'recentTickets' => Inertia::defer(function () use ($user, $isAdmin) {
                $ticketQuery = Ticket::query()
                    ->when(! $isAdmin, fn ($q) => $q->where('user_id', $user->id));

                return $ticketQuery
                    ->with(['category:id,name', 'assignee:id,name'])
                    ->select('id', 'code', 'title', 'status', 'priority', 'category_id', 'assigned_to', 'created_at')
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get();
            }),
            'recentActivity' => Inertia::defer(function () use ($user, $isAdmin) {
                return TicketTimeline::query()
                    ->with(['ticket:id,code,title', 'user:id,name'])
                    ->select('id', 'ticket_id', 'user_id', 'event', 'description', 'created_at')
                    ->when(! $isAdmin, fn ($q) => $q->whereHas('ticket', fn ($tq) => $tq->where('user_id', $user->id)))
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get();
            }),
        ];

        // Admin-specific deferred data
        if ($isAdmin) {
            $data['priorityBreakdown'] = Inertia::defer(function () {
                return [
                    'low' => Ticket::where('priority', 'low')->count(),
                    'medium' => Ticket::where('priority', 'medium')->count(),
                    'high' => Ticket::where('priority', 'high')->count(),
                    'critical' => Ticket::where('priority', 'critical')->count(),
                ];
            });
            $data['unassignedCount'] = Inertia::defer(function () {
                return Ticket::whereNull('assigned_to')
                    ->whereNotIn('status', ['resolved', 'closed'])
                    ->count();
            });
        }

        return Inertia::render('dashboard', $data);
    }
}
