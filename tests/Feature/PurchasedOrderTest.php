<?php

namespace Tests\Feature;

use App\Enums\PurchasedOrderStatus;
use App\Enums\SupplierStatus;
use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderItem;
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

    public function test_draft_can_be_marked_ordered_and_ordered_can_be_marked_received(): void
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

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-received', $order))
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $order->id,
            'status' => PurchasedOrderStatus::Received->value,
        ]);
    }

    public function test_forbidden_status_transitions_are_rejected(): void
    {
        $admin = User::factory()->create();
        $ordered = PurchasedOrder::factory()->ordered()->create();
        $received = PurchasedOrder::factory()->received()->create();
        $draft = PurchasedOrder::factory()->draft()->create();

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-ordered', $ordered))
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $ordered->id,
            'status' => PurchasedOrderStatus::Ordered->value,
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-received', $draft))
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $draft->id,
            'status' => PurchasedOrderStatus::Draft->value,
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-received', $received))
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertDatabaseHas('purchased_orders', [
            'id' => $received->id,
            'status' => PurchasedOrderStatus::Received->value,
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
            'created_at' => now()->subHour(),
        ]);
        $received = PurchasedOrder::factory()->received()->create([
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
                ->where('orders.data.1.id', $draft->id)
                ->where('orders.data.1.can_edit', true)
                ->where('orders.data.2.id', $received->id)
                ->where('orders.data.2.can_edit', false)
            );
    }
}
