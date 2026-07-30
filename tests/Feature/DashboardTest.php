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
}
