<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CannedResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CannedResponseController extends Controller
{
    /**
     * Display a listing of the canned responses.
     */
    public function index(): Response
    {
        $cannedResponses = CannedResponse::orderBy('title', 'asc')
            ->paginate(6, ['id', 'title', 'shortcut', 'body', 'created_at']);

        return Inertia::render('admin/canned-responses/index', [
            'cannedResponses' => $cannedResponses,
        ]);
    }

    /**
     * Store a newly created canned response.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:canned_responses,title',
            'shortcut' => 'required|string|max:50|unique:canned_responses,shortcut|regex:/^\/[a-zA-Z0-9_-]+$/',
            'body' => 'required|string',
        ], [
            'shortcut.regex' => 'The shortcut must start with a slash (/) followed by alphanumeric characters, dashes, or underscores.',
        ]);

        CannedResponse::create($validated);

        return redirect()->route('admin.canned-responses.index')
            ->with('success', 'Canned response created successfully.');
    }

    /**
     * Update the specified canned response.
     */
    public function update(Request $request, CannedResponse $cannedResponse): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:canned_responses,title,'.$cannedResponse->id,
            'shortcut' => 'required|string|max:50|unique:canned_responses,shortcut,'.$cannedResponse->id.'|regex:/^\/[a-zA-Z0-9_-]+$/',
            'body' => 'required|string',
        ], [
            'shortcut.regex' => 'The shortcut must start with a slash (/) followed by alphanumeric characters, dashes, or underscores.',
        ]);

        $cannedResponse->update($validated);

        return redirect()->route('admin.canned-responses.index')
            ->with('success', 'Canned response updated successfully.');
    }

    /**
     * Remove the specified canned response.
     */
    public function destroy(CannedResponse $cannedResponse): RedirectResponse
    {
        $cannedResponse->delete();

        return redirect()->route('admin.canned-responses.index')
            ->with('success', 'Canned response deleted successfully.');
    }
}
