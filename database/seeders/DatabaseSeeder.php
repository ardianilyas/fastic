<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\TicketTimeline;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Admin User
        $admin = User::factory()->admin()->create([
            'name' => 'Ardian Admin',
            'email' => 'ardian@fastic.com',
            'password' => Hash::make('developer'),
        ]);

        // Seed Regular User
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'user@fastic.test',
        ]);

        // Seed Categories
        $categories = collect([
            'Hardware' => 'Problem with physical devices like laptop, monitor, keyboard.',
            'Software' => 'Issues with applications, OS, or licenses.',
            'Network' => 'VPN, wifi, internet connectivity issues.',
            'Access & Permissions' => 'Request access to tools, databases, or shared folders.',
        ])->map(function ($description, $name) {
            return Category::factory()->create([
                'name' => $name,
                'description' => $description,
            ]);
        });

        // Seed Tickets with Comments and Timelines
        Ticket::factory(5)->create([
            'user_id' => $user->id,
            'category_id' => fn () => $categories->random()->id,
        ])->each(function (Ticket $ticket) use ($admin, $user) {
            // Seed a comment
            Comment::factory()->create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'body' => 'I am having issues with this. Please help.',
                'is_internal' => false,
            ]);

            // Seed an admin internal comment
            Comment::factory()->internal()->create([
                'ticket_id' => $ticket->id,
                'user_id' => $admin->id,
                'body' => 'Checking system logs to debug this.',
            ]);

            // Seed a timeline event
            TicketTimeline::factory()->create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'event' => 'created',
                'old_value' => null,
                'new_value' => 'open',
                'description' => 'Ticket was submitted by John Doe',
            ]);
        });
    }
}
