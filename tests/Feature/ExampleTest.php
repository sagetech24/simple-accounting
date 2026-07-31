<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_see_landing_page_at_home(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('landing/index'));
    }

    public function test_authenticated_users_see_dashboard_at_home(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/index')
                ->has('kpis')
                ->has('attention')
            );
    }

    public function test_authenticated_users_can_view_products(): void
    {
        $this->seed();

        $this->actingAs(User::factory()->create())
            ->get(route('products'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('products/index'));
    }

    public function test_authenticated_users_can_view_inventory(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->get(route('inventory.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('inventory/index'));
    }

    public function test_authenticated_users_can_view_purchased_orders(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->get(route('purchased-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('purchased-orders/index'));
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
