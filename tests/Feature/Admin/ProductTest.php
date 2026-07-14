<?php

namespace Tests\Feature\Admin;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_admin_products(): void
    {
        $this->get(route('admin.products.index'))
            ->assertRedirect(route('login'));
    }

    public function test_admin_can_view_product_index(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->create(['name' => 'Walnut Desk']);

        $this->actingAs($admin)
            ->get(route('admin.products.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/products/index')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Walnut Desk')
                ->where('products.data.0.purchase_price', $product->purchase_price)
            );
    }

    public function test_admin_can_create_a_product(): void
    {
        $admin = User::factory()->create();
        $category = Category::factory()->create();

        $this->actingAs($admin)
            ->post(route('admin.products.store'), [
                'name' => 'Oak Chair',
                'description' => 'Solid oak.',
                'quantity' => 12,
                'purchase_price' => 40.5,
                'selling_price' => 79.99,
                'status' => ProductStatus::Available->value,
                'category_ids' => [$category->id],
            ])
            ->assertRedirect(route('admin.products.index'));

        $this->assertDatabaseHas('products', [
            'name' => 'Oak Chair',
            'purchase_price' => 40.5,
            'selling_price' => 79.99,
        ]);

        $product = Product::query()->where('name', 'Oak Chair')->first();
        $this->assertTrue($product->categories->contains($category));
    }

    public function test_admin_can_update_a_product(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->create(['name' => 'Old Name']);
        $category = Category::factory()->create();

        $this->actingAs($admin)
            ->put(route('admin.products.update', $product), [
                'name' => 'New Name',
                'description' => $product->description,
                'quantity' => 5,
                'purchase_price' => 10,
                'selling_price' => 25,
                'status' => ProductStatus::Unavailable->value,
                'category_ids' => [$category->id],
            ])
            ->assertRedirect(route('admin.products.index'));

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'New Name',
            'quantity' => 5,
            'status' => ProductStatus::Unavailable->value,
        ]);
    }

    public function test_admin_can_soft_delete_and_restore_a_product(): void
    {
        $admin = User::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($admin)
            ->delete(route('admin.products.destroy', $product))
            ->assertRedirect(route('admin.products.index'));

        $this->assertSoftDeleted($product);

        $this->actingAs($admin)
            ->post(route('admin.products.restore', $product))
            ->assertRedirect(route('admin.products.index'));

        $this->assertNotSoftDeleted($product);
    }

    public function test_store_validates_required_fields(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->from(route('admin.products.create'))
            ->post(route('admin.products.store'), [])
            ->assertRedirect(route('admin.products.create'))
            ->assertSessionHasErrors([
                'name',
                'quantity',
                'purchase_price',
                'selling_price',
                'status',
            ]);
    }

    public function test_public_catalog_hides_soft_deleted_products(): void
    {
        Product::factory()->create(['name' => 'Visible Item']);
        $deleted = Product::factory()->create(['name' => 'Hidden Item']);
        $deleted->delete();

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('home')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Visible Item')
                ->missing('products.data.0.purchase_price')
            );
    }
}
