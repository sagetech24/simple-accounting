<?php

namespace Tests\Feature;

use App\Enums\PurchasedOrderPaymentMethod;
use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderItem;
use App\Models\PurchasedOrderPayment;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountsPayableTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_accounts_payable(): void
    {
        $supplier = Supplier::factory()->active()->create();

        $this->get(route('accounts-payable.index'))
            ->assertRedirect(route('login'));

        $this->get(route('accounts-payable.supplier', $supplier))
            ->assertRedirect(route('login'));
    }

    public function test_index_lists_suppliers_with_posted_orders_only(): void
    {
        $admin = User::factory()->create();
        $postedSupplier = Supplier::factory()->active()->create(['name' => 'Posted Co']);
        $otherSupplier = Supplier::factory()->active()->create(['name' => 'Other Co']);

        $posted = PurchasedOrder::factory()
            ->ordered()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $postedSupplier->id,
                'grand_total' => '100.00',
            ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $posted->id,
            'buying_price' => '100.00',
            'quantity' => 1,
            'subtotal' => '100.00',
        ]);

        PurchasedOrder::factory()
            ->ordered()
            ->create([
                'supplier_id' => $otherSupplier->id,
                'grand_total' => '50.00',
            ]);

        $this->actingAs($admin)
            ->get(route('accounts-payable.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accounts-payable/index')
                ->has('suppliers', 1)
                ->where('suppliers.0.name', 'Posted Co')
                ->where('suppliers.0.posted_order_count', 1)
                ->where('suppliers.0.balance_due', '100.00')
            );
    }

    public function test_supplier_page_lists_posted_orders_for_supplier(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();

        $order = PurchasedOrder::factory()
            ->received()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '40.00',
            ]);

        PurchasedOrder::factory()
            ->ordered()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '10.00',
            ]);

        $this->actingAs($admin)
            ->get(route('accounts-payable.supplier', $supplier))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accounts-payable/supplier')
                ->where('supplier.id', $supplier->id)
                ->has('orders', 1)
                ->where('orders.0.id', $order->id)
                ->where('orders.0.is_posted_to_ap', true)
                ->where('summary.balance_due', '40.00')
            );
    }

    public function test_supplier_summary_covers_all_posted_orders_while_filtered(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();

        PurchasedOrder::factory()
            ->ordered()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '80.00',
            ]);

        $settled = PurchasedOrder::factory()
            ->received()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '20.00',
            ]);

        PurchasedOrderPayment::factory()->create([
            'purchased_order_id' => $settled->id,
            'amount' => '20.00',
        ]);

        $this->actingAs($admin)
            ->get(route('accounts-payable.supplier', [
                'supplier' => $supplier,
                'settlement' => 'settled',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders', 1)
                ->where('summary.order_count', 2)
                ->where('summary.open_order_count', 1)
                ->where('summary.settled_order_count', 1)
                ->where('summary.visible_order_count', 1)
                ->where('summary.total_payable', '100.00')
                ->where('summary.total_paid', '20.00')
                ->where('summary.balance_due', '80.00')
            );
    }

    public function test_show_requires_posted_order_belonging_to_supplier(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $otherSupplier = Supplier::factory()->active()->create();

        $unposted = PurchasedOrder::factory()
            ->ordered()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '20.00',
            ]);

        $posted = PurchasedOrder::factory()
            ->ordered()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '20.00',
            ]);

        $this->actingAs($admin)
            ->get(route('accounts-payable.show', [$supplier, $unposted]))
            ->assertNotFound();

        $this->actingAs($admin)
            ->get(route('accounts-payable.show', [$otherSupplier, $posted]))
            ->assertNotFound();

        $this->actingAs($admin)
            ->get(route('accounts-payable.show', [$supplier, $posted]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accounts-payable/show')
                ->where('order.id', $posted->id)
                ->has('paymentMethods')
                ->has('bankAccounts')
            );
    }

    public function test_can_post_ordered_purchase_order_to_accounts_payable(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $order = PurchasedOrder::factory()
            ->ordered()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '75.00',
            ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.post-to-accounts-payable', $order))
            ->assertRedirect(route('accounts-payable.supplier', $supplier));

        $order->refresh();

        $this->assertNotNull($order->posted_to_ap_at);
        $this->assertFalse($order->canPostToAccountsPayable());
        $this->assertTrue($order->isPostedToAccountsPayable());
    }

    public function test_cannot_post_draft_or_already_posted_order(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();

        $draft = PurchasedOrder::factory()
            ->draft()
            ->create(['supplier_id' => $supplier->id]);

        $posted = PurchasedOrder::factory()
            ->ordered()
            ->postedToAccountsPayable()
            ->create(['supplier_id' => $supplier->id]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.post-to-accounts-payable', $draft))
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertNull($draft->fresh()->posted_to_ap_at);

        $this->actingAs($admin)
            ->post(route('purchased-orders.post-to-accounts-payable', $posted))
            ->assertRedirect(route('purchased-orders.index'));
    }

    public function test_can_record_settlement_payment_on_posted_order(): void
    {
        $admin = User::factory()->create(['name' => 'AP Clerk']);
        $supplier = Supplier::factory()->active()->create();
        $order = PurchasedOrder::factory()
            ->ordered()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '100.00',
            ]);

        $this->actingAs($admin)
            ->post(route('accounts-payable.payments.store', [$supplier, $order]), [
                'method' => PurchasedOrderPaymentMethod::Cash->value,
                'amount' => '40.00',
                'notes' => 'Partial settlement',
            ])
            ->assertRedirect(route('accounts-payable.show', [$supplier, $order]));

        $this->assertDatabaseHas('purchased_order_payments', [
            'purchased_order_id' => $order->id,
            'method' => PurchasedOrderPaymentMethod::Cash->value,
            'amount' => '40.00',
            'recorded_by' => 'AP Clerk',
            'notes' => 'Partial settlement',
        ]);

        $order->refresh()->load('payments');

        $this->assertSame('40.00', $order->amountPaid());
        $this->assertSame('60.00', $order->balanceDue());
        $this->assertFalse($order->toArrayPayload()['is_settled']);
    }

    public function test_settlement_payment_can_fully_settle_order(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $order = PurchasedOrder::factory()
            ->received()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '50.00',
            ]);

        PurchasedOrderPayment::factory()->create([
            'purchased_order_id' => $order->id,
            'method' => PurchasedOrderPaymentMethod::Cash,
            'amount' => '20.00',
        ]);

        $this->actingAs($admin)
            ->post(route('accounts-payable.payments.store', [$supplier, $order]), [
                'method' => PurchasedOrderPaymentMethod::Cash->value,
                'amount' => '30.00',
            ])
            ->assertRedirect(route('accounts-payable.show', [$supplier, $order]));

        $order->refresh()->load('payments');
        $payload = $order->toArrayPayload();

        $this->assertSame('50.00', $payload['amount_paid']);
        $this->assertSame('0.00', $payload['balance_due']);
        $this->assertTrue($payload['is_settled']);
        $this->assertFalse($payload['can_add_prepayment']);
    }

    public function test_purchased_order_index_exposes_ap_flags(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();

        $canPost = PurchasedOrder::factory()
            ->ordered()
            ->create(['supplier_id' => $supplier->id]);

        $posted = PurchasedOrder::factory()
            ->ordered()
            ->postedToAccountsPayable()
            ->create(['supplier_id' => $supplier->id]);

        $this->actingAs($admin)
            ->get(route('purchased-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('purchased-orders/index')
                ->where('orders.data.0.id', $posted->id)
                ->where('orders.data.0.can_post_to_ap', false)
                ->where('orders.data.0.is_posted_to_ap', true)
                ->where('orders.data.1.id', $canPost->id)
                ->where('orders.data.1.can_post_to_ap', true)
                ->where('orders.data.1.is_posted_to_ap', false)
            );
    }

    public function test_supplier_settlement_filter_open_and_settled(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();

        $open = PurchasedOrder::factory()
            ->ordered()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '80.00',
            ]);

        $settled = PurchasedOrder::factory()
            ->received()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '25.00',
            ]);

        PurchasedOrderPayment::factory()->create([
            'purchased_order_id' => $settled->id,
            'amount' => '25.00',
        ]);

        $this->actingAs($admin)
            ->get(route('accounts-payable.supplier', [
                'supplier' => $supplier,
                'settlement' => 'open',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders', 1)
                ->where('orders.0.id', $open->id)
            );

        $this->actingAs($admin)
            ->get(route('accounts-payable.supplier', [
                'supplier' => $supplier,
                'settlement' => 'settled',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders', 1)
                ->where('orders.0.id', $settled->id)
            );
    }
}
