<?php

use App\Models\Ticket;
use App\Models\TicketTimeline;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard and see deferred props', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            // Deferred props are initially missing from response payload
            ->missing('stats')
            ->missing('recentTickets')
            ->missing('recentActivity')
            // Admin only props should be completely absent
            ->missing('priorityBreakdown')
            ->missing('unassignedCount')
            // Loading deferred props resolves them
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('stats')
                ->has('recentTickets')
                ->has('recentActivity')
            )
        );
});

test('authenticated users see only their own tickets in stats, recentTickets, and recentActivity', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    // Create 3 tickets for $user
    $tickets = Ticket::factory(3)->create(['user_id' => $user->id, 'status' => 'open']);
    // Create 2 tickets for other user
    Ticket::factory(2)->create(['user_id' => $otherUser->id, 'status' => 'open']);

    // Create 1 timeline event for $user's ticket
    $timelineUser = TicketTimeline::factory()->create([
        'ticket_id' => $tickets->first()->id,
        'user_id' => $user->id,
        'event' => 'created',
        'description' => 'Ticket created',
    ]);

    // Create 1 timeline event for $otherUser's ticket
    $otherTicket = Ticket::where('user_id', $otherUser->id)->first();
    TicketTimeline::factory()->create([
        'ticket_id' => $otherTicket->id,
        'user_id' => $otherUser->id,
        'event' => 'created',
        'description' => 'Other ticket created',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                // user sees only their own counts in stats
                ->where('stats.total', 3)
                ->where('stats.open', 3)
                ->where('stats.in_progress', 0)
                // user sees only their own tickets in list
                ->has('recentTickets', 3)
                // user sees only their own timeline activity
                ->has('recentActivity', 1)
                ->where('recentActivity.0.description', 'Ticket created')
            )
        );
});

test('administrators see all tickets, priorityBreakdown, and unassignedCount', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    // Create ticket status variants
    Ticket::factory()->create(['user_id' => $user->id, 'status' => 'open', 'priority' => 'critical', 'assigned_to' => null]);
    Ticket::factory()->create(['user_id' => $user->id, 'status' => 'in_progress', 'priority' => 'high', 'assigned_to' => $admin->id]);
    Ticket::factory()->create(['user_id' => $user->id, 'status' => 'closed', 'priority' => 'low', 'assigned_to' => null]);

    // Create timeline event
    $ticket = Ticket::first();
    TicketTimeline::factory()->create([
        'ticket_id' => $ticket->id,
        'user_id' => $user->id,
        'event' => 'created',
        'description' => 'Critical ticket created',
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->missing('stats')
            ->missing('recentTickets')
            ->missing('recentActivity')
            ->missing('priorityBreakdown')
            ->missing('unassignedCount')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                // admin sees all tickets in stats
                ->where('stats.total', 3)
                ->where('stats.open', 1)
                ->where('stats.in_progress', 1)
                ->where('stats.closed', 1)
                // admin sees all tickets in list
                ->has('recentTickets', 3)
                // admin sees unassigned tickets count (status not resolved or closed, assigned_to is null -> only the open critical ticket matches)
                ->where('unassignedCount', 1)
                // admin sees priority breakdown
                ->where('priorityBreakdown.critical', 1)
                ->where('priorityBreakdown.high', 1)
                ->where('priorityBreakdown.low', 1)
                ->where('priorityBreakdown.medium', 0)
                // admin sees timeline activity of any ticket
                ->has('recentActivity', 1)
                ->where('recentActivity.0.description', 'Critical ticket created')
            )
        );
});
