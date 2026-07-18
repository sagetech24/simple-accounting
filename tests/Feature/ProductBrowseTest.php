<?php

namespace Tests\Feature;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductBrowseTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_products_browse(): void
    {
        $this->get(route('products'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_browse_products_for_inline_edit(): void
    {
        $admin = User::factory()->create();
        Product::factory()->available()->create([
            'name' => 'Cedar Notebook',
            'quantity' => 12,
            'selling_price' => 18.5,
            'purchase_price' => 7.25,
        ]);

        $this->actingAs($admin)
            ->get(route('products'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/index')
                ->has('products.data', 1)
                ->has('categories')
                ->has('statuses')
                ->has('filters')
                ->where('products.data.0.name', 'Cedar Notebook')
                ->where('products.data.0.selling_price', '18.50')
                ->where('products.data.0.purchase_price', '7.25')
                ->where('products.data.0.availability', 'in_stock')
                ->where('products.data.0.availability_label', 'In stock')
                ->has('products.data.0.category_ids')
            );
    }

    public function test_products_can_be_searched_by_name(): void
    {
        $admin = User::factory()->create();
        Product::factory()->create(['name' => 'Oak Desk Lamp']);
        Product::factory()->create(['name' => 'Steel Water Bottle']);

        $this->actingAs($admin)
            ->get(route('products', ['q' => 'Desk']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/index')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Oak Desk Lamp')
                ->where('filters.q', 'Desk')
            );
    }

    public function test_products_can_be_filtered_by_category(): void
    {
        $admin = User::factory()->create();
        $office = Category::factory()->create(['name' => 'Office', 'slug' => 'office']);
        $kitchen = Category::factory()->create(['name' => 'Kitchen', 'slug' => 'kitchen']);

        $desk = Product::factory()->create(['name' => 'Desk Organizer']);
        $desk->categories()->attach($office);

        $mug = Product::factory()->create(['name' => 'Ceramic Mug']);
        $mug->categories()->attach($kitchen);

        $this->actingAs($admin)
            ->get(route('products', ['category' => 'office']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/index')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Desk Organizer')
                ->where('filters.category', 'office')
            );
    }

    public function test_availability_reflects_status_and_quantity(): void
    {
        $admin = User::factory()->create();

        Product::factory()->create([
            'name' => 'In Stock Item',
            'status' => ProductStatus::Available,
            'quantity' => 5,
        ]);
        Product::factory()->create([
            'name' => 'Out Of Stock Item',
            'status' => ProductStatus::Available,
            'quantity' => 0,
        ]);
        Product::factory()->create([
            'name' => 'Unavailable Item',
            'status' => ProductStatus::Unavailable,
            'quantity' => 10,
        ]);
        Product::factory()->create([
            'name' => 'Discontinued Item',
            'status' => ProductStatus::Discontinued,
            'quantity' => 2,
        ]);

        $this->actingAs($admin)
            ->get(route('products'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/index')
                ->has('products.data', 4)
                ->where('products.data', function ($products) {
                    $byName = collect($products)->keyBy('name');

                    return $byName['In Stock Item']['availability'] === 'in_stock'
                        && $byName['Out Of Stock Item']['availability'] === 'out_of_stock'
                        && $byName['Unavailable Item']['availability'] === 'unavailable'
                        && $byName['Discontinued Item']['availability'] === 'discontinued';
                })
            );
    }

    public function test_soft_deleted_products_are_hidden_from_browse(): void
    {
        $admin = User::factory()->create();
        Product::factory()->create(['name' => 'Visible Item']);
        $deleted = Product::factory()->create(['name' => 'Hidden Item']);
        $deleted->delete();

        $this->actingAs($admin)
            ->get(route('products'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/index')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Visible Item')
            );
    }

    public function test_authenticated_users_can_create_a_product_from_browse_and_return(): void
    {
        $admin = User::factory()->create();
        $category = Category::factory()->create();

        $this->actingAs($admin)
            ->from(route('products'))
            ->post(route('admin.products.store'), [
                'name' => 'Browse Created Lamp',
                'description' => 'Created from products panel.',
                'quantity' => 8,
                'purchase_price' => 12.5,
                'selling_price' => 24.99,
                'status' => ProductStatus::Available->value,
                'category_ids' => [$category->id],
                'return_to' => 'products',
            ])
            ->assertRedirect(route('products'));

        $this->assertDatabaseHas('products', [
            'name' => 'Browse Created Lamp',
            'purchase_price' => 12.5,
            'selling_price' => 24.99,
        ]);
    }

    public function test_authenticated_users_can_update_a_product_from_browse_and_return(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->create([
            'name' => 'Old Name',
            'purchase_price' => 10,
            'selling_price' => 20,
        ]);

        $this->actingAs($admin)
            ->from(route('products'))
            ->put(route('admin.products.update', $product), [
                'name' => 'New Name',
                'description' => $product->description,
                'quantity' => $product->quantity,
                'purchase_price' => 11,
                'selling_price' => 22,
                'status' => ProductStatus::Available->value,
                'category_ids' => [],
                'return_to' => 'products',
            ])
            ->assertRedirect(route('products'));

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'New Name',
            'purchase_price' => 11,
            'selling_price' => 22,
        ]);
    }

    public function test_authenticated_users_can_soft_delete_a_product_from_browse_and_return(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($admin)
            ->from(route('products'))
            ->delete(route('admin.products.destroy', $product), [
                'return_to' => 'products',
            ])
            ->assertRedirect(route('products'));

        $this->assertSoftDeleted($product);
    }
}
