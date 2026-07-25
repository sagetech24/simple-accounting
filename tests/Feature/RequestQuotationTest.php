<?php

namespace Tests\Feature;

use App\Enums\RequestQuotationStatus;
use App\Enums\SupplierStatus;
use App\Models\Product;
use App\Models\RequestQuotation;
use App\Models\RequestQuotationItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RequestQuotationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_request_quotations(): void
    {
        $this->get(route('request-quotations.index'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_request_quotation_index(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create(['name' => 'Acme Supply']);
        $quotation = RequestQuotation::factory()
            ->pending()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '25.00',
            ]);
        RequestQuotationItem::factory()->create([
            'request_quotation_id' => $quotation->id,
            'buying_price' => '12.50',
            'quantity' => 2,
            'subtotal' => '25.00',
        ]);

        $this->actingAs($admin)
            ->get(route('request-quotations.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('request-quotations/index')
                ->has('quotations.data', 1)
                ->has('suppliers')
                ->has('products')
                ->has('statuses')
                ->where('quotations.data.0.reference', $quotation->reference)
                ->where('quotations.data.0.supplier_name', 'Acme Supply')
                ->where('quotations.data.0.status', RequestQuotationStatus::Pending->value)
                ->where('quotations.data.0.item_count', 1)
            );
    }

    public function test_quotations_are_ordered_pending_approved_draft(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();

        $draft = RequestQuotation::factory()->draft()->create([
            'supplier_id' => $supplier->id,
            'created_at' => now()->subDay(),
        ]);
        $approved = RequestQuotation::factory()->approved()->create([
            'supplier_id' => $supplier->id,
            'created_at' => now()->subHours(2),
        ]);
        $pending = RequestQuotation::factory()->pending()->create([
            'supplier_id' => $supplier->id,
            'created_at' => now()->subHour(),
        ]);

        $this->actingAs($admin)
            ->get(route('request-quotations.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('request-quotations/index')
                ->where('quotations.data.0.id', $pending->id)
                ->where('quotations.data.1.id', $approved->id)
                ->where('quotations.data.2.id', $draft->id)
            );
    }

    public function test_authenticated_users_can_create_a_draft_quotation_with_line_items(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $productA = Product::factory()->available()->create(['purchase_price' => '10.00']);
        $productB = Product::factory()->available()->create(['purchase_price' => '5.50']);
        $reference = (string) Str::uuid();

        $this->actingAs($admin)
            ->post(route('request-quotations.store'), [
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
            ->assertRedirect(route('request-quotations.index'));

        $this->assertDatabaseHas('request_quotations', [
            'reference' => $reference,
            'supplier_id' => $supplier->id,
            'status' => RequestQuotationStatus::Draft->value,
            'grand_total' => '41.00',
            'notes' => 'Rush order',
        ]);

        $quotation = RequestQuotation::query()->where('reference', $reference)->firstOrFail();

        $this->assertDatabaseHas('request_quotation_items', [
            'request_quotation_id' => $quotation->id,
            'product_id' => $productA->id,
            'buying_price' => '10.00',
            'quantity' => 3,
            'subtotal' => '30.00',
        ]);

        $this->assertDatabaseHas('request_quotation_items', [
            'request_quotation_id' => $quotation->id,
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
            ->post(route('request-quotations.store'), [
                'supplier_id' => $supplier->id,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '8.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('request-quotations.index'));

        $quotation = RequestQuotation::query()->firstOrFail();

        $this->assertTrue(Str::isUuid($quotation->reference));
        $this->assertSame('8.00', $quotation->grand_total);
    }

    public function test_store_rejects_client_grand_total_and_recalculates_server_side(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();
        $product = Product::factory()->available()->create();

        $this->actingAs($admin)
            ->post(route('request-quotations.store'), [
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
            ->assertRedirect(route('request-quotations.index'));

        $this->assertDatabaseHas('request_quotations', [
            'supplier_id' => $supplier->id,
            'grand_total' => '17.00',
        ]);

        $this->assertDatabaseHas('request_quotation_items', [
            'product_id' => $product->id,
            'subtotal' => '17.00',
        ]);
    }

    public function test_store_validates_required_fields_and_line_items(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->from(route('request-quotations.index'))
            ->post(route('request-quotations.store'), [])
            ->assertRedirect(route('request-quotations.index'))
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
            ->from(route('request-quotations.index'))
            ->post(route('request-quotations.store'), [
                'supplier_id' => $inactiveSupplier->id,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '1.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('request-quotations.index'))
            ->assertSessionHasErrors(['supplier_id']);

        $this->actingAs($admin)
            ->from(route('request-quotations.index'))
            ->post(route('request-quotations.store'), [
                'supplier_id' => $deletedSupplier->id,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'buying_price' => '1.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('request-quotations.index'))
            ->assertSessionHasErrors(['supplier_id']);

        $activeSupplier = Supplier::factory()->active()->create();

        $this->actingAs($admin)
            ->from(route('request-quotations.index'))
            ->post(route('request-quotations.store'), [
                'supplier_id' => $activeSupplier->id,
                'items' => [
                    [
                        'product_id' => $deletedProduct->id,
                        'buying_price' => '1.00',
                        'quantity' => 1,
                    ],
                ],
            ])
            ->assertRedirect(route('request-quotations.index'))
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
            ->get(route('request-quotations.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('request-quotations/index')
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

    public function test_draft_can_be_submitted_and_pending_can_be_approved(): void
    {
        $admin = User::factory()->create();
        $quotation = RequestQuotation::factory()->draft()->create();

        $this->actingAs($admin)
            ->post(route('request-quotations.submit', $quotation))
            ->assertRedirect(route('request-quotations.index'));

        $this->assertDatabaseHas('request_quotations', [
            'id' => $quotation->id,
            'status' => RequestQuotationStatus::Pending->value,
        ]);

        $this->actingAs($admin)
            ->post(route('request-quotations.approve', $quotation))
            ->assertRedirect(route('request-quotations.index'));

        $this->assertDatabaseHas('request_quotations', [
            'id' => $quotation->id,
            'status' => RequestQuotationStatus::Approved->value,
        ]);
    }

    public function test_forbidden_status_transitions_are_rejected(): void
    {
        $admin = User::factory()->create();
        $pending = RequestQuotation::factory()->pending()->create();
        $approved = RequestQuotation::factory()->approved()->create();
        $draft = RequestQuotation::factory()->draft()->create();

        $this->actingAs($admin)
            ->post(route('request-quotations.submit', $pending))
            ->assertRedirect(route('request-quotations.index'));

        $this->assertDatabaseHas('request_quotations', [
            'id' => $pending->id,
            'status' => RequestQuotationStatus::Pending->value,
        ]);

        $this->actingAs($admin)
            ->post(route('request-quotations.approve', $draft))
            ->assertRedirect(route('request-quotations.index'));

        $this->assertDatabaseHas('request_quotations', [
            'id' => $draft->id,
            'status' => RequestQuotationStatus::Draft->value,
        ]);

        $this->actingAs($admin)
            ->post(route('request-quotations.approve', $approved))
            ->assertRedirect(route('request-quotations.index'));

        $this->assertDatabaseHas('request_quotations', [
            'id' => $approved->id,
            'status' => RequestQuotationStatus::Approved->value,
        ]);
    }
}
