<?php

namespace Tests\Feature;

use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountsHubTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_accounts_hub(): void
    {
        $this->get(route('accounts.index'))
            ->assertRedirect(route('login'));
    }

    public function test_accounts_hub_defaults_to_accounts_payable(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->active()->create(['name' => 'Posted Co']);
        $posted = PurchasedOrder::factory()
            ->ordered()
            ->postedToAccountsPayable()
            ->create([
                'supplier_id' => $supplier->id,
                'grand_total' => '100.00',
            ]);
        PurchasedOrderItem::factory()->create([
            'purchased_order_id' => $posted->id,
            'buying_price' => '100.00',
            'quantity' => 1,
            'subtotal' => '100.00',
        ]);

        $this->actingAs($admin)
            ->get(route('accounts.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('accounts-payable/index')
                ->has('suppliers', 1)
                ->where('suppliers.0.name', 'Posted Co')
            );
    }

    public function test_accounts_payable_index_redirects_to_hub(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->get(route('accounts-payable.index'))
            ->assertRedirect(route('accounts.index', ['tab' => 'accounts-payable']));
    }

    public function test_invalid_accounts_tab_is_rejected(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->from(route('accounts.index'))
            ->get(route('accounts.index', ['tab' => 'not-a-tab']))
            ->assertRedirect(route('accounts.index'))
            ->assertSessionHasErrors('tab');
    }
}
