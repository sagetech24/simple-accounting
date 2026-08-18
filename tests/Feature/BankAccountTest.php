<?php

namespace Tests\Feature;

use App\Enums\BankAccountStatus;
use App\Models\BankAccount;
use App\Models\User;
use Database\Seeders\BankAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BankAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_bank_accounts(): void
    {
        $this->get(route('bank-accounts.index'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_bank_account_index(): void
    {
        $admin = User::factory()->create();
        BankAccount::factory()->create(['name' => 'BDO']);

        $this->actingAs($admin)
            ->get(route('accounts.index', ['tab' => 'bank-accounts']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('bank-accounts/index')
                ->has('bankAccounts.data', 1)
                ->has('statuses')
                ->where('bankAccounts.data.0.name', 'BDO')
            );
    }

    public function test_authenticated_users_can_create_a_bank_account(): void
    {
        $admin = User::factory()->create();

        $this->actingAs($admin)
            ->post(route('bank-accounts.store'), [
                'name' => 'Land Bank',
                'account_name' => 'Ops Account',
                'account_number' => '1234567890',
                'notes' => 'Primary PDC bank.',
                'status' => BankAccountStatus::Active->value,
            ])
            ->assertRedirect(route('accounts.index', ['tab' => 'bank-accounts']));

        $this->assertDatabaseHas('bank_accounts', [
            'name' => 'Land Bank',
            'account_number' => '1234567890',
            'status' => BankAccountStatus::Active->value,
        ]);
    }

    public function test_authenticated_users_can_update_a_bank_account(): void
    {
        $admin = User::factory()->create();
        $bankAccount = BankAccount::factory()->create(['name' => 'Old Bank']);

        $this->actingAs($admin)
            ->put(route('bank-accounts.update', $bankAccount), [
                'name' => 'New Bank',
                'account_name' => $bankAccount->account_name,
                'account_number' => $bankAccount->account_number,
                'notes' => $bankAccount->notes,
                'status' => BankAccountStatus::Inactive->value,
            ])
            ->assertRedirect(route('accounts.index', ['tab' => 'bank-accounts']));

        $this->assertDatabaseHas('bank_accounts', [
            'id' => $bankAccount->id,
            'name' => 'New Bank',
            'status' => BankAccountStatus::Inactive->value,
        ]);

        $this->assertDatabaseHas('bank_account_audit_logs', [
            'bank_account_id' => $bankAccount->id,
            'action' => 'account.updated',
            'subject_type' => 'bank_account',
            'subject_id' => $bankAccount->id,
        ]);
    }

    public function test_updating_bank_account_from_profile_redirects_to_show(): void
    {
        $admin = User::factory()->create();
        $bankAccount = BankAccount::factory()->create(['name' => 'Profile Bank']);

        $this->actingAs($admin)
            ->put(route('bank-accounts.update', $bankAccount), [
                'name' => 'Profile Bank Updated',
                'account_name' => $bankAccount->account_name,
                'account_number' => $bankAccount->account_number,
                'notes' => $bankAccount->notes,
                'status' => BankAccountStatus::Active->value,
                'return_to' => 'show',
            ])
            ->assertRedirect(route('bank-accounts.show', $bankAccount));
    }

    public function test_authenticated_users_can_soft_delete_and_restore_a_bank_account(): void
    {
        $admin = User::factory()->create();
        $bankAccount = BankAccount::factory()->create();

        $this->actingAs($admin)
            ->delete(route('bank-accounts.destroy', $bankAccount))
            ->assertRedirect(route('accounts.index', ['tab' => 'bank-accounts']));

        $this->assertSoftDeleted($bankAccount);

        $this->actingAs($admin)
            ->post(route('bank-accounts.restore', $bankAccount))
            ->assertRedirect(route('accounts.index', ['tab' => 'bank-accounts']));

        $this->assertNotSoftDeleted($bankAccount);
    }

    public function test_bank_accounts_can_be_sorted_by_name_descending(): void
    {
        $admin = User::factory()->create();
        BankAccount::factory()->create(['name' => 'Alpha Bank']);
        BankAccount::factory()->create(['name' => 'Zulu Bank']);

        $this->actingAs($admin)
            ->get(route('accounts.index', [
                'tab' => 'bank-accounts',
                'sort' => 'name',
                'direction' => 'desc',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('bank-accounts/index')
                ->where('filters.sort', 'name')
                ->where('filters.direction', 'desc')
                ->where('bankAccounts.data.0.name', 'Zulu Bank')
                ->where('bankAccounts.data.1.name', 'Alpha Bank')
            );
    }

    public function test_bank_account_seeder_creates_common_banks(): void
    {
        $this->seed(BankAccountSeeder::class);

        $this->assertGreaterThanOrEqual(
            4,
            BankAccount::query()->count(),
        );
    }
}
