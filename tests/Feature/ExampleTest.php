<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_home_to_login(): void
    {
        $this->get('/')
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_home(): void
    {
        $this->seed();

        $this->actingAs(User::factory()->create())
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('home'));
    }

    public function test_login_page_is_shown(): void
    {
        $this->get('/login')
            ->assertOk();
    }

    public function test_login_redirects_to_home(): void
    {
        $this->seed();

        $this->post(route('login.store'), [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertRedirect(route('home'));
    }
}
