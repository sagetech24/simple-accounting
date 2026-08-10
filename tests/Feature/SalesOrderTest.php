<?php

namespace Tests\Feature;

use App\Enums\CustomerStatus;
use App\Enums\StockMovementType;
use App\Models\Customer;
use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
                ->where('summary.order_count', 1)
                ->where('summary.grand_total_sum', '40.00')
                ->where('orders.data.0.reference', $order->reference)
                ->where('orders.data.0.customer_name', 'River Retail')
                ->where('orders.data.0.item_count', 1)
            );
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
        $this->assertSame('25.00', $order->grand_total);
        $this->assertSame(4, $productA->fresh()->quantity);
        $this->assertSame(1, $productB->fresh()->quantity);
        $this->assertSame(2, StockMovement::query()->where('type', StockMovementType::Sale)->count());
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
}
