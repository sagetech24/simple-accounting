<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\BankAccountAuditLog;
use App\Models\BankCheck;
use App\Models\PurchasedOrderPayment;
use App\Models\SalesOrderPayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class BankAccountAuditor
{
    /**
     * Append an immutable audit row for a bank account.
     *
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    public function record(
        BankAccount $account,
        string $action,
        ?Model $subject,
        string $summary,
        ?array $before = null,
        ?array $after = null,
        ?User $actor = null,
    ): BankAccountAuditLog {
        return BankAccountAuditLog::query()->create([
            'bank_account_id' => $account->id,
            'actor_user_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $this->subjectType($subject),
            'subject_id' => $subject?->getKey(),
            'summary' => $summary,
            'before' => $before,
            'after' => $after,
            'created_at' => now(),
        ]);
    }

    private function subjectType(?Model $subject): string
    {
        return match (true) {
            $subject instanceof BankAccount => 'bank_account',
            $subject instanceof BankCheck => 'bank_check',
            $subject instanceof PurchasedOrderPayment => 'purchased_order_payment',
            $subject instanceof SalesOrderPayment => 'sales_order_payment',
            $subject === null => 'bank_account',
            default => class_basename($subject),
        };
    }
}
