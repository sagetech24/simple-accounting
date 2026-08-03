<?php

namespace Database\Factories;

use App\Models\BankAccount;
use App\Models\BankAccountAuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BankAccountAuditLog>
 */
class BankAccountAuditLogFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'bank_account_id' => BankAccount::factory(),
            'actor_user_id' => User::factory(),
            'action' => 'account.updated',
            'subject_type' => 'bank_account',
            'subject_id' => null,
            'summary' => fake()->sentence(),
            'before' => null,
            'after' => null,
            'created_at' => now(),
        ];
    }
}
