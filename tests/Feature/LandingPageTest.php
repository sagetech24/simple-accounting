<?php

namespace Tests\Feature;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LandingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_to_catalog_array_omits_purchase_price_and_quantity(): void
    {
        $product = Product::factory()->available()->create([
            'name' => 'Cedar Notebook',
            'unit' => 'pcs',
            'description' => 'Ruled pages',
            'quantity' => 12,
            'purchase_price' => 7.25,
            'selling_price' => 18.50,
        ]);
        $product->load('categories');

        $payload = $product->toCatalogArray();

        $this->assertSame('Cedar Notebook', $payload['name']);
        $this->assertSame('pcs', $payload['unit']);
        $this->assertSame('Ruled pages', $payload['description']);
        $this->assertSame('18.50', $payload['selling_price']);
        $this->assertArrayNotHasKey('purchase_price', $payload);
        $this->assertArrayNotHasKey('quantity', $payload);
        $this->assertArrayNotHasKey('status', $payload);
        $this->assertArrayNotHasKey('deleted_at', $payload);
    }

    public function test_publicly_visible_scope_includes_only_available_products(): void
    {
        Product::factory()->available()->create(['name' => 'Visible']);
        Product::factory()->unavailable()->create(['name' => 'Hidden Unavailable']);
        Product::factory()->discontinued()->create(['name' => 'Hidden Discontinued']);
        $deleted = Product::factory()->available()->create(['name' => 'Hidden Deleted']);
        $deleted->delete();

        $names = Product::query()->publiclyVisible()->orderBy('name')->pluck('name')->all();

        $this->assertSame(['Visible'], $names);
    }
}
