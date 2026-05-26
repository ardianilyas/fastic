<?php

use App\Models\Category;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guest cannot access categories crud', function () {
    $this->get(route('admin.categories.index'))
        ->assertRedirect(route('login'));

    $this->post(route('admin.categories.store'), ['name' => 'New Category'])
        ->assertRedirect(route('login'));
});

test('non-admin user cannot access categories crud', function () {
    $user = User::factory()->create(); // default role is 'user'

    $this->actingAs($user)
        ->get(route('admin.categories.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->post(route('admin.categories.store'), ['name' => 'New Category'])
        ->assertForbidden();
});

test('admin user can view categories list', function () {
    $admin = User::factory()->admin()->create();
    $categories = Category::factory(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.categories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/categories/index')
            ->has('categories.data', 3)
        );
});

test('admin user can create a category', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)
        ->post(route('admin.categories.store'), [
            'name' => 'Networking',
            'description' => 'Wifi and Ethernet connectivity',
            'is_active' => true,
        ]);

    $response->assertRedirect(route('admin.categories.index'));

    $this->assertDatabaseHas('categories', [
        'name' => 'Networking',
        'description' => 'Wifi and Ethernet connectivity',
        'is_active' => 1,
    ]);
});

test('admin user can update a category', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::factory()->create([
        'name' => 'Old Name',
        'description' => 'Old Description',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->put(route('admin.categories.update', $category->id), [
            'name' => 'New Name',
            'description' => 'New Description',
            'is_active' => false,
        ]);

    $response->assertRedirect(route('admin.categories.index'));

    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
        'name' => 'New Name',
        'description' => 'New Description',
        'is_active' => 0,
    ]);
});

test('admin user can delete a category', function () {
    $admin = User::factory()->admin()->create();
    $category = Category::factory()->create();

    $response = $this->actingAs($admin)
        ->delete(route('admin.categories.destroy', $category->id));

    $response->assertRedirect(route('admin.categories.index'));

    $this->assertDatabaseMissing('categories', [
        'id' => $category->id,
    ]);
});
