<?php

namespace Tests\Feature;

use App\Enums\PurchasedOrderStatus;
use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\ProductSellingPriceHistory;
use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_inventory(): void
    {
        $this->get(route('inventory.index'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_on_hand_tab(): void
    {
        $admin = User::factory()->create();
        Product::factory()->available()->create([
            'name' => 'Steel Bolt',
            'quantity' => 7,
        ]);

        $this->actingAs($admin)
            ->get(route('inventory.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/index')
                ->where('tab', 'on-hand')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Steel Bolt')
                ->where('products.data.0.quantity', 7)
                ->where('movements', null)
            );
    }

    public function test_authenticated_users_can_view_movements_tab(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['name' => 'Widget']);

        StockMovement::query()->create([
            'product_id' => $product->id,
            'type' => StockMovementType::Adjustment,
            'quantity_delta' => 5,
            'quantity_after' => 5,
            'unit_cost' => null,
            'notes' => 'Opening balance',
            'created_by' => $admin->name,
        ]);

        $this->actingAs($admin)
            ->get(route('inventory.index', ['tab' => 'movements']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('inventory/index')
                ->where('tab', 'movements')
                ->where('products', null)
                ->has('movements.data', 1)
                ->where('movements.data.0.product_name', 'Widget')
                ->where('movements.data.0.type', 'adjustment')
                ->where('movements.data.0.quantity_delta', 5)
            );
    }

    public function test_received_orders_redirects_to_inventory(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->get('/received-orders')
            ->assertRedirect('/inventory');
    }

    public function test_can_adjust_stock_from_inventory(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['quantity' => 10]);

        $this->actingAs($admin)
            ->post(route('inventory.adjust', $product), [
                'quantity' => 4,
                'notes' => 'Cycle count',
            ])
            ->assertRedirect(route('inventory.index', ['tab' => 'on-hand']));

        $product->refresh();
        $this->assertSame(4, $product->quantity);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovementType::Adjustment->value,
            'quantity_delta' => -6,
            'quantity_after' => 4,
            'notes' => 'Cycle count',
            'created_by' => $admin->name,
        ]);
    }

    public function test_receiving_purchase_order_posts_receipt_stock_movements(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $productA = Product::factory()->available()->create(['quantity' => 5]);
        $productB = Product::factory()->available()->create(['quantity' => 0]);

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
            'quantity' => 3,
            'subtotal' => '15.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-received-with-adjustment', $order), [
                'items' => [
                    [
                        'product_id' => $productA->id,
                        'buying_price' => '10.00',
                        'quantity' => 2,
                    ],
                    [
                        'product_id' => $productB->id,
                        'buying_price' => '5.00',
                        'quantity' => 3,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertSame(7, $productA->fresh()->quantity);
        $this->assertSame(3, $productB->fresh()->quantity);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $productA->id,
            'type' => StockMovementType::Receipt->value,
            'quantity_delta' => 2,
            'quantity_after' => 7,
            'unit_cost' => '10.00',
            'reference_type' => 'purchased_order',
            'reference_id' => $order->id,
            'created_by' => $admin->name,
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $productB->id,
            'type' => StockMovementType::Receipt->value,
            'quantity_delta' => 3,
            'quantity_after' => 3,
            'unit_cost' => '5.00',
            'reference_type' => 'purchased_order',
            'reference_id' => $order->id,
        ]);

        $this->actingAs($admin)
            ->get(route('inventory.index', ['tab' => 'movements']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('inventory/index')
                ->has('movements.data', 2)
                ->where('movements.data.0.reference.type', 'purchased_order')
                ->where('movements.data.0.reference.id', $order->id)
                ->where('movements.data.0.reference.purchased_order.id', $order->id)
                ->where('movements.data.0.reference.purchased_order.status', 'received')
                ->has('movements.data.0.reference.purchased_order.items', 2)
            );
    }

    public function test_already_received_purchase_order_does_not_post_stock_again(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $product = Product::factory()->available()->create(['quantity' => 10]);

        $order = PurchasedOrder::factory()->create([
            'supplier_id' => $supplier->id,
            'status' => PurchasedOrderStatus::Received,
            'grand_total' => '20.00',
        ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $order->id,
            'product_id' => $product->id,
            'buying_price' => '10.00',
            'quantity' => 2,
            'subtotal' => '20.00',
        ]);

        $this->actingAs($admin)
            ->post(route('purchased-orders.mark-received-with-adjustment', $order), [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '10.00',
                        'quantity' => 2,
                    ],
                ],
            ])
            ->assertRedirect(route('purchased-orders.index'));

        $this->assertSame(10, $product->fresh()->quantity);
        $this->assertSame(0, StockMovement::query()->count());
    }

    public function test_admin_product_create_records_opening_balance_movement(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->post(route('admin.products.store'), [
                'name' => 'Ledger Item',
                'unit' => 'pcs',
                'description' => null,
                'quantity' => 8,
                'purchase_price' => 2,
                'selling_price' => 4,
                'status' => 'available',
                'category_ids' => [],
            ])
            ->assertRedirect(route('admin.products.index'));

        $product = Product::query()->where('name', 'Ledger Item')->firstOrFail();

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovementType::Adjustment->value,
            'quantity_delta' => 8,
            'quantity_after' => 8,
            'notes' => 'Opening balance',
            'created_by' => $admin->name,
        ]);
    }

    public function test_admin_product_quantity_update_records_adjustment(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create(['quantity' => 5]);

        $this->actingAs($admin)
            ->put(route('admin.products.update', $product), [
                'name' => $product->name,
                'unit' => $product->unit,
                'description' => $product->description,
                'quantity' => 9,
                'purchase_price' => $product->purchase_price,
                'selling_price' => $product->selling_price,
                'status' => $product->status->value,
                'category_ids' => [],
            ])
            ->assertRedirect(route('admin.products.index'));

        $this->assertSame(9, $product->fresh()->quantity);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovementType::Adjustment->value,
            'quantity_delta' => 4,
            'quantity_after' => 9,
            'notes' => 'Admin quantity update',
            'created_by' => $admin->name,
        ]);
    }

    public function test_can_update_inventory_settings_and_record_price_history(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create([
            'quantity' => 10,
            'selling_price' => '25.00',
            'low_stock_threshold' => null,
        ]);

        $this->actingAs($admin)
            ->post(route('inventory.settings', $product), [
                'low_stock_threshold' => 14,
                'selling_price' => '29.99',
                'price_change_note' => 'Supplier cost increase',
            ])
            ->assertRedirect(route('inventory.index', ['tab' => 'on-hand']));

        $product->refresh();

        $this->assertSame(14, $product->low_stock_threshold);
        $this->assertSame('29.99', $product->selling_price);

        $this->assertDatabaseHas('product_selling_price_histories', [
            'product_id' => $product->id,
            'previous_price' => '25.00',
            'new_price' => '29.99',
            'note' => 'Supplier cost increase',
            'created_by' => $admin->name,
        ]);
    }

    public function test_inventory_settings_does_not_record_price_history_when_unchanged(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->available()->create([
            'selling_price' => '18.50',
            'low_stock_threshold' => 8,
        ]);

        $this->actingAs($admin)
            ->post(route('inventory.settings', $product), [
                'low_stock_threshold' => 12,
                'selling_price' => '18.50',
            ])
            ->assertRedirect(route('inventory.index', ['tab' => 'on-hand']));

        $this->assertSame(12, $product->fresh()->low_stock_threshold);
        $this->assertSame(0, ProductSellingPriceHistory::query()->count());
    }

    public function test_on_hand_tab_marks_low_stock_when_quantity_is_at_or_below_threshold(): void
    {
        $admin = User::factory()->create();
        Product::factory()->available()->create([
            'name' => 'Low Item',
            'quantity' => 6,
            'low_stock_threshold' => 10,
        ]);

        $this->actingAs($admin)
            ->get(route('inventory.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('products.data.0.is_low_stock', true)
                ->where('products.data.0.suggested_low_stock_threshold', 10)
            );
    }
}
