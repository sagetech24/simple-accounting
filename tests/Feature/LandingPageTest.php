<?php

namespace Tests\Feature;

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

    public function test_guests_see_landing_page_at_home(): void
    {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/index')
                ->has('products')
                ->has('categories')
                ->has('filters')
                ->where('hasSearched', false)
                ->where('filters.q', '')
                ->where('filters.category', '')
            );
    }

    public function test_guest_product_payload_omits_purchase_price_and_quantity(): void
    {
        Product::factory()->available()->create([
            'name' => 'Cedar Notebook',
            'quantity' => 12,
            'purchase_price' => 7.25,
            'selling_price' => 18.50,
        ]);

        $this->get(route('home', ['q' => 'Cedar']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/index')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Cedar Notebook')
                ->where('products.data.0.selling_price', '18.50')
                ->missing('products.data.0.purchase_price')
                ->missing('products.data.0.quantity')
            );
    }

    public function test_authenticated_users_can_view_landing_at_home(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/index')
                ->has('products')
                ->has('categories')
                ->has('filters')
            );
    }

    public function test_authenticated_users_see_dashboard_at_dashboard_route(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/index')
                ->has('kpis')
                ->has('attention')
            );
    }

    public function test_guests_can_search_by_name(): void
    {
        Product::factory()->available()->create(['name' => 'Oak Desk Lamp']);
        Product::factory()->available()->create(['name' => 'Steel Water Bottle']);

        $this->get(route('home', ['q' => 'Desk']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/index')
                ->where('hasSearched', true)
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Oak Desk Lamp')
                ->where('filters.q', 'Desk')
            );
    }

    public function test_guests_can_filter_by_category(): void
    {
        $office = Category::factory()->create(['name' => 'Office', 'slug' => 'office']);
        $kitchen = Category::factory()->create(['name' => 'Kitchen', 'slug' => 'kitchen']);

        $desk = Product::factory()->available()->create(['name' => 'Desk Organizer']);
        $desk->categories()->attach($office);

        $mug = Product::factory()->available()->create(['name' => 'Ceramic Mug']);
        $mug->categories()->attach($kitchen);

        $this->get(route('home', ['category' => 'office']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/index')
                ->where('hasSearched', true)
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Desk Organizer')
                ->where('filters.category', 'office')
                ->has('categories', 2)
            );
    }

    public function test_unavailable_discontinued_and_trashed_are_hidden_from_guests(): void
    {
        Product::factory()->available()->create(['name' => 'Visible Item']);
        Product::factory()->unavailable()->create(['name' => 'Unavailable Item']);
        Product::factory()->discontinued()->create(['name' => 'Discontinued Item']);
        $deleted = Product::factory()->available()->create(['name' => 'Deleted Item']);
        $deleted->delete();

        $this->get(route('home', ['q' => 'Item']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/index')
                ->has('products.data', 1)
                ->where('products.data.0.name', 'Visible Item')
            );
    }

    public function test_unknown_category_slug_is_dropped_not_rejected(): void
    {
        Product::factory()->available()->create(['name' => 'Anything']);

        $this->get(route('home', ['category' => 'does-not-exist']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/index')
                ->where('hasSearched', false)
                ->where('filters.category', '')
            );
    }

    public function test_categories_only_include_those_with_visible_products(): void
    {
        $withProduct = Category::factory()->create(['name' => 'Office', 'slug' => 'office']);
        Category::factory()->create(['name' => 'Empty Cat', 'slug' => 'empty-cat']);
        $onlyUnavailable = Category::factory()->create(['name' => 'Hidden Cat', 'slug' => 'hidden-cat']);

        $visible = Product::factory()->available()->create(['name' => 'Stapler']);
        $visible->categories()->attach($withProduct);

        $hidden = Product::factory()->unavailable()->create(['name' => 'Ghost']);
        $hidden->categories()->attach($onlyUnavailable);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/index')
                ->has('categories', 1)
                ->where('categories.0.slug', 'office')
            );
    }
}
