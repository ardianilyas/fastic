<?php

use App\Models\Category;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest cannot access ticket index, create, store, or show', function () {
    $this->get(route('tickets.index'))
        ->assertRedirect(route('login'));

    $this->get(route('tickets.create'))
        ->assertRedirect(route('login'));

    $this->post(route('tickets.store'), [])
        ->assertRedirect(route('login'));

    $this->get(route('tickets.show', 'some-uuid'))
        ->assertRedirect(route('login'));
});

test('regular user can view their own tickets list', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Ticket::factory(2)->create(['user_id' => $user->id]);
    Ticket::factory(1)->create(['user_id' => $otherUser->id]);

    $this->actingAs($user)
        ->get(route('tickets.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('tickets/index')
            ->has('tickets.data', 2)
        );
});

test('regular user can view create ticket page with active categories', function () {
    $user = User::factory()->create();
    Category::factory()->create(['name' => 'Active Cat', 'is_active' => true]);
    Category::factory()->create(['name' => 'Inactive Cat', 'is_active' => false]);

    $this->actingAs($user)
        ->get(route('tickets.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('tickets/create')
            ->has('categories', 1)
            ->where('categories.0.name', 'Active Cat')
        );
});

test('regular user can create a ticket', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('tickets.store'), [
            'category_id' => $category->id,
            'title' => 'My Screen Flickers',
            'description' => 'Secondary monitor keeps blinking.',
            'priority' => 'high',
        ]);

    $ticket = Ticket::first();
    $response->assertRedirect(route('tickets.show', $ticket->id));

    $this->assertDatabaseHas('tickets', [
        'title' => 'My Screen Flickers',
        'description' => 'Secondary monitor keeps blinking.',
        'priority' => 'high',
        'status' => 'open',
    ]);

    $this->assertDatabaseHas('ticket_timelines', [
        'ticket_id' => $ticket->id,
        'event' => 'created',
        'new_value' => 'open',
    ]);
});

test('regular user can view their own ticket details, but internal comments are hidden', function () {
    $user = User::factory()->create();
    $admin = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create(['user_id' => $user->id]);

    // Public comment
    Comment::factory()->create([
        'ticket_id' => $ticket->id,
        'user_id' => $user->id,
        'body' => 'Public text',
        'is_internal' => false,
    ]);

    // Internal comment
    Comment::factory()->internal()->create([
        'ticket_id' => $ticket->id,
        'user_id' => $admin->id,
        'body' => 'Secret text',
    ]);

    $this->actingAs($user)
        ->get(route('tickets.show', $ticket->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('tickets/show')
            ->has('ticket.comments', 1)
            ->where('ticket.comments.0.body', 'Public text')
        );
});

test('regular user cannot view other users ticket details', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $ticket = Ticket::factory()->create(['user_id' => $otherUser->id]);

    $this->actingAs($user)
        ->get(route('tickets.show', $ticket->id))
        ->assertForbidden();
});

test('regular user can post a public reply to their own ticket', function () {
    $user = User::factory()->create();
    $ticket = Ticket::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->post(route('tickets.comments.store', $ticket->id), [
            'body' => 'Thanks for the quick reply!',
        ]);

    $response->assertRedirect(route('tickets.show', $ticket->id));

    $this->assertDatabaseHas('comments', [
        'ticket_id' => $ticket->id,
        'body' => 'Thanks for the quick reply!',
        'is_internal' => 0,
    ]);
});

test('guest or non-admin cannot access admin tickets control board', function () {
    $user = User::factory()->create();

    $this->get(route('admin.tickets.index'))
        ->assertRedirect(route('login'));

    $this->actingAs($user)
        ->get(route('admin.tickets.index'))
        ->assertForbidden();
});

test('admin can view all tickets list with counter stats', function () {
    $admin = User::factory()->admin()->create();
    $userA = User::factory()->create();
    $userB = User::factory()->create();

    Ticket::factory(2)->create(['user_id' => $userA->id, 'status' => 'open']);
    Ticket::factory(1)->create(['user_id' => $userB->id, 'status' => 'in_progress']);

    $this->actingAs($admin)
        ->get(route('admin.tickets.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/tickets/index')
            ->has('tickets.data', 3)
            ->where('stats.total', 3)
            ->where('stats.open', 2)
            ->where('stats.in_progress', 1)
        );
});

test('admin can view ticket details including internal notes', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $ticket = Ticket::factory()->create(['user_id' => $user->id]);

    Comment::factory()->internal()->create([
        'ticket_id' => $ticket->id,
        'user_id' => $admin->id,
        'body' => 'Secret text',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.tickets.show', $ticket->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/tickets/show')
            ->has('ticket.comments', 1)
            ->where('ticket.comments.0.body', 'Secret text')
        );
});

test('admin can update status, priority, and assign support ticket', function () {
    $admin = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create();

    $response = $this->actingAs($admin)
        ->put(route('admin.tickets.update', $ticket->id), [
            'status' => 'in_progress',
            'priority' => 'critical',
            'assigned_to' => $admin->id,
        ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket->id));

    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'status' => 'in_progress',
        'priority' => 'critical',
        'assigned_to' => $admin->id,
    ]);

    $this->assertDatabaseHas('ticket_timelines', [
        'ticket_id' => $ticket->id,
        'event' => 'status_changed',
        'new_value' => 'in_progress',
    ]);

    $this->assertDatabaseHas('ticket_timelines', [
        'ticket_id' => $ticket->id,
        'event' => 'priority_changed',
        'new_value' => 'critical',
    ]);

    $this->assertDatabaseHas('ticket_timelines', [
        'ticket_id' => $ticket->id,
        'event' => 'assigned',
        'new_value' => $admin->name,
    ]);
});

test('admin can post internal notes and public replies', function () {
    $admin = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create();

    // 1. Post internal note
    $response = $this->actingAs($admin)
        ->post(route('admin.tickets.comments.store', $ticket->id), [
            'body' => 'Checking logs',
            'is_internal' => true,
        ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket->id));

    $this->assertDatabaseHas('comments', [
        'ticket_id' => $ticket->id,
        'body' => 'Checking logs',
        'is_internal' => 1,
    ]);

    // 2. Post public reply
    $response2 = $this->actingAs($admin)
        ->post(route('admin.tickets.comments.store', $ticket->id), [
            'body' => 'Please restart your PC',
            'is_internal' => false,
        ]);

    $response2->assertRedirect(route('admin.tickets.show', $ticket->id));

    $this->assertDatabaseHas('comments', [
        'ticket_id' => $ticket->id,
        'body' => 'Please restart your PC',
        'is_internal' => 0,
    ]);
});
