<?php

namespace Tests\Feature;

use App\Enums\SalesOrderPaymentMethod;
use App\Models\Customer;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\SalesOrderPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountsReceivableTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_accounts_receivable_tab(): void
    {
        $this->get(route('accounts.index', ['tab' => 'accounts-receivable']))
            ->assertRedirect(route('login'));
    }

    public function test_rollup_lists_saved_customers_with_non_voided_sales_only(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create(['name' => 'Acme Retail']);
        $other = Customer::factory()->active()->create(['name' => 'No Sales Co']);
        $this->customerSale($customer, '100.00');
        SalesOrder::factory()->create([
            'customer_id' => null,
            'customer_name' => 'Acme Retail',
            'grand_total' => '50.00',
        ]);
        $voided = $this->customerSale($other, '80.00');
        $voided->delete();

        $this->actingAs($admin)
            ->get(route('accounts.index', ['tab' => 'accounts-receivable']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accounts-receivable/index')
                ->has('customers', 1)
                ->where('customers.0.name', 'Acme Retail')
                ->where('customers.0.order_count', 1)
                ->where('customers.0.open_order_count', 1)
                ->where('customers.0.total_receivable', '100.00')
                ->where('customers.0.balance_due', '100.00')
            );
    }

    public function test_rollup_includes_fully_paid_customers(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create(['name' => 'Paid Co']);
        $order = $this->customerSale($customer, '40.00');
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $order->id,
            'amount' => '40.00',
        ]);

        $this->actingAs($admin)
            ->get(route('accounts.index', ['tab' => 'accounts-receivable']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accounts-receivable/index')
                ->has('customers', 1)
                ->where('customers.0.name', 'Paid Co')
                ->where('customers.0.open_order_count', 0)
                ->where('customers.0.balance_due', '0.00')
            );
    }

    public function test_guests_cannot_view_customer_ar_page(): void
    {
        $customer = Customer::factory()->create();

        $this->get(route('accounts-receivable.customer', $customer))
            ->assertRedirect(route('login'));
    }

    public function test_customer_page_lists_non_voided_orders_and_hides_walk_in(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create();
        $this->customerSale($customer, '100.00');
        $paid = $this->customerSale($customer, '40.00');
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $paid->id,
            'amount' => '40.00',
        ]);
        SalesOrder::factory()->create([
            'customer_id' => null,
            'customer_name' => $customer->name,
            'grand_total' => '10.00',
        ]);
        $voided = $this->customerSale($customer, '5.00');
        $voided->delete();

        $this->actingAs($admin)
            ->get(route('accounts-receivable.customer', $customer))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accounts-receivable/customer')
                ->where('customer.id', $customer->id)
                ->has('orders', 2)
                ->where('summary.order_count', 2)
                ->where('summary.open_order_count', 1)
                ->where('summary.settled_order_count', 1)
                ->where('summary.total_receivable', '140.00')
            );
    }

    public function test_customer_page_open_filter_hides_settled_rows_but_keeps_summary(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create();
        $this->customerSale($customer, '100.00');
        $paid = $this->customerSale($customer, '40.00');
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $paid->id,
            'amount' => '40.00',
        ]);

        $this->actingAs($admin)
            ->get(route('accounts-receivable.customer', [
                $customer,
                'settlement' => 'open',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders', 1)
                ->where('orders.0.balance_due', '100.00')
                ->where('summary.order_count', 2)
                ->where('summary.total_receivable', '140.00')
                ->where('filters.settlement', 'open')
            );
    }

    public function test_soft_deleted_customer_still_loads_on_ar_customer_page(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create();
        $this->customerSale($customer, '25.00');
        $customer->delete();

        $this->actingAs($admin)
            ->get(route('accounts-receivable.customer', $customer))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accounts-receivable/customer')
                ->where('customer.id', $customer->id)
                ->where('customer.deleted_at', fn ($value) => filled($value))
            );
    }

    public function test_unknown_customer_ar_page_is_not_found(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->get('/accounts-receivable/999999')
            ->assertNotFound();
    }

    public function test_show_renders_customer_sales_order(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create();
        $order = $this->customerSale($customer, '100.00');

        $this->actingAs($admin)
            ->get(route('accounts-receivable.show', [$customer, $order]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accounts-receivable/show')
                ->where('customer.id', $customer->id)
                ->where('order.id', $order->id)
                ->where('order.grand_total', '100.00')
                ->has('paymentMethods')
                ->has('bankAccounts')
            );
    }

    public function test_show_rejects_walk_in_other_customer_and_voided_orders(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create();
        $other = Customer::factory()->active()->create();
        $foreign = $this->customerSale($other, '10.00');
        $walkIn = SalesOrder::factory()->create([
            'customer_id' => null,
            'grand_total' => '10.00',
        ]);
        $voided = $this->customerSale($customer, '10.00');
        $voided->delete();

        $this->actingAs($admin)
            ->get(route('accounts-receivable.show', [$customer, $foreign]))
            ->assertNotFound();

        $this->actingAs($admin)
            ->get('/accounts-receivable/'.$customer->id.'/'.$walkIn->id)
            ->assertNotFound();

        $this->actingAs($admin)
            ->get('/accounts-receivable/'.$customer->id.'/'.$voided->id)
            ->assertNotFound();
    }

    public function test_add_payment_from_ar_returns_to_ar_show(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create();
        $order = $this->customerSale($customer, '100.00');

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::Cash->value,
                'amount' => '25.00',
                'return_to' => 'accounts-receivable',
            ])
            ->assertRedirect(route('accounts-receivable.show', [$customer, $order]));

        $this->assertDatabaseHas('sales_order_payments', [
            'sales_order_id' => $order->id,
            'amount' => '25.00',
        ]);
    }

    public function test_void_payment_from_ar_returns_to_ar_show(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create();
        $order = $this->customerSale($customer, '100.00');
        $payment = SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $order->id,
            'amount' => '10.00',
        ]);

        $this->actingAs($admin)
            ->delete(route('sales-orders.payments.destroy', [$order, $payment]), [
                'return_to' => 'accounts-receivable',
            ])
            ->assertRedirect(route('accounts-receivable.show', [$customer, $order]));

        $this->assertDatabaseMissing('sales_order_payments', [
            'id' => $payment->id,
        ]);
    }

    public function test_add_payment_without_return_to_still_goes_to_sales_orders(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create();
        $order = $this->customerSale($customer, '100.00');

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::Cash->value,
                'amount' => '10.00',
            ])
            ->assertRedirect(route('sales-orders.index'));
    }

    public function test_walk_in_ignores_ar_return_to(): void
    {
        $admin = User::factory()->create();
        $order = SalesOrder::factory()->create(['grand_total' => '50.00']);

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::Cash->value,
                'amount' => '10.00',
                'return_to' => 'accounts-receivable',
            ])
            ->assertRedirect(route('sales-orders.index'));
    }

    private function customerSale(Customer $customer, string $total): SalesOrder
    {
        $order = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => $total,
            'subtotal' => $total,
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $order->id,
            'selling_price' => $total,
            'quantity' => 1,
            'subtotal' => $total,
        ]);

        return $order;
    }
}
