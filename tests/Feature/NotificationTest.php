<?php

use App\Models\Category;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\User;

test('guests cannot access notification endpoints', function () {
    $this->post(route('notifications.read', 'some-uuid'))
        ->assertRedirect(route('login'));

    $this->post(route('notifications.read-all'))
        ->assertRedirect(route('login'));
});

test('user submitting ticket notifies all administrators', function () {
    $user = User::factory()->create();
    $admin1 = User::factory()->admin()->create();
    $admin2 = User::factory()->admin()->create();
    $category = Category::factory()->create();

    $this->assertCount(0, $admin1->notifications);
    $this->assertCount(0, $admin2->notifications);

    $response = $this->actingAs($user)
        ->post(route('tickets.store'), [
            'category_id' => $category->id,
            'title' => 'Broken keyboard',
            'description' => 'Enter key does not work.',
            'priority' => 'medium',
        ]);

    $ticket = Ticket::first();
    $response->assertRedirect(route('tickets.show', $ticket->id));

    // Verify database notifications exist for all admins
    $this->assertCount(1, $admin1->refresh()->notifications);
    $this->assertCount(1, $admin2->refresh()->notifications);

    $notification = $admin1->notifications()->first();
    expect($notification->data['ticket_id'])->toBe($ticket->id);
    expect($notification->data['type'])->toBe('created');
    expect($notification->data['message'])->toContain('Broken keyboard');
});

test('admin status changes notify the ticket creator', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $ticket = Ticket::factory()->create(['user_id' => $user->id, 'status' => 'open']);

    $this->assertCount(0, $user->notifications);

    $response = $this->actingAs($admin)
        ->put(route('admin.tickets.update', $ticket->id), [
            'status' => 'in_progress',
        ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket->id));

    // Verify creator received notification
    $this->assertCount(1, $user->refresh()->notifications);
    $notification = $user->notifications()->first();
    expect($notification->data['ticket_id'])->toBe($ticket->id);
    expect($notification->data['type'])->toBe('status_changed');
    expect($notification->data['message'])->toContain('status has been updated from open to in_progress');
});

test('ticket assignment notifies the assigned administrator', function () {
    $admin = User::factory()->admin()->create();
    $assignee = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create(['assigned_to' => null]);

    $this->assertCount(0, $assignee->notifications);

    $response = $this->actingAs($admin)
        ->put(route('admin.tickets.update', $ticket->id), [
            'assigned_to' => $assignee->id,
        ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket->id));

    // Verify assignee received notification
    $this->assertCount(1, $assignee->refresh()->notifications);
    $notification = $assignee->notifications()->first();
    expect($notification->data['ticket_id'])->toBe($ticket->id);
    expect($notification->data['type'])->toBe('assigned');
    expect($notification->data['message'])->toContain('You have been assigned to ticket');
});

test('user public reply on ticket notifies assignee or all admins if unassigned', function () {
    $user = User::factory()->create();
    $admin1 = User::factory()->admin()->create();
    $admin2 = User::factory()->admin()->create();

    // Case 1: Unassigned ticket comment notifies all admins
    $ticketUnassigned = Ticket::factory()->create(['user_id' => $user->id, 'assigned_to' => null]);

    $this->actingAs($user)
        ->post(route('tickets.comments.store', $ticketUnassigned->id), [
            'body' => 'Still having this issue',
        ])
        ->assertRedirect();

    $this->assertCount(1, $admin1->refresh()->notifications);
    $this->assertCount(1, $admin2->refresh()->notifications);

    // Case 2: Assigned ticket comment notifies only assignee
    $ticketAssigned = Ticket::factory()->create(['user_id' => $user->id, 'assigned_to' => $admin1->id]);
    $admin1->notifications()->delete();
    $admin2->notifications()->delete();

    $this->actingAs($user)
        ->post(route('tickets.comments.store', $ticketAssigned->id), [
            'body' => 'Need help soon',
        ])
        ->assertRedirect();

    $this->assertCount(1, $admin1->refresh()->notifications);
    $this->assertCount(0, $admin2->refresh()->notifications);
});

test('admin public reply notifies ticket creator, but internal comment does not', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();
    $ticket = Ticket::factory()->create(['user_id' => $user->id]);

    $this->assertCount(0, $user->notifications);

    // 1. Internal Note -> No notification to creator
    $this->actingAs($admin)
        ->post(route('admin.tickets.comments.store', $ticket->id), [
            'body' => 'Investigating backend DB logs',
            'is_internal' => true,
        ])
        ->assertRedirect();

    $this->assertCount(0, $user->refresh()->notifications);

    // 2. Public Reply -> Creator notified
    $this->actingAs($admin)
        ->post(route('admin.tickets.comments.store', $ticket->id), [
            'body' => 'Please clear cache and try again',
            'is_internal' => false,
        ])
        ->assertRedirect();

    $this->assertCount(1, $user->refresh()->notifications);
    $notification = $user->notifications()->first();
    expect($notification->data['type'])->toBe('comment_added');
    expect($notification->data['message'])->toContain('New public reply on ticket');
});

test('user can mark single notification read and redirect', function () {
    $user = User::factory()->create();
    $admin = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create(['user_id' => $user->id]);

    // Send a notification
    $this->actingAs($admin)->put(route('admin.tickets.update', $ticket->id), ['status' => 'in_progress']);
    $user->refresh();

    $this->assertCount(1, $user->unreadNotifications);
    $notification = $user->unreadNotifications->first();

    $this->actingAs($user)
        ->post(route('notifications.read', $notification->id))
        ->assertRedirect(route('tickets.show', $ticket->id));

    expect($user->refresh()->unreadNotifications)->toHaveCount(0);
});

test('user can mark all notifications read', function () {
    $user = User::factory()->create();
    $admin = User::factory()->admin()->create();
    $ticket1 = Ticket::factory()->create(['user_id' => $user->id]);
    $ticket2 = Ticket::factory()->create(['user_id' => $user->id]);

    // Send two notifications
    $this->actingAs($admin)->put(route('admin.tickets.update', $ticket1->id), ['status' => 'in_progress']);
    $this->actingAs($admin)->put(route('admin.tickets.update', $ticket2->id), ['status' => 'waiting']);
    $user->refresh();

    $this->assertCount(2, $user->unreadNotifications);

    $this->actingAs($user)
        ->post(route('notifications.read-all'))
        ->assertRedirect();

    expect($user->refresh()->unreadNotifications)->toHaveCount(0);
});
