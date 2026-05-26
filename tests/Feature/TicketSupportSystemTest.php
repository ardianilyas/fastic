<?php

use App\Models\Category;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\TicketTimeline;
use App\Models\User;
use Illuminate\Support\Str;

test('user has default role and admin states work', function () {
    $user = User::factory()->create();
    expect($user->role)->toBe('user');
    expect($user->isUser())->toBeTrue();
    expect($user->isAdmin())->toBeFalse();

    $admin = User::factory()->admin()->create();
    expect($admin->role)->toBe('admin');
    expect($admin->isUser())->toBeFalse();
    expect($admin->isAdmin())->toBeTrue();
});

test('category uses UUID and is active by default', function () {
    $category = Category::factory()->create();

    expect(Str::isUuid($category->id))->toBeTrue();
    expect($category->is_active)->toBeTrue();
    expect($category->description)->toBeString();
});

test('ticket uses UUID and has correct defaults and relationships', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create();
    $assignee = User::factory()->admin()->create();

    $ticket = Ticket::factory()
        ->assignedTo($assignee)
        ->create([
            'user_id' => $user->id,
            'category_id' => $category->id,
            'title' => 'Broken Monitor',
            'description' => 'My secondary monitor is flickering.',
        ]);

    expect(Str::isUuid($ticket->id))->toBeTrue();
    expect($ticket->status)->toBe('open');
    expect($ticket->priority)->toBe('medium');
    expect($ticket->user->id)->toBe($user->id);
    expect($ticket->category->id)->toBe($category->id);
    expect($ticket->assignee->id)->toBe($assignee->id);

    // Verify ticket has many categories relation (via category has many tickets)
    expect($category->tickets)->toHaveCount(1);
    expect($category->tickets->first()->id)->toBe($ticket->id);
});

test('ticket status and priority states work in factory', function () {
    $ticketInProgress = Ticket::factory()->inProgress()->create();
    expect($ticketInProgress->status)->toBe('in_progress');

    $ticketWaiting = Ticket::factory()->waiting()->create();
    expect($ticketWaiting->status)->toBe('waiting');

    $ticketResolved = Ticket::factory()->resolved()->create();
    expect($ticketResolved->status)->toBe('resolved');
    expect($ticketResolved->resolved_at)->not->toBeNull();

    $ticketClosed = Ticket::factory()->closed()->create();
    expect($ticketClosed->status)->toBe('closed');
    expect($ticketClosed->closed_at)->not->toBeNull();

    $ticketLow = Ticket::factory()->lowPriority()->create();
    expect($ticketLow->priority)->toBe('low');

    $ticketHigh = Ticket::factory()->highPriority()->create();
    expect($ticketHigh->priority)->toBe('high');

    $ticketCritical = Ticket::factory()->criticalPriority()->create();
    expect($ticketCritical->priority)->toBe('critical');
});

test('comment uses UUID, has correct defaults and relationships', function () {
    $ticket = Ticket::factory()->create();
    $user = User::factory()->create();

    $comment = Comment::factory()->create([
        'ticket_id' => $ticket->id,
        'user_id' => $user->id,
        'body' => 'I verified that the cables are plugged in.',
    ]);

    expect(Str::isUuid($comment->id))->toBeTrue();
    expect($comment->is_internal)->toBeFalse();
    expect($comment->ticket->id)->toBe($ticket->id);
    expect($comment->user->id)->toBe($user->id);

    // Verify ticket comments relationship
    expect($ticket->comments)->toHaveCount(1);
    expect($ticket->comments->first()->id)->toBe($comment->id);

    // Verify internal comment state
    $internalComment = Comment::factory()->internal()->create();
    expect($internalComment->is_internal)->toBeTrue();
});

test('ticket timeline uses UUID and has correct relationships', function () {
    $ticket = Ticket::factory()->create();
    $admin = User::factory()->admin()->create();

    $timeline = TicketTimeline::factory()->create([
        'ticket_id' => $ticket->id,
        'user_id' => $admin->id,
        'event' => 'assigned',
        'old_value' => null,
        'new_value' => $admin->name,
        'description' => "Ticket assigned to {$admin->name}",
    ]);

    expect(Str::isUuid($timeline->id))->toBeTrue();
    expect($timeline->ticket->id)->toBe($ticket->id);
    expect($timeline->user->id)->toBe($admin->id);
    expect($timeline->event)->toBe('assigned');
    expect($timeline->new_value)->toBe($admin->name);

    // Verify ticket timelines relationship
    expect($ticket->timelines)->toHaveCount(1);
    expect($ticket->timelines->first()->id)->toBe($timeline->id);
});
