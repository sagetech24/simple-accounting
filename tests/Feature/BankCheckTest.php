<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\BankCheck;
use App\Models\PurchasedOrderPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_standalone_check_and_audit(): void
    {
        $admin = User::factory()->create(['name' => 'Admin User']);
        $account = BankAccount::factory()->active()->create();

        $this->actingAs($admin)
            ->post(route('bank-accounts.checks.store', $account), [
                'check_number' => 'CHK-100',
                'amount' => '250.50',
                'due_date' => now()->addWeek()->toDateString(),
                'issued_by' => 'Admin User',
                'notes' => 'Standalone',
            ])
            ->assertRedirect(route('bank-accounts.show', $account));

        $this->assertDatabaseHas('bank_checks', [
            'bank_account_id' => $account->id,
            'check_number' => 'CHK-100',
            'amount' => '250.50',
            'issued_by' => 'Admin User',
            'voided_at' => null,
        ]);

        $this->assertDatabaseHas('bank_account_audit_logs', [
            'bank_account_id' => $account->id,
            'action' => 'check.created',
            'subject_type' => 'bank_check',
        ]);
    }

    public function test_can_update_check_fields_and_audit(): void
    {
        $admin = User::factory()->create();
        $account = BankAccount::factory()->active()->create();
        $check = BankCheck::factory()->create([
            'bank_account_id' => $account->id,
            'check_number' => 'OLD-1',
            'amount' => '100.00',
            'issued_by' => 'Old Issuer',
        ]);

        $this->actingAs($admin)
            ->patch(route('bank-accounts.checks.update', [$account, $check]), [
                'check_number' => 'NEW-1',
                'amount' => '150.00',
                'due_date' => now()->addDays(10)->toDateString(),
                'issued_by' => 'New Issuer',
                'notes' => 'Updated',
            ])
            ->assertRedirect(route('bank-accounts.show', $account));

        $this->assertDatabaseHas('bank_checks', [
            'id' => $check->id,
            'check_number' => 'NEW-1',
            'amount' => '150.00',
            'issued_by' => 'New Issuer',
        ]);

        $this->assertDatabaseHas('bank_account_audit_logs', [
            'bank_account_id' => $account->id,
            'action' => 'check.updated',
            'subject_id' => $check->id,
        ]);
    }

    public function test_can_void_standalone_check(): void
    {
        $admin = User::factory()->create();
        $account = BankAccount::factory()->active()->create();
        $check = BankCheck::factory()->create([
            'bank_account_id' => $account->id,
        ]);

        $this->actingAs($admin)
            ->post(route('bank-accounts.checks.void', [$account, $check]))
            ->assertRedirect(route('bank-accounts.show', $account));

        $this->assertNotNull($check->fresh()->voided_at);

        $this->assertDatabaseHas('bank_account_audit_logs', [
            'bank_account_id' => $account->id,
            'action' => 'check.voided',
            'subject_id' => $check->id,
        ]);
    }

    public function test_cannot_void_linked_check(): void
    {
        $admin = User::factory()->create();
        $account = BankAccount::factory()->active()->create();
        $check = BankCheck::factory()->create([
            'bank_account_id' => $account->id,
        ]);
        PurchasedOrderPayment::factory()->create([
            'bank_check_id' => $check->id,
            'amount' => $check->amount,
        ]);

        $this->actingAs($admin)
            ->from(route('bank-accounts.show', $account))
            ->post(route('bank-accounts.checks.void', [$account, $check]))
            ->assertRedirect(route('bank-accounts.show', $account))
            ->assertSessionHasErrors('void');

        $this->assertNull($check->fresh()->voided_at);
    }
}
