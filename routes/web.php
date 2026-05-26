<?php

use App\Http\Controllers\Admin\TicketCommentController as AdminTicketCommentController;
use App\Http\Controllers\Admin\TicketController as AdminTicketController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\TicketCommentController;
use App\Http\Controllers\TicketController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // User Ticket & Comment Resources
    Route::resource('tickets', TicketController::class)->only(['index', 'create', 'store', 'show']);
    Route::resource('tickets.comments', TicketCommentController::class)->only(['store']);

    // Admin Routes
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        // Admin Ticket & Comment Resources
        Route::resource('tickets', AdminTicketController::class)->only(['index', 'show', 'update']);
        Route::resource('tickets.comments', AdminTicketCommentController::class)->only(['store']);
    });
});

require __DIR__.'/settings.php';
