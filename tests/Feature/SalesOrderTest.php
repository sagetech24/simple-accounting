<?php

namespace Tests\Feature;

use App\Enums\CustomerStatus;
use App\Enums\SalesOrderPaymentMethod;
use App\Enums\StockMovementType;
use App\Models\BankAccount;
use App\Models\BankCheck;
use App\Models\Customer;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\SalesOrderPayment;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SalesOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_sales_orders(): void
    {
        $this->get(route('sales-orders.index'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_sales_order_index(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create(['name' => 'River Retail']);
        $order = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '40.00',
        ]);
        SalesOrderItem::factory()->create([
            'sales_order_id' => $order->id,
            'selling_price' => '20.00',
            'quantity' => 2,
            'subtotal' => '40.00',
        ]);

        $this->actingAs($admin)
            ->get(route('sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('sales-orders/index')
                ->has('orders.data', 1)
                ->has('customers')
                ->has('products')
                ->has('summary')
                ->has('dailySales')
                ->has('dailySales.labels', 90)
                ->has('dailySales.totals', 90)
                ->where('summary.order_count', 1)
                ->where('summary.grand_total_sum', '40.00')
                ->where('orders.data.0.reference', $order->reference)
                ->where('orders.data.0.customer_name', 'River Retail')
                ->where('orders.data.0.item_count', 1)
                ->where('orders.data.0.amount_paid', '0.00')
                ->where('orders.data.0.balance_due', '40.00')
                ->where('orders.data.0.payment_status', 'unpaid')
                ->where('orders.data.0.can_add_payment', true)
                ->where('orders.data.0.can_void', true)
                ->has('orders.data.0.payments', 0)
                ->has('paymentMethods', 4)
                ->where('paymentMethods.0.value', 'cash')
                ->where('paymentMethods.2.value', 'bank_transfer')
            );
    }

    public function test_index_includes_active_bank_accounts_only(): void
    {
        $admin = User::factory()->create();
        BankAccount::factory()->active()->create(['name' => 'BPI Checking']);
        BankAccount::factory()->inactive()->create(['name' => 'Hidden Bank']);

        $this->actingAs($admin)
            ->get(route('sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('sales-orders/index')
                ->has('bankAccounts', 1)
                ->where('bankAccounts.0.name', 'BPI Checking')
            );
    }

    public function test_zero_total_order_is_paid_without_add_payment_and_still_voidable(): void
    {
        $admin = User::factory()->create();
        $order = SalesOrder::factory()->create(['grand_total' => '0.00']);

        $this->actingAs($admin)
            ->get(route('sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.id', $order->id)
                ->where('orders.data.0.payment_status', 'paid')
                ->where('orders.data.0.can_add_payment', false)
                ->where('orders.data.0.can_void', true)
            );
    }

    public function test_index_includes_daily_sales_series_excluding_voided_and_filling_zeros(): void
    {
        $admin = User::factory()->create();

        Carbon::setTestNow(Carbon::parse('2026-08-10 12:00:00', config('app.timezone')));

        try {
            SalesOrder::factory()->create([
                'grand_total' => '100.00',
                'created_at' => Carbon::parse('2026-08-10 09:00:00'),
                'updated_at' => Carbon::parse('2026-08-10 09:00:00'),
            ]);
            SalesOrder::factory()->create([
                'grand_total' => '50.00',
                'created_at' => Carbon::parse('2026-08-10 15:00:00'),
                'updated_at' => Carbon::parse('2026-08-10 15:00:00'),
            ]);
            SalesOrder::factory()->create([
                'grand_total' => '25.00',
                'created_at' => Carbon::parse('2026-08-08 10:00:00'),
                'updated_at' => Carbon::parse('2026-08-08 10:00:00'),
            ]);
            $voided = SalesOrder::factory()->create([
                'grand_total' => '999.00',
                'created_at' => Carbon::parse('2026-08-10 11:00:00'),
                'updated_at' => Carbon::parse('2026-08-10 11:00:00'),
            ]);
            $voided->delete();

            $this->actingAs($admin)
                ->get(route('sales-orders.index'))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->has('dailySales.labels', 90)
                    ->has('dailySales.totals', 90)
                    ->where('dailySales.labels.0', '2026-05-13')
                    ->where('dailySales.labels.89', '2026-08-10')
                    ->where('dailySales.totals.89', 150)
                    ->where('dailySales.totals.87', 25)
                    ->where('dailySales.totals.88', 0)
                );
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_authenticated_users_can_create_a_walk_in_sale_and_decrement_stock(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User']);
        $product = Product::factory()->available()->create([
            'quantity' => 10,
            'selling_price' => '15.00',
        ]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'customer_id' => null,
                'notes' => 'Counter sale',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'selling_price' => '12.50',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $order = SalesOrder::query()->first();
        $this->assertNotNull($order);
        $this->assertNull($order->customer_id);
        $this->assertNull($order->customer_name);
        $this->assertSame('25.00', $order->grand_total);
        $this->assertTrue(Str::isUuid($order->reference));
        $this->assertDatabaseHas('sales_order_items', [
            'sales_order_id' => $order->id,
            'product_id' => $product->id,
            'selling_price' => '12.50',
            'quantity' => 2,
            'subtotal' => '25.00',
        ]);

        $this->assertSame(8, $product->fresh()->quantity);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovementType::Sale->value,
            'quantity_delta' => -2,
            'quantity_after' => 8,
            'reference_type' => 'sales_order',
            'reference_id' => $order->id,
            'created_by' => 'Admin User',
        ]);
    }

    public function test_create_with_customer_posts_sale_movements(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create();
        $productA = Product::factory()->available()->create(['quantity' => 5]);
        $productB = Product::factory()->available()->create(['quantity' => 3]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'customer_id' => $customer->id,
                'items' => [
                    [
                        'product_id' => $productA->id,
                        'selling_price' => '10.00',
                        'quantity' => 1,
                    ],
                    [
                        'product_id' => $productB->id,
                        'selling_price' => '7.50',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $order = SalesOrder::query()->first();
        $this->assertSame($customer->id, $order->customer_id);
        $this->assertNull($order->customer_name);
        $this->assertSame('25.00', $order->grand_total);
        $this->assertSame(4, $productA->fresh()->quantity);
        $this->assertSame(1, $productB->fresh()->quantity);
        $this->assertSame(2, StockMovement::query()->where('type', StockMovementType::Sale)->count());
    }

    public function test_create_with_typed_customer_name_saves_guest_name_without_customer_id(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['quantity' => 5]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'customer_id' => null,
                'customer_name' => 'Maria Santos',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'selling_price' => '10.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $order = SalesOrder::query()->first();
        $this->assertNotNull($order);
        $this->assertNull($order->customer_id);
        $this->assertSame('Maria Santos', $order->customer_name);

        $this->actingAs($admin)
            ->get(route('sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.id', $order->id)
                ->where('orders.data.0.customer_id', null)
                ->where('orders.data.0.customer_name', 'Maria Santos')
            );
    }

    public function test_blank_or_whitespace_customer_name_is_stored_as_walk_in(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['quantity' => 5]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'customer_id' => '',
                'customer_name' => '   ',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'selling_price' => '10.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $order = SalesOrder::query()->first();
        $this->assertNull($order->customer_id);
        $this->assertNull($order->customer_name);
    }

    public function test_selected_customer_id_wins_over_typed_customer_name(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->active()->create(['name' => 'River Retail']);
        $product = Product::factory()->available()->create(['quantity' => 5]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'customer_id' => $customer->id,
                'customer_name' => 'Typed Over Name',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'selling_price' => '10.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $order = SalesOrder::query()->first();
        $this->assertSame($customer->id, $order->customer_id);
        $this->assertNull($order->customer_name);

        $this->actingAs($admin)
            ->get(route('sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.customer_name', 'River Retail')
            );
    }

    public function test_store_rejects_client_grand_total_and_recalculates_server_side(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['quantity' => 10]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'grand_total' => '999.99',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'selling_price' => '10.00',
                        'quantity' => 3,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $this->assertDatabaseHas('sales_orders', [
            'grand_total' => '30.00',
        ]);
    }

    public function test_store_rejects_oversell(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['quantity' => 2]);

        $this->actingAs($admin)
            ->from(route('sales-orders.index'))
            ->post(route('sales-orders.store'), [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'selling_price' => '10.00',
                        'quantity' => 5,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'))
            ->assertSessionHasErrors('items.0.quantity');

        $this->assertSame(0, SalesOrder::query()->count());
        $this->assertSame(2, $product->fresh()->quantity);
        $this->assertSame(0, StockMovement::query()->count());
    }

    public function test_store_rejects_inactive_customer_and_deleted_products(): void
    {
        $admin = User::factory()->create();
        $inactive = Customer::factory()->create(['status' => CustomerStatus::Inactive]);
        $product = Product::factory()->available()->create(['quantity' => 5]);
        $deletedProduct = Product::factory()->available()->create(['quantity' => 5]);
        $deletedProduct->delete();

        $this->actingAs($admin)
            ->from(route('sales-orders.index'))
            ->post(route('sales-orders.store'), [
                'customer_id' => $inactive->id,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'selling_price' => '10.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'))
            ->assertSessionHasErrors('customer_id');

        $this->actingAs($admin)
            ->from(route('sales-orders.index'))
            ->post(route('sales-orders.store'), [
                'items' => [
                    [
                        'product_id' => $deletedProduct->id,
                        'selling_price' => '10.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'))
            ->assertSessionHasErrors('items.0.product_id');
    }

    public function test_void_restores_stock_and_restore_re_decrements(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User']);
        $product = Product::factory()->available()->create(['quantity' => 10]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'selling_price' => '8.00',
                        'quantity' => 3,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $order = SalesOrder::query()->first();
        $this->assertSame(7, $product->fresh()->quantity);

        $this->actingAs($admin)
            ->delete(route('sales-orders.destroy', $order))
            ->assertRedirect(route('sales-orders.index'));

        $this->assertSoftDeleted($order);
        $this->assertSame(10, $product->fresh()->quantity);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovementType::Sale->value,
            'quantity_delta' => 3,
            'quantity_after' => 10,
            'notes' => 'Void restore for '.$order->reference,
        ]);

        $this->actingAs($admin)
            ->post(route('sales-orders.restore', $order))
            ->assertRedirect(route('sales-orders.index'));

        $this->assertNull($order->fresh()->deleted_at);
        $this->assertSame(7, $product->fresh()->quantity);
        $this->assertSame(
            3,
            StockMovement::query()->where('type', StockMovementType::Sale)->count(),
        );
    }

    public function test_restore_fails_when_stock_is_insufficient(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['quantity' => 5]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'selling_price' => '5.00',
                        'quantity' => 4,
                    ],
                ],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $order = SalesOrder::query()->first();

        $this->actingAs($admin)
            ->delete(route('sales-orders.destroy', $order))
            ->assertRedirect(route('sales-orders.index'));

        $this->assertSame(5, $product->fresh()->quantity);

        // Consume stock so restore cannot re-sell.
        $product->update(['quantity' => 1]);

        $this->actingAs($admin)
            ->from(route('sales-orders.index', ['trashed' => 'only']))
            ->post(route('sales-orders.restore', $order))
            ->assertRedirect(route('sales-orders.index', ['trashed' => 'only']));

        $this->assertNotNull($order->fresh()->deleted_at);
        $this->assertSame(1, $product->fresh()->quantity);
    }

    public function test_walk_in_can_record_cash_payment(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User']);
        $order = SalesOrder::factory()->create(['grand_total' => '100.00']);

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::Cash->value,
                'amount' => '40.00',
                'notes' => 'Partial cash',
            ])
            ->assertRedirect(route('sales-orders.index'));

        $this->assertDatabaseHas('sales_order_payments', [
            'sales_order_id' => $order->id,
            'method' => SalesOrderPaymentMethod::Cash->value,
            'amount' => '40.00',
            'recorded_by' => 'Admin User',
            'notes' => 'Partial cash',
        ]);
    }

    public function test_walk_in_rejects_non_cash_payment(): void
    {
        $admin = User::factory()->create();
        $order = SalesOrder::factory()->create(['grand_total' => '100.00']);

        $this->actingAs($admin)
            ->from(route('sales-orders.index'))
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::OnlinePayment->value,
                'amount' => '10.00',
                'platform' => 'GCash',
            ])
            ->assertRedirect(route('sales-orders.index'))
            ->assertSessionHasErrors('method');

        $this->assertDatabaseCount('sales_order_payments', 0);
    }

    public function test_customer_sale_can_record_each_payment_method(): void
    {
        $admin = User::factory()->create(['name' => 'Check Issuer']);
        $customer = Customer::factory()->active()->create();
        $bankAccount = BankAccount::factory()->active()->create(['name' => 'BPI']);
        $dueDate = now()->addDays(14)->toDateString();

        $cashOrder = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '100.00',
        ]);
        $onlineOrder = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '100.00',
        ]);
        $transferOrder = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '100.00',
        ]);
        $pdcOrder = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '100.00',
        ]);

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $cashOrder), [
                'method' => SalesOrderPaymentMethod::Cash->value,
                'amount' => '10.00',
            ])
            ->assertRedirect(route('sales-orders.index'));

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $onlineOrder), [
                'method' => SalesOrderPaymentMethod::OnlinePayment->value,
                'amount' => '25.00',
                'platform' => 'GCash',
                'reference_number' => 'GC-123',
            ])
            ->assertRedirect(route('sales-orders.index'));

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $transferOrder), [
                'method' => SalesOrderPaymentMethod::BankTransfer->value,
                'amount' => '30.00',
                'bank_name' => 'BDO',
                'reference_number' => 'TRN-999',
            ])
            ->assertRedirect(route('sales-orders.index'));

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $pdcOrder), [
                'method' => SalesOrderPaymentMethod::PostDatedCheck->value,
                'amount' => '50.00',
                'bank_account_id' => $bankAccount->id,
                'check_number' => 'CHK-2001',
                'due_date' => $dueDate,
                'notes' => 'Customer PDC',
            ])
            ->assertRedirect(route('sales-orders.index'));

        $this->assertDatabaseHas('sales_order_payments', [
            'sales_order_id' => $onlineOrder->id,
            'method' => SalesOrderPaymentMethod::OnlinePayment->value,
            'platform' => 'GCash',
            'reference_number' => 'GC-123',
        ]);
        $this->assertDatabaseHas('sales_order_payments', [
            'sales_order_id' => $transferOrder->id,
            'method' => SalesOrderPaymentMethod::BankTransfer->value,
            'bank_name' => 'BDO',
            'reference_number' => 'TRN-999',
        ]);

        $check = BankCheck::query()->where('check_number', 'CHK-2001')->first();
        $this->assertNotNull($check);
        $this->assertSame($bankAccount->id, $check->bank_account_id);
        $this->assertSame('50.00', $check->amount);
        $this->assertSame($dueDate, $check->due_date?->toDateString());
        $this->assertSame('Check Issuer', $check->issued_by);

        $this->assertDatabaseHas('sales_order_payments', [
            'sales_order_id' => $pdcOrder->id,
            'method' => SalesOrderPaymentMethod::PostDatedCheck->value,
            'bank_check_id' => $check->id,
            'recorded_by' => 'Check Issuer',
        ]);
        $this->assertDatabaseHas('bank_account_audit_logs', [
            'bank_account_id' => $bankAccount->id,
            'action' => 'check.created',
            'subject_type' => 'bank_check',
        ]);
        $this->assertDatabaseHas('bank_account_audit_logs', [
            'bank_account_id' => $bankAccount->id,
            'action' => 'payment.recorded',
            'subject_type' => 'sales_order_payment',
        ]);
    }

    public function test_payment_amount_cannot_exceed_balance(): void
    {
        $admin = User::factory()->create();
        $order = SalesOrder::factory()->create(['grand_total' => '100.00']);
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $order->id,
            'amount' => '80.00',
        ]);

        $this->actingAs($admin)
            ->from(route('sales-orders.index'))
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::Cash->value,
                'amount' => '30.00',
            ])
            ->assertRedirect(route('sales-orders.index'))
            ->assertSessionHasErrors('amount');

        $this->assertDatabaseCount('sales_order_payments', 1);
    }

    public function test_second_partial_payment_is_allowed_until_paid(): void
    {
        $admin = User::factory()->create();
        $order = SalesOrder::factory()->create(['grand_total' => '100.00']);
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $order->id,
            'amount' => '40.00',
        ]);

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::Cash->value,
                'amount' => '60.00',
            ])
            ->assertRedirect(route('sales-orders.index'));

        $this->actingAs($admin)
            ->get(route('sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.id', $order->id)
                ->where('orders.data.0.amount_paid', '100.00')
                ->where('orders.data.0.balance_due', '0.00')
                ->where('orders.data.0.payment_status', 'paid')
                ->where('orders.data.0.can_add_payment', false)
                ->where('orders.data.0.can_void', false)
            );
    }

    public function test_cannot_add_payment_when_fully_paid(): void
    {
        $admin = User::factory()->create();
        $order = SalesOrder::factory()->create(['grand_total' => '50.00']);
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $order->id,
            'amount' => '50.00',
        ]);

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::Cash->value,
                'amount' => '1.00',
            ])
            ->assertRedirect(route('sales-orders.index'));

        $this->assertDatabaseCount('sales_order_payments', 1);
    }

    public function test_recording_payment_does_not_change_stock(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['quantity' => 10]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'items' => [[
                    'product_id' => $product->id,
                    'selling_price' => '8.00',
                    'quantity' => 2,
                ]],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $order = SalesOrder::query()->first();
        $movementsBefore = StockMovement::query()->count();

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::Cash->value,
                'amount' => '16.00',
            ])
            ->assertRedirect(route('sales-orders.index'));

        $this->assertSame(8, $product->fresh()->quantity);
        $this->assertSame($movementsBefore, StockMovement::query()->count());
    }

    public function test_daily_sales_series_still_sums_grand_total_not_payments(): void
    {
        $admin = User::factory()->create();

        Carbon::setTestNow(Carbon::parse('2026-08-14 12:00:00', config('app.timezone')));

        try {
            $order = SalesOrder::factory()->create([
                'grand_total' => '80.00',
                'created_at' => Carbon::parse('2026-08-14 09:00:00'),
                'updated_at' => Carbon::parse('2026-08-14 09:00:00'),
            ]);
            SalesOrderPayment::factory()->cash()->create([
                'sales_order_id' => $order->id,
                'amount' => '20.00',
            ]);

            $this->actingAs($admin)
                ->get(route('sales-orders.index'))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->where('dailySales.labels.89', '2026-08-14')
                    ->where('dailySales.totals.89', 80)
                );
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_void_sale_is_rejected_when_any_payment_exists(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['quantity' => 10]);

        $this->actingAs($admin)
            ->post(route('sales-orders.store'), [
                'items' => [[
                    'product_id' => $product->id,
                    'selling_price' => '8.00',
                    'quantity' => 3,
                ]],
            ])
            ->assertRedirect(route('sales-orders.index'));

        $order = SalesOrder::query()->first();
        SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $order->id,
            'amount' => '8.00',
        ]);

        $this->actingAs($admin)
            ->delete(route('sales-orders.destroy', $order))
            ->assertRedirect(route('sales-orders.index'));

        $this->assertNull($order->fresh()->deleted_at);
        $this->assertSame(7, $product->fresh()->quantity);
        $this->assertDatabaseCount('sales_order_payments', 1);
    }

    public function test_void_payment_restores_unpaid_and_can_void_sale(): void
    {
        $admin = User::factory()->create();
        $order = SalesOrder::factory()->create(['grand_total' => '100.00']);
        $payment = SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $order->id,
            'amount' => '40.00',
        ]);

        $this->actingAs($admin)
            ->delete(route('sales-orders.payments.destroy', [$order, $payment]))
            ->assertRedirect(route('sales-orders.index'));

        $this->assertDatabaseCount('sales_order_payments', 0);

        $this->actingAs($admin)
            ->get(route('sales-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.data.0.id', $order->id)
                ->where('orders.data.0.payment_status', 'unpaid')
                ->where('orders.data.0.can_void', true)
                ->where('orders.data.0.can_add_payment', true)
            );
    }

    public function test_void_pdc_payment_voids_bank_check_without_deleting_it(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User']);
        $customer = Customer::factory()->active()->create();
        $bankAccount = BankAccount::factory()->active()->create();
        $order = SalesOrder::factory()->create([
            'customer_id' => $customer->id,
            'grand_total' => '100.00',
        ]);
        $dueDate = now()->addDays(7)->toDateString();

        $this->actingAs($admin)
            ->post(route('sales-orders.payments.store', $order), [
                'method' => SalesOrderPaymentMethod::PostDatedCheck->value,
                'amount' => '100.00',
                'bank_account_id' => $bankAccount->id,
                'check_number' => 'CHK-VOID-1',
                'due_date' => $dueDate,
            ])
            ->assertRedirect(route('sales-orders.index'));

        $payment = SalesOrderPayment::query()->first();
        $check = BankCheck::query()->where('check_number', 'CHK-VOID-1')->first();
        $this->assertNotNull($check);
        $this->assertNull($check->voided_at);

        $this->actingAs($admin)
            ->delete(route('sales-orders.payments.destroy', [$order, $payment]))
            ->assertRedirect(route('sales-orders.index'));

        $this->assertDatabaseCount('sales_order_payments', 0);
        $this->assertNotNull($check->fresh()->voided_at);
        $this->assertDatabaseHas('bank_checks', [
            'id' => $check->id,
            'check_number' => 'CHK-VOID-1',
        ]);
        $this->assertDatabaseHas('bank_account_audit_logs', [
            'bank_account_id' => $bankAccount->id,
            'action' => 'check.voided',
        ]);
    }

    public function test_void_payment_for_another_order_returns_not_found(): void
    {
        $admin = User::factory()->create();
        $orderA = SalesOrder::factory()->create(['grand_total' => '50.00']);
        $orderB = SalesOrder::factory()->create(['grand_total' => '50.00']);
        $payment = SalesOrderPayment::factory()->cash()->create([
            'sales_order_id' => $orderB->id,
            'amount' => '10.00',
        ]);

        $this->actingAs($admin)
            ->delete(route('sales-orders.payments.destroy', [$orderA, $payment]))
            ->assertNotFound();

        $this->assertDatabaseHas('sales_order_payments', ['id' => $payment->id]);
    }
}
