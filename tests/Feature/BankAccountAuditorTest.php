<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\User;
use App\Services\BankAccountAuditor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankAccountAuditorTest extends TestCase
{
    use RefreshDatabase;

    public function test_record_writes_append_only_audit_row(): void
    {
        $user = User::factory()->create(['name' => 'Admin']);
        $account = BankAccount::factory()->active()->create(['name' => 'BDO']);

        $log = app(BankAccountAuditor::class)->record(
            $account,
            'account.updated',
            $account,
            'Updated bank account BDO',
            ['name' => 'Old'],
            ['name' => 'BDO'],
            $user,
        );

        $this->assertDatabaseHas('bank_account_audit_logs', [
            'id' => $log->id,
            'bank_account_id' => $account->id,
            'actor_user_id' => $user->id,
            'action' => 'account.updated',
            'subject_type' => 'bank_account',
            'subject_id' => $account->id,
            'summary' => 'Updated bank account BDO',
        ]);
    }
}
