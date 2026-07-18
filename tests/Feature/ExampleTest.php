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

    public function test_authenticated_users_are_redirected_from_home_to_products(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/')
            ->assertRedirect('/products');
    }

    public function test_authenticated_users_can_view_products(): void
    {
        $this->seed();

        $this->actingAs(User::factory()->create())
            ->get(route('products'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('products/index'));
    }

    public function test_authenticated_users_can_view_stub_sections(): void
    {
        $admin = User::factory()->create();

        $pages = [
            'suppliers' => 'suppliers/index',
            'customers' => 'customers/index',
            'request-quotations' => 'request-quotations/index',
            'purchased-orders' => 'purchased-orders/index',
            'received-orders' => 'received-orders/index',
        ];

        foreach ($pages as $route => $component) {
            $this->actingAs($admin)
                ->get(route($route))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component($component));
        }
    }

    public function test_login_page_is_shown(): void
    {
        $this->get('/login')
            ->assertOk();
    }

    public function test_login_redirects_to_products(): void
    {
        $this->seed();

        $this->post(route('login.store'), [
            'email' => 'admin@example.com',
            'password' => 'password',
        ])->assertRedirect(route('products'));
    }
}
