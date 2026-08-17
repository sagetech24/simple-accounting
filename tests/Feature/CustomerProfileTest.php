<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_customer_profile(): void
    {
        $customer = Customer::factory()->create();

        $this->get(route('customers.show', $customer))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_customer_profile(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->create(['name' => 'Acme Retail Co.']);

        $this->actingAs($admin)
            ->get(route('customers.show', $customer))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customers/show')
                ->where('customer.name', 'Acme Retail Co.')
                ->has('kpis.order_count')
                ->has('kpis.lifetime_sales')
                ->has('kpis.outstanding')
                ->has('kpis.last_order_at')
                ->has('orders.data')
                ->has('payments.data')
                ->has('statuses')
                ->where('filters.tab', 'orders')
                ->where('filters.trashed', '')
            );
    }

    public function test_missing_customer_profile_is_not_found(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->get('/customers/999999')
            ->assertNotFound();
    }

    public function test_soft_deleted_customer_profile_still_loads(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->create(['name' => 'Trashed Co.']);
        $customer->delete();

        $this->actingAs($admin)
            ->get(route('customers.show', $customer))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customers/show')
                ->where('customer.name', 'Trashed Co.')
                ->where('customer.deleted_at', fn ($value) => filled($value))
            );
    }
}
