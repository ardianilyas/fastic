<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Mark a single notification as read and redirect to the corresponding ticket show page.
     */
    public function markAsRead(Request $request, string $id): RedirectResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);

        $notification->markAsRead();

        $data = $notification->data;
        $ticketId = $data['ticket_id'] ?? null;

        if ($ticketId) {
            $isAdmin = $request->user()->isAdmin();
            $route = $isAdmin ? 'admin.tickets.show' : 'tickets.show';

            return redirect()->route($route, $ticketId);
        }

        return redirect()->back();
    }

    /**
     * Mark all unread notifications of the authenticated user as read.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return redirect()->back()->with('success', 'All notifications marked as read.');
    }
}
