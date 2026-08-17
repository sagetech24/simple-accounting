<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\SalesOrder;
use App\Models\SalesOrderPayment;
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

    public function test_kpis_ignore_voided_walk_in_and_other_customers(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->create(['name' => 'Acme Retail Co.']);
        $other = Customer::factory()->create(['name' => 'Other Co.']);

        $active = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '100.00',
        ]);
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $active->id,
            'amount' => '40.00',
        ]);

        $voided = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '200.00',
        ]);
        $voided->delete();

        SalesOrder::factory()->create([
            'customer_id' => null,
            'customer_name' => 'Acme Retail Co.',
            'grand_total' => '500.00',
        ]);
        SalesOrder::factory()->create([
            'customer_id' => null,
            'customer_name' => null,
            'grand_total' => '25.00',
        ]);
        SalesOrder::factory()->create([
            'customer_id' => $other->id,
            'grand_total' => '300.00',
        ]);

        $this->actingAs($admin)
            ->get(route('customers.show', $customer))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('kpis.order_count', 1)
                ->where('kpis.lifetime_sales', '100.00')
                ->where('kpis.outstanding', '60.00')
                ->where('kpis.last_order_at', fn ($value) => filled($value))
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $active->id)
            );
    }

    public function test_orders_trash_filter_defaults_to_active_and_can_include_voided(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->create();

        $active = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '10.00',
        ]);
        $voided = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '20.00',
        ]);
        $voided->delete();

        $this->actingAs($admin)
            ->get(route('customers.show', $customer))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $active->id)
            );

        $this->actingAs($admin)
            ->get(route('customers.show', ['customer' => $customer, 'trashed' => 'only']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.trashed', 'only')
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $voided->id)
            );

        $this->actingAs($admin)
            ->get(route('customers.show', ['customer' => $customer, 'trashed' => 'with']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.trashed', 'with')
                ->has('orders.data', 2)
            );
    }

    public function test_payments_tab_lists_this_customer_only_with_order_reference(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->create();
        $other = Customer::factory()->create();

        $order = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '80.00',
        ]);
        $payment = SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $order->id,
            'amount' => '80.00',
            'recorded_by' => 'Admin',
        ]);

        $otherOrder = SalesOrder::factory()->create([
            'customer_id' => $other->id,
            'grand_total' => '50.00',
        ]);
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $otherOrder->id,
            'amount' => '50.00',
        ]);

        $this->actingAs($admin)
            ->get(route('customers.show', ['customer' => $customer, 'tab' => 'payments']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.tab', 'payments')
                ->has('payments.data', 1)
                ->where('payments.data.0.id', $payment->id)
                ->where('payments.data.0.sales_order_reference', $order->reference)
                ->where('payments.data.0.sales_order.id', $order->id)
                ->where('payments.data.0.amount', '80.00')
            );
    }
}
