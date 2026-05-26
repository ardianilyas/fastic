<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\TicketTimeline;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TicketTimeline>
 */
class TicketTimelineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ticket_id' => Ticket::factory(),
            'user_id' => User::factory(),
            'event' => 'status_changed',
            'old_value' => 'open',
            'new_value' => 'in_progress',
            'description' => 'Ticket status changed from open to in progress',
        ];
    }
}
