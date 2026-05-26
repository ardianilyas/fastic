<?php

namespace App\Models;

use Database\Factories\TicketTimelineFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['ticket_id', 'user_id', 'event', 'old_value', 'new_value', 'description'])]
class TicketTimeline extends Model
{
    /** @use HasFactory<TicketTimelineFactory> */
    use HasFactory, HasUuids;

    /**
     * Get the ticket associated with this timeline event.
     *
     * @return BelongsTo<Ticket, $this>
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    /**
     * Get the user who triggered the timeline event.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
