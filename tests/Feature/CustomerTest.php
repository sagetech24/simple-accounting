<?php

namespace Tests\Feature;

use App\Enums\CustomerStatus;
use App\Models\Customer;
use App\Models\User;
use Database\Seeders\CustomerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_customers(): void
    {
        $this->get(route('customers.index'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_customer_index(): void
    {
        $admin = User::factory()->create();
        Customer::factory()->create(['name' => 'Acme Retail Co.']);

        $this->actingAs($admin)
            ->get(route('customers.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customers/index')
                ->has('customers.data', 1)
                ->has('statuses')
                ->where('customers.data.0.name', 'Acme Retail Co.')
            );
    }

    public function test_authenticated_users_can_create_a_customer(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->post(route('customers.store'), [
                'name' => 'Oak Boutique',
                'contact_name' => 'Sam Rivera',
                'email' => 'sam@oakboutique.example',
                'phone' => '+1-555-0200',
                'address' => '12 Main St',
                'notes' => 'Preferred for gift orders.',
                'status' => CustomerStatus::Active->value,
            ])
            ->assertRedirect(route('customers.index'));

        $this->assertDatabaseHas('customers', [
            'name' => 'Oak Boutique',
            'email' => 'sam@oakboutique.example',
            'status' => CustomerStatus::Active->value,
        ]);
    }

    public function test_authenticated_users_can_update_a_customer(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->create(['name' => 'Old Name']);

        $this->actingAs($admin)
            ->put(route('customers.update', $customer), [
                'name' => 'New Name',
                'contact_name' => $customer->contact_name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'notes' => $customer->notes,
                'status' => CustomerStatus::Inactive->value,
            ])
            ->assertRedirect(route('customers.index'));

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'name' => 'New Name',
            'status' => CustomerStatus::Inactive->value,
        ]);
    }

    public function test_authenticated_users_can_soft_delete_and_restore_a_customer(): void
    {
        $admin = User::factory()->create();
        $customer = Customer::factory()->create();

        $this->actingAs($admin)
            ->delete(route('customers.destroy', $customer))
            ->assertRedirect(route('customers.index'));

        $this->assertSoftDeleted($customer);

        $this->actingAs($admin)
            ->post(route('customers.restore', $customer))
            ->assertRedirect(route('customers.index'));

        $this->assertNotSoftDeleted($customer);
    }

    public function test_customers_can_be_sorted_by_name_descending(): void
    {
        $admin = User::factory()->create();
        Customer::factory()->create(['name' => 'Alpha Customer']);
        Customer::factory()->create(['name' => 'Zulu Customer']);

        $this->actingAs($admin)
            ->get(route('customers.index', [
                'sort' => 'name',
                'direction' => 'desc',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customers/index')
                ->where('filters.sort', 'name')
                ->where('filters.direction', 'desc')
                ->where('customers.data.0.name', 'Zulu Customer')
                ->where('customers.data.1.name', 'Alpha Customer')
            );
    }

    public function test_customer_seeder_creates_at_least_fifteen_active_customers(): void
    {
        $this->seed(CustomerSeeder::class);

        $this->assertGreaterThanOrEqual(
            15,
            Customer::query()->count(),
        );
    }
}
