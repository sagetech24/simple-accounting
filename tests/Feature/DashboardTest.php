<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderPayment;
use App\Models\RequestQuotation;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_dashboard(): void
    {
        $this->get(route('home'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_see_zero_kpis_when_empty(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard/index')
                ->where('kpis.pending_rfqs', 0)
                ->where('kpis.draft_pos', 0)
                ->where('kpis.ordered_pos', 0)
                ->where('kpis.ap_balance_due', '0.00')
                ->where('kpis.low_stock', 0)
                ->where('attention', [])
            );
    }

    public function test_kpis_reflect_procurement_snapshot(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create();

        RequestQuotation::factory()->pending()->create(['supplier_id' => $supplier->id]);
        RequestQuotation::factory()->draft()->create(['supplier_id' => $supplier->id]);
        RequestQuotation::factory()->pending()->create(['supplier_id' => $supplier->id])->delete();

        PurchasedOrder::factory()->draft()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '10.00',
        ]);
        PurchasedOrder::factory()->ordered()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '20.00',
        ]);
        PurchasedOrder::factory()->ordered()->create([
            'supplier_id' => $supplier->id,
            'grand_total' => '5.00',
        ])->delete();

        $posted = PurchasedOrder::factory()
            ->received()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '100.00',
            ]);
        PurchasedOrderPayment::factory()->create([
            'purchased_order_id' => $posted->id,
            'amount' => '40.00',
        ]);

        $settled = PurchasedOrder::factory()
            ->received()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '50.00',
            ]);
        PurchasedOrderPayment::factory()->create([
            'purchased_order_id' => $settled->id,
            'amount' => '50.00',
        ]);

        Product::factory()->available()->create([
            'name' => 'Low Widget',
            'quantity' => 2,
            'low_stock_threshold' => 5,
        ]);
        Product::factory()->available()->create([
            'name' => 'Ok Widget',
            'quantity' => 20,
            'low_stock_threshold' => 5,
        ]);
        Product::factory()->available()->create([
            'name' => 'No Threshold',
            'quantity' => 0,
            'low_stock_threshold' => null,
        ]);

        $this->actingAs($admin)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('kpis.pending_rfqs', 1)
                ->where('kpis.draft_pos', 1)
                ->where('kpis.ordered_pos', 1)
                ->where('kpis.ap_balance_due', '60.00')
                ->where('kpis.low_stock', 1)
            );
    }

    public function test_attention_list_includes_actionable_rows_and_excludes_noise(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create(['name' => 'Acme']);

        $rfq = RequestQuotation::factory()->pending()->create([
            'supplier_id' => $supplier->id,
            'reference' => '11111111-1111-1111-1111-111111111111',
        ]);
        RequestQuotation::factory()->draft()->create(['supplier_id' => $supplier->id]);

        $ordered = PurchasedOrder::factory()->ordered()->create([
            'supplier_id' => $supplier->id,
            'reference' => '22222222-2222-2222-2222-222222222222',
            'grand_total' => '30.00',
        ]);

        $posted = PurchasedOrder::factory()
            ->received()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'reference' => '33333333-3333-3333-3333-333333333333',
                'grand_total' => '80.00',
            ]);

        $settled = PurchasedOrder::factory()
            ->received()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '10.00',
            ]);
        PurchasedOrderPayment::factory()->create([
            'purchased_order_id' => $settled->id,
            'amount' => '10.00',
        ]);

        Product::factory()->available()->create([
            'name' => 'Bolt Pack',
            'quantity' => 1,
            'low_stock_threshold' => 4,
        ]);
        Product::factory()->available()->create([
            'name' => 'Plenty',
            'quantity' => 50,
            'low_stock_threshold' => 4,
        ]);

        $this->actingAs($admin)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('attention', 4)
                ->where('attention.0.type', 'pending_rfq')
                ->where('attention.0.title', $rfq->reference)
                ->where('attention.0.reason', 'Approve quotation')
                ->where('attention.0.href', route('request-quotations.index', absolute: false))
                ->where('attention.1.type', 'ordered_po')
                ->where('attention.1.title', $ordered->reference)
                ->where('attention.1.reason', 'Mark received')
                ->where('attention.1.href', route('purchased-orders.index', absolute: false))
                ->where('attention.2.type', 'ap_balance')
                ->where('attention.2.title', $posted->reference)
                ->where('attention.2.reason', 'Settle payment')
                ->where(
                    'attention.2.href',
                    route('accounts-payable.show', [$supplier, $posted], absolute: false)
                )
                ->where('attention.3.type', 'low_stock')
                ->where('attention.3.title', 'Bolt Pack')
                ->where('attention.3.reason', 'Review stock')
                ->where('attention.3.href', route('inventory.index', absolute: false))
            );
    }
}
