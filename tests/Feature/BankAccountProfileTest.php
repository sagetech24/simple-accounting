<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\BankCheck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BankAccountProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_bank_account_profile(): void
    {
        $account = BankAccount::factory()->create();

        $this->get(route('bank-accounts.show', $account))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_view_bank_account_profile(): void
    {
        $admin = User::factory()->create();
        $account = BankAccount::factory()->active()->create(['name' => 'BDO Ops']);

        BankCheck::factory()->create([
            'bank_account_id' => $account->id,
            'amount' => '100.00',
            'due_date' => now()->addDays(5)->toDateString(),
        ]);
        BankCheck::factory()->create([
            'bank_account_id' => $account->id,
            'amount' => '50.00',
            'due_date' => now()->subDay()->toDateString(),
        ]);

        $this->actingAs($admin)
            ->get(route('bank-accounts.show', $account))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('bank-accounts/show')
                ->where('bankAccount.name', 'BDO Ops')
                ->where('kpis.issued_count', 2)
                ->where('kpis.overdue_count', 1)
                ->where('kpis.upcoming_count', 1)
                ->has('checks')
                ->has('payments')
                ->has('auditLogs')
                ->has('eligibleOrders')
            );
    }

    public function test_upcoming_filter_excludes_voided_and_overdue(): void
    {
        $admin = User::factory()->create();
        $account = BankAccount::factory()->active()->create();

        $upcoming = BankCheck::factory()->create([
            'bank_account_id' => $account->id,
            'check_number' => 'UP-1',
            'due_date' => now()->addDays(3)->toDateString(),
        ]);
        BankCheck::factory()->create([
            'bank_account_id' => $account->id,
            'check_number' => 'OD-1',
            'due_date' => now()->subDays(2)->toDateString(),
        ]);
        BankCheck::factory()->voided()->create([
            'bank_account_id' => $account->id,
            'check_number' => 'VD-1',
            'due_date' => now()->addDays(10)->toDateString(),
        ]);

        $this->actingAs($admin)
            ->get(route('bank-accounts.show', [
                'bank_account' => $account,
                'due' => 'upcoming',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('bank-accounts/show')
                ->has('checks', 1)
                ->where('checks.0.id', $upcoming->id)
                ->where('checks.0.check_number', 'UP-1')
            );
    }
}
