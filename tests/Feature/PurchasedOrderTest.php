<?php

namespace Tests\Feature;

use App\Enums\PurchasedOrderPaymentMethod;
use App\Enums\PurchasedOrderStatus;
use App\Enums\SupplierStatus;
use App\Models\BankAccount;
use App\Models\BankCheck;
use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderItem;
use App\Models\PurchasedOrderPayment;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PurchasedOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_purchased_orders(): void
    {
        $this->get(route('purchased-orders.index'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_purchased_order_index(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create(['name' => 'Acme Supply']);
        $order = PurchasedOrder::factory()
            ->ordered()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '25.00',
            ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $order->id,
            'buying_price' => '12.50',
            'quantity' => 2,
            'subtotal' => '25.00',
        ]);

        $this->actingAs($admin)
            ->get(route('purchased-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('purchased-orders/index')
                ->has('orders.data', 1)
                ->has('suppliers')
                ->has('products')
                ->has('statuses')
                ->has('summary')
                ->where('summary.order_count', 1)
                ->where('summary.ordered_count', 1)
                ->where('summary.draft_count', 0)
                ->where('summary.received_count', 0)
                ->where('orders.data.0.reference', $order->reference)
                ->where('orders.data.0.supplier_name', 'Acme Supply')
                ->where('orders.data.0.status', PurchasedOrderStatus::Ordered->value)
                ->where('orders.data.0.item_count', 1)
            );
    }

    public function test_orders_are_ordered_ordered_draft_received(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();

        $draft = PurchasedOrder::factory()->draft()->create([
            'supplier_id' => $supplier->id,
            'created_at' => now()->subDay(),
        ]);
        $received = PurchasedOrder::factory()->received()->create([
            'supplier_id' => $supplier->id,
            'created_at' => now()->subHours(2),
        ]);
        $ordered = PurchasedOrder::factory()->ordered()->create([
            'supplier_id' => $supplier->id,
            'created_at' => now()->subHour(),
        ]);

        $this->actingAs($admin)
            ->get(route('purchased-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('purchased-orders/index')
                ->where('orders.data.0.id', $ordered->id)
                ->where('orders.data.1.id', $draft->id)
                ->where('orders.data.2.id', $received->id)
            );
    }

    public function test_authenticated_users_can_create_a_draft_order_with_line_items(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $productA = Product::factory()->available()->create(['purchase_price' => '10.00']);
        $productB = Product::factory()->available()->create(['purchase_price' => '5.50']);
        $reference = (string) Str::uuid();

        $this->actingAs($admin)
            ->post(route('purchased-orders.store'), [
                'reference' => $reference,
                'supplier_id' => $supplier->id,
                'notes' => 'Rush order',
                'items' => [
                    [
                        'product_id' => $productA->id,
                        'buying_price' => '10.00',
                        'quantity' => 3,
                    ],
                    [
                        'product_id' => $productB->id,
                        'buying_price' => '5.50',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'reference' => $reference,
            'supplier_id' => $supplier->id,
            'status' => PurchasedOrderStatus::Draft->value,
            'grand_total' => '41.00',
            'notes' => 'Rush order',
        ]);

        $order = PurchasedOrder::query()->where('reference', $reference)->firstOrFail();

        $this->assertDatabaseHas('purchased_order_items', [
            'purchased_order_id' => $order->id,
            'product_id' => $productA->id,
            'buying_price' => '10.00',
            'quantity' => 3,
            'subtotal' => '30.00',
        ]);

        $this->assertDatabaseHas('purchased_order_items', [
            'purchased_order_id' => $order->id,
            'product_id' => $productB->id,
            'buying_price' => '5.50',
            'quantity' => 2,
            'subtotal' => '11.00',
        ]);
    }

    public function test_store_generates_uuid_when_reference_is_omitted(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $product = Product::factory()->available()->create();

        $this->actingAs($admin)
            ->post(route('purchased-orders.store'), [
                'supplier_id' => $supplier->id,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '8.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $order = PurchasedOrder::query()->firstOrFail();

        $this->assertTrue(Str::isUuid($order->reference));
        $this->assertSame('8.00', $order->grand_total);
    }

    public function test_store_rejects_client_grand_total_and_recalculates_server_side(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $product = Product::factory()->available()->create();

        $this->actingAs($admin)
            ->post(route('purchased-orders.store'), [
                'supplier_id' => $supplier->id,
                'grand_total' => '9999.99',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '4.25',
                        'quantity' => 4,
                        'subtotal' => '9999.99',
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'supplier_id' => $supplier->id,
            'grand_total' => '17.00',
        ]);

        $this->assertDatabaseHas('purchased_order_items', [
            'product_id' => $product->id,
            'subtotal' => '17.00',
        ]);
    }

    public function test_store_validates_required_fields_and_line_items(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->from(route('purchased-orders.index'))
            ->post(route('purchased-orders.store'), [])
            ->assertRedirect(route('purchased-orders.index'))
            ->assertSessionHasErrors(['supplier_id', 'items']);
    }

    public function test_store_rejects_inactive_or_deleted_supplier_and_deleted_products(): void
    {
        $admin = User::factory()->create();
        $inactiveSupplier = Supplier::factory()->inactive()->create();
        $deletedSupplier = Supplier::factory()->active()->create();
        $deletedSupplier->delete();
        $product = Product::factory()->available()->create();
        $deletedProduct = Product::factory()->available()->create();
        $deletedProduct->delete();

        $this->actingAs($admin)
            ->from(route('purchased-orders.index'))
            ->post(route('purchased-orders.store'), [
                'supplier_id' => $inactiveSupplier->id,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '1.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'))
            ->assertSessionHasErrors(['supplier_id']);

        $this->actingAs($admin)
            ->from(route('purchased-orders.index'))
            ->post(route('purchased-orders.store'), [
                'supplier_id' => $deletedSupplier->id,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '1.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'))
            ->assertSessionHasErrors(['supplier_id']);

        $activeSupplier = Supplier::factory()->active()->create();

        $this->actingAs($admin)
            ->from(route('purchased-orders.index'))
            ->post(route('purchased-orders.store'), [
                'supplier_id' => $activeSupplier->id,
                'items' => [
                    [
                        'product_id' => $deletedProduct->id,
                        'buying_price' => '1.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'))
            ->assertSessionHasErrors(['items.0.product_id']);
    }

    public function test_soft_deleted_suppliers_and_products_are_excluded_from_picker_props(): void
    {
        $admin = User::factory()->create();
        $activeSupplier = Supplier::factory()->active()->create(['name' => 'Live Supplier']);
        $inactiveSupplier = Supplier::factory()->inactive()->create(['name' => 'Inactive Supplier']);
        $deletedSupplier = Supplier::factory()->active()->create(['name' => 'Gone Supplier']);
        $deletedSupplier->delete();

        $liveProduct = Product::factory()->available()->create(['name' => 'Live Product']);
        $deletedProduct = Product::factory()->available()->create(['name' => 'Gone Product']);
        $deletedProduct->delete();

        $this->actingAs($admin)
            ->get(route('purchased-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('purchased-orders/index')
                ->has('suppliers', 1)
                ->where('suppliers.0.id', $activeSupplier->id)
                ->has('products', 1)
                ->where('products.0.id', $liveProduct->id)
                ->where('products.0.purchase_price', $liveProduct->purchase_price)
            );

        $this->assertNotSame(SupplierStatus::Inactive, $activeSupplier->status);
        $this->assertTrue(
            collect([$inactiveSupplier->id, $deletedSupplier->id])
                ->doesntContain($activeSupplier->id),
        );
    }

    public function test_draft_can_be_marked_ordered(): void
    {
        $admin = User::factory()->create();
        $order = PurchasedOrder::factory()->draft()->create();

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-ordered', $order))
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $order->id,
            'status' => PurchasedOrderStatus::Ordered->value,
        ]);
    }

    public function test_forbidden_status_transitions_are_rejected(): void
    {
        $admin = User::factory()->create();
        $ordered = PurchasedOrder::factory()->ordered()->create();

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-ordered', $ordered))
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $ordered->id,
            'status' => PurchasedOrderStatus::Ordered->value,
        ]);
    }

    public function test_ordered_can_be_received_with_line_adjustments(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $productA = Product::factory()->available()->create();
        $productB = Product::factory()->available()->create();

        $order = PurchasedOrder::factory()->ordered()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '30.00',
            'notes' => 'As ordered',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $order->id,
            'product_id' => $productA->id,
            'buying_price' => '10.00',
            'quantity' => 2,
            'subtotal' => '20.00',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $order->id,
            'product_id' => $productB->id,
            'buying_price' => '5.00',
            'quantity' => 2,
            'subtotal' => '10.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-received-with-adjustment', $order), [
                'items' => [
                    [
                        'product_id' => $productA->id,
                        'buying_price' => '12.50',
                        'quantity' => 1,
                    ],
                    [
                        'product_id' => $productB->id,
                        'buying_price' => '4.00',
                        'quantity' => 3,
                    ],
                ],
                'invoice_number' => 'INV-100',
                'delivery_number' => 'DN-55',
                'delivery_person' => 'Alex Rider',
                'delivery_date' => '2026-07-25',
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $order->refresh();

        $this->assertSame(PurchasedOrderStatus::Received, $order->status);
        $this->assertSame('24.50', $order->grand_total);
        $this->assertSame('As ordered', $order->notes);
        $this->assertSame([
            'invoice_number' => 'INV-100',
            'delivery_number' => 'DN-55',
            'delivery_person' => 'Alex Rider',
            'delivery_date' => '2026-07-25',
            'received_by' => $admin->name,
        ], $order->meta);

        $this->assertDatabaseHas('purchased_order_items', [
            'purchased_order_id' => $order->id,
            'product_id' => $productA->id,
            'buying_price' => '12.50',
            'quantity' => 1,
            'subtotal' => '12.50',
        ]);

        $this->assertDatabaseHas('purchased_order_items', [
            'purchased_order_id' => $order->id,
            'product_id' => $productB->id,
            'buying_price' => '4.00',
            'quantity' => 3,
            'subtotal' => '12.00',
        ]);

        $this->assertSame(
            $productA->quantity + 1,
            $productA->fresh()->quantity,
        );
        $this->assertSame(
            $productB->quantity + 3,
            $productB->fresh()->quantity,
        );
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $productA->id,
            'type' => 'receipt',
            'quantity_delta' => 1,
            'reference_type' => 'purchased_order',
            'reference_id' => $order->id,
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $productB->id,
            'type' => 'receipt',
            'quantity_delta' => 3,
            'reference_type' => 'purchased_order',
            'reference_id' => $order->id,
        ]);
    }

    public function test_receive_with_adjustment_can_drop_unavailable_lines(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $productA = Product::factory()->available()->create();
        $productB = Product::factory()->available()->create();

        $order = PurchasedOrder::factory()->ordered()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '30.00',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $order->id,
            'product_id' => $productA->id,
            'buying_price' => '10.00',
            'quantity' => 2,
            'subtotal' => '20.00',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $order->id,
            'product_id' => $productB->id,
            'buying_price' => '5.00',
            'quantity' => 2,
            'subtotal' => '10.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-received-with-adjustment', $order), [
                'items' => [
                    [
                        'product_id' => $productA->id,
                        'buying_price' => '10.00',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $order->refresh();

        $this->assertSame(PurchasedOrderStatus::Received, $order->status);
        $this->assertSame('20.00', $order->grand_total);
        $this->assertSame($admin->name, $order->meta['received_by']);

        $this->assertDatabaseHas('purchased_order_items', [
            'purchased_order_id' => $order->id,
            'product_id' => $productA->id,
            'quantity' => 2,
            'subtotal' => '20.00',
        ]);

        $this->assertDatabaseMissing('purchased_order_items', [
            'purchased_order_id' => $order->id,
            'product_id' => $productB->id,
        ]);
    }

    public function test_receive_with_adjustment_rejects_draft_and_unknown_products(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $product = Product::factory()->available()->create();
        $otherProduct = Product::factory()->available()->create();

        $draft = PurchasedOrder::factory()->draft()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '10.00',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $draft->id,
            'product_id' => $product->id,
            'buying_price' => '10.00',
            'quantity' => 1,
            'subtotal' => '10.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-received-with-adjustment', $draft), [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '11.00',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $draft->id,
            'status' => PurchasedOrderStatus::Draft->value,
            'grand_total' => '10.00',
        ]);

        $ordered = PurchasedOrder::factory()->ordered()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '10.00',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $ordered->id,
            'product_id' => $product->id,
            'buying_price' => '10.00',
            'quantity' => 1,
            'subtotal' => '10.00',
        ]);

        $this->actingAs($admin)
            ->from(route('purchased-orders.index'))
            ->post(route('purchased-orders.mark-received-with-adjustment', $ordered), [
                'items' => [
                    [
                        'product_id' => $otherProduct->id,
                        'buying_price' => '11.00',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'))
            ->assertSessionHasErrors('items');

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $ordered->id,
            'status' => PurchasedOrderStatus::Ordered->value,
            'grand_total' => '10.00',
        ]);

        $received = PurchasedOrder::factory()->received()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '10.00',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $received->id,
            'product_id' => $product->id,
            'buying_price' => '10.00',
            'quantity' => 1,
            'subtotal' => '10.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-received-with-adjustment', $received), [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '11.00',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $received->id,
            'status' => PurchasedOrderStatus::Received->value,
            'grand_total' => '10.00',
        ]);
    }

    public function test_draft_orders_can_be_updated(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $newSupplier = Supplier::factory()->active()->create();
        $product = Product::factory()->available()->create();
        $newProduct = Product::factory()->available()->create();

        $draft = PurchasedOrder::factory()->draft()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '10.00',
            'notes' => 'Old notes',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $draft->id,
            'product_id' => $product->id,
            'buying_price' => '10.00',
            'quantity' => 1,
            'subtotal' => '10.00',
        ]);

        $this->actingAs($admin)
            ->put(route('purchased-orders.update', $draft), [
                'supplier_id' => $newSupplier->id,
                'notes' => 'Updated notes',
                'items' => [
                    [
                        'product_id' => $newProduct->id,
                        'buying_price' => '7.50',
                        'quantity' => 4,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $draft->id,
            'supplier_id' => $newSupplier->id,
            'status' => PurchasedOrderStatus::Draft->value,
            'grand_total' => '30.00',
            'notes' => 'Updated notes',
        ]);

        $this->assertDatabaseMissing('purchased_order_items', [
            'purchased_order_id' => $draft->id,
            'product_id' => $product->id,
        ]);

        $this->assertDatabaseHas('purchased_order_items', [
            'purchased_order_id' => $draft->id,
            'product_id' => $newProduct->id,
            'buying_price' => '7.50',
            'quantity' => 4,
            'subtotal' => '30.00',
        ]);
    }

    public function test_ordered_and_received_orders_cannot_be_updated(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $product = Product::factory()->available()->create();

        $ordered = PurchasedOrder::factory()->ordered()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '2.00',
            'notes' => 'Ordered locked',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $ordered->id,
            'product_id' => $product->id,
            'buying_price' => '2.00',
            'quantity' => 1,
            'subtotal' => '2.00',
        ]);

        $this->actingAs($admin)
            ->put(route('purchased-orders.update', $ordered), [
                'supplier_id' => $supplier->id,
                'notes' => 'Should not save',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '3.00',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $ordered->id,
            'status' => PurchasedOrderStatus::Ordered->value,
            'grand_total' => '2.00',
            'notes' => 'Ordered locked',
        ]);

        $received = PurchasedOrder::factory()->received()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '5.00',
            'notes' => 'Locked',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $received->id,
            'product_id' => $product->id,
            'buying_price' => '5.00',
            'quantity' => 1,
            'subtotal' => '5.00',
        ]);

        $this->actingAs($admin)
            ->put(route('purchased-orders.update', $received), [
                'supplier_id' => $supplier->id,
                'notes' => 'Should not save',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '9.00',
                        'quantity' => 9,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $received->id,
            'grand_total' => '5.00',
            'notes' => 'Locked',
            'status' => PurchasedOrderStatus::Received->value,
        ]);
    }

    public function test_orders_can_be_soft_deleted_and_restored(): void
    {
        $admin = User::factory()->create();
        $order = PurchasedOrder::factory()->draft()->create();

        $this->actingAs($admin)
            ->delete(route('purchased-orders.destroy', $order))
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertSoftDeleted($order);

        $this->actingAs($admin)
            ->get(route('purchased-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('purchased-orders/index')
                ->has('orders.data', 0)
            );

        $this->actingAs($admin)
            ->get(route('purchased-orders.index', ['trashed' => 'only']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('purchased-orders/index')
                ->has('orders.data', 1)
                ->where('orders.data.0.id', $order->id)
                ->where('filters.trashed', 'only')
            );

        $this->actingAs($admin)
            ->post(route('purchased-orders.restore', $order))
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertNotSoftDeleted($order);
    }

    public function test_index_payload_marks_editable_flags(): void
    {
        $admin = User::factory()->create();
        $draft = PurchasedOrder::factory()->draft()->create([
            'created_at' => now()->subHours(2),
        ]);
        $ordered = PurchasedOrder::factory()->ordered()->create([
            'grand_total' => '100.00',
            'created_at' => now()->subHour(),
        ]);
        $received = PurchasedOrder::factory()->received()->create([
            'grand_total' => '50.00',
            'created_at' => now()->subMinutes(30),
        ]);

        $this->actingAs($admin)
            ->get(route('purchased-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('purchased-orders/index')
                ->has('orders.data', 3)
                ->where('orders.data.0.id', $ordered->id)
                ->where('orders.data.0.can_edit', false)
                ->where('orders.data.0.can_add_prepayment', true)
                ->where('orders.data.1.id', $draft->id)
                ->where('orders.data.1.can_edit', true)
                ->where('orders.data.1.can_add_prepayment', false)
                ->where('orders.data.2.id', $received->id)
                ->where('orders.data.2.can_edit', false)
                ->where('orders.data.2.can_add_prepayment', true)
            );
    }

    public function test_fully_paid_ordered_order_cannot_add_prepayment(): void
    {
        $admin = User::factory()->create();
        $order = PurchasedOrder::factory()->ordered()->create([
            'grand_total' => '100.00',
        ]);
        PurchasedOrderPayment::factory()->cash()->create([
            'purchased_order_id' => $order->id,
            'amount' => '100.00',
        ]);

        $this->actingAs($admin)
            ->get(route('purchased-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('purchased-orders/index')
                ->where('orders.data.0.id', $order->id)
                ->where('orders.data.0.balance_due', '0.00')
                ->where('orders.data.0.can_add_prepayment', false)
            );
    }

    public function test_ordered_can_record_cash_prepayment(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User']);
        $order = PurchasedOrder::factory()->ordered()->create([
            'grand_total' => '100.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.payments.store', $order), [
                'method' => PurchasedOrderPaymentMethod::Cash->value,
                'amount' => '40.00',
                'notes' => 'Partial cash',
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_order_payments', [
            'purchased_order_id' => $order->id,
            'method' => PurchasedOrderPaymentMethod::Cash->value,
            'amount' => '40.00',
            'recorded_by' => 'Admin User',
            'notes' => 'Partial cash',
        ]);
    }

    public function test_ordered_can_record_online_payment_prepayment(): void
    {
        $admin = User::factory()->create();
        $order = PurchasedOrder::factory()->ordered()->create([
            'grand_total' => '100.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.payments.store', $order), [
                'method' => PurchasedOrderPaymentMethod::OnlinePayment->value,
                'amount' => '25.00',
                'platform' => 'GCash',
                'reference_number' => 'GC-123',
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_order_payments', [
            'purchased_order_id' => $order->id,
            'method' => PurchasedOrderPaymentMethod::OnlinePayment->value,
            'platform' => 'GCash',
            'reference_number' => 'GC-123',
            'amount' => '25.00',
        ]);
    }

    public function test_ordered_can_record_bank_deposit_prepayment(): void
    {
        $admin = User::factory()->create();
        $order = PurchasedOrder::factory()->ordered()->create([
            'grand_total' => '100.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.payments.store', $order), [
                'method' => PurchasedOrderPaymentMethod::BankDeposit->value,
                'amount' => '30.00',
                'bank_name' => 'BDO',
                'reference_number' => 'DEP-999',
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_order_payments', [
            'purchased_order_id' => $order->id,
            'method' => PurchasedOrderPaymentMethod::BankDeposit->value,
            'bank_name' => 'BDO',
            'reference_number' => 'DEP-999',
            'amount' => '30.00',
        ]);
    }

    public function test_ordered_can_record_pdc_prepayment_creating_bank_check(): void
    {
        $admin = User::factory()->create(['name' => 'Check Issuer']);
        $bankAccount = BankAccount::factory()->active()->create(['name' => 'BPI']);
        $order = PurchasedOrder::factory()->ordered()->create([
            'grand_total' => '100.00',
        ]);
        $dueDate = now()->addDays(14)->toDateString();

        $this->actingAs($admin)
            ->post(route('purchased-orders.payments.store', $order), [
                'method' => PurchasedOrderPaymentMethod::PostDatedCheck->value,
                'amount' => '50.00',
                'bank_account_id' => $bankAccount->id,
                'check_number' => 'CHK-1001',
                'due_date' => $dueDate,
                'notes' => 'PDC for supplier',
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $check = BankCheck::query()->where('check_number', 'CHK-1001')->first();
        $this->assertNotNull($check);
        $this->assertSame($bankAccount->id, $check->bank_account_id);
        $this->assertSame('50.00', $check->amount);
        $this->assertSame($dueDate, $check->due_date?->toDateString());
        $this->assertSame('Check Issuer', $check->issued_by);

        $this->assertDatabaseHas('purchased_order_payments', [
            'purchased_order_id' => $order->id,
            'method' => PurchasedOrderPaymentMethod::PostDatedCheck->value,
            'amount' => '50.00',
            'bank_check_id' => $check->id,
            'recorded_by' => 'Check Issuer',
        ]);
    }

    public function test_prepayment_rejected_for_draft_orders(): void
    {
        $admin = User::factory()->create();
        $order = PurchasedOrder::factory()->draft()->create([
            'grand_total' => '100.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.payments.store', $order), [
                'method' => PurchasedOrderPaymentMethod::Cash->value,
                'amount' => '10.00',
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseCount('purchased_order_payments', 0);
    }

    public function test_received_with_balance_due_can_record_prepayment(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User']);
        $order = PurchasedOrder::factory()->received()->create([
            'grand_total' => '100.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.payments.store', $order), [
                'method' => PurchasedOrderPaymentMethod::Cash->value,
                'amount' => '25.00',
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_order_payments', [
            'purchased_order_id' => $order->id,
            'method' => PurchasedOrderPaymentMethod::Cash->value,
            'amount' => '25.00',
            'recorded_by' => 'Admin User',
        ]);
    }

    public function test_prepayment_amount_cannot_exceed_balance(): void
    {
        $admin = User::factory()->create();
        $order = PurchasedOrder::factory()->ordered()->create([
            'grand_total' => '100.00',
        ]);
        PurchasedOrderPayment::factory()->cash()->create([
            'purchased_order_id' => $order->id,
            'amount' => '80.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.payments.store', $order), [
                'method' => PurchasedOrderPaymentMethod::Cash->value,
                'amount' => '30.00',
            ])
            ->assertSessionHasErrors('amount');

        $this->assertDatabaseCount('purchased_order_payments', 1);
    }

    public function test_index_includes_bank_accounts_and_payment_methods(): void
    {
        $admin = User::factory()->create();
        BankAccount::factory()->active()->create(['name' => 'Metrobank']);
        BankAccount::factory()->inactive()->create(['name' => 'Hidden Bank']);

        $this->actingAs($admin)
            ->get(route('purchased-orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('purchased-orders/index')
                ->has('paymentMethods', 4)
                ->has('bankAccounts', 1)
                ->where('bankAccounts.0.name', 'Metrobank')
            );
    }
}
