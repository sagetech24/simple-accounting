<?php

namespace Tests\Feature;

use App\Enums\SupplierStatus;
use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\SupplierSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_suppliers(): void
    {
        $this->get(route('suppliers.index'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_supplier_index(): void
    {
        $admin = User::factory()->create();
        Supplier::factory()->create(['name' => 'Acme Supply Co.']);

        $this->actingAs($admin)
            ->get(route('suppliers.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('suppliers/index')
                ->has('suppliers.data', 1)
                ->where('suppliers.data.0.name', 'Acme Supply Co.')
            );
    }

    public function test_authenticated_users_can_create_a_supplier(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->post(route('suppliers.store'), [
                'name' => 'Oak Wholesale',
                'contact_name' => 'Sam Rivera',
                'email' => 'sam@oakwholesale.example',
                'phone' => '+1-555-0100',
                'address' => '12 Main St',
                'notes' => 'Preferred for lumber.',
                'status' => SupplierStatus::Active->value,
            ])
            ->assertRedirect(route('suppliers.index'));

        $this->assertDatabaseHas('suppliers', [
            'name' => 'Oak Wholesale',
            'email' => 'sam@oakwholesale.example',
            'status' => SupplierStatus::Active->value,
        ]);
    }

    public function test_authenticated_users_can_update_a_supplier(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->create(['name' => 'Old Name']);

        $this->actingAs($admin)
            ->put(route('suppliers.update', $supplier), [
                'name' => 'New Name',
                'contact_name' => $supplier->contact_name,
                'email' => $supplier->email,
                'phone' => $supplier->phone,
                'address' => $supplier->address,
                'notes' => $supplier->notes,
                'status' => SupplierStatus::Inactive->value,
            ])
            ->assertRedirect(route('suppliers.index'));

        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id,
            'name' => 'New Name',
            'status' => SupplierStatus::Inactive->value,
        ]);
    }

    public function test_authenticated_users_can_soft_delete_and_restore_a_supplier(): void
    {
        $admin = User::factory()->create();
        $supplier = Supplier::factory()->create();

        $this->actingAs($admin)
            ->delete(route('suppliers.destroy', $supplier))
            ->assertRedirect(route('suppliers.index'));

        $this->assertSoftDeleted($supplier);

        $this->actingAs($admin)
            ->post(route('suppliers.restore', $supplier))
            ->assertRedirect(route('suppliers.index'));

        $this->assertNotSoftDeleted($supplier);
    }

    public function test_suppliers_can_be_sorted_by_name_descending(): void
    {
        $admin = User::factory()->create();
        Supplier::factory()->create(['name' => 'Alpha Supply']);
        Supplier::factory()->create(['name' => 'Zulu Supply']);

        $this->actingAs($admin)
            ->get(route('suppliers.index', [
                'sort' => 'name',
                'direction' => 'desc',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('suppliers/index')
                ->where('filters.sort', 'name')
                ->where('filters.direction', 'desc')
                ->where('suppliers.data.0.name', 'Zulu Supply')
                ->where('suppliers.data.1.name', 'Alpha Supply')
            );
    }

    public function test_supplier_seeder_creates_at_least_fifteen_active_suppliers(): void
    {
        $this->seed(SupplierSeeder::class);

        $this->assertGreaterThanOrEqual(
            15,
            Supplier::query()->count(),
        );
    }
}
