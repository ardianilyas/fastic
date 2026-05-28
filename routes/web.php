<?php

use App\Http\Controllers\Admin\CannedResponseController;
use App\Http\Controllers\Admin\TicketCommentController as AdminTicketCommentController;
use App\Http\Controllers\Admin\TicketController as AdminTicketController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TicketCommentController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Notifications
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // User Ticket & Comment Resources
    Route::resource('tickets', TicketController::class)->only(['index', 'create', 'store', 'show']);
    Route::resource('tickets.comments', TicketCommentController::class)->only(['store']);

    // Admin Routes
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        // Admin Canned Responses CRUD
        Route::resource('canned-responses', CannedResponseController::class)->except(['create', 'edit', 'show']);

        // Admin Ticket & Comment Resources
        Route::resource('tickets', AdminTicketController::class)->only(['index', 'show', 'update']);
        Route::resource('tickets.comments', AdminTicketCommentController::class)->only(['store']);
    });
});

require __DIR__.'/settings.php';
