<?php

use App\Models\CannedResponse;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest cannot access canned responses crud', function () {
    $this->get(route('admin.canned-responses.index'))
        ->assertRedirect(route('login'));

    $this->post(route('admin.canned-responses.store'), [
        'title' => 'New Template',
        'shortcut' => '/new',
        'body' => 'Body content',
    ])->assertRedirect(route('login'));
});

test('non-admin user cannot access canned responses crud', function () {
    $user = User::factory()->create(); // default role is 'user'

    $this->actingAs($user)
        ->get(route('admin.canned-responses.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->post(route('admin.canned-responses.store'), [
            'title' => 'New Template',
            'shortcut' => '/new',
            'body' => 'Body content',
        ])->assertForbidden();
});

test('admin user can view canned responses list', function () {
    $admin = User::factory()->admin()->create();
    CannedResponse::factory(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.canned-responses.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/canned-responses/index')
            ->has('cannedResponses.data', 3)
        );
});

test('admin user can create a canned response', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.canned-responses.store'), [
            'title' => 'Greeting Template',
            'shortcut' => '/greet',
            'body' => 'Hello user, thank you for writing in.',
        ]);

    $response->assertRedirect(route('admin.canned-responses.index'));

    $this->assertDatabaseHas('canned_responses', [
        'title' => 'Greeting Template',
        'shortcut' => '/greet',
        'body' => 'Hello user, thank you for writing in.',
    ]);
});

test('admin user cannot create canned response with invalid shortcut format', function () {
    $admin = User::factory()->admin()->create();

    // No leading slash
    $response = $this->actingAs($admin)
        ->post(route('admin.canned-responses.store'), [
            'title' => 'Invalid Shortcut Template',
            'shortcut' => 'greet',
            'body' => 'Hello user.',
        ]);

    $response->assertSessionHasErrors(['shortcut']);
    $this->assertDatabaseMissing('canned_responses', [
        'title' => 'Invalid Shortcut Template',
    ]);
});

test('admin user can update a canned response', function () {
    $admin = User::factory()->admin()->create();
    $cannedResponse = CannedResponse::factory()->create([
        'title' => 'Old Title',
        'shortcut' => '/old',
        'body' => 'Old body content',
    ]);

    $response = $this->actingAs($admin)
        ->put(route('admin.canned-responses.update', $cannedResponse->id), [
            'title' => 'New Title',
            'shortcut' => '/new',
            'body' => 'New body content',
        ]);

    $response->assertRedirect(route('admin.canned-responses.index'));

    $this->assertDatabaseHas('canned_responses', [
        'id' => $cannedResponse->id,
        'title' => 'New Title',
        'shortcut' => '/new',
        'body' => 'New body content',
    ]);
});

test('admin user can delete a canned response', function () {
    $admin = User::factory()->admin()->create();
    $cannedResponse = CannedResponse::factory()->create();

    $response = $this->actingAs($admin)
        ->delete(route('admin.canned-responses.destroy', $cannedResponse->id));

    $response->assertRedirect(route('admin.canned-responses.index'));

    $this->assertDatabaseMissing('canned_responses', [
        'id' => $cannedResponse->id,
    ]);
});
