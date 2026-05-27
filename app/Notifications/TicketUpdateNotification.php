<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TicketUpdateNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public string $ticketId,
        public string $ticketCode,
        public string $ticketTitle,
        public string $message,
        public string $type
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'ticket_id' => $this->ticketId,
            'ticket_code' => $this->ticketCode,
            'ticket_title' => $this->ticketTitle,
            'message' => $this->message,
            'type' => $this->type,
        ];
    }
}
