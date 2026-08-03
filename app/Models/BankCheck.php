<?php

namespace App\Models;

use Database\Factories\BankCheckFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

#[Fillable([
    'bank_account_id',
    'check_number',
    'amount',
    'due_date',
    'issued_by',
    'notes',
    'voided_at',
])]
class BankCheck extends Model
{
    /** @use HasFactory<BankCheckFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'due_date' => 'date',
            'voided_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<BankAccount, $this>
     */
    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class)->withTrashed();
    }

    /**
     * @return HasOne<PurchasedOrderPayment, $this>
     */
    public function payment(): HasOne
    {
        return $this->hasOne(PurchasedOrderPayment::class);
    }

    public function isVoided(): bool
    {
        return $this->voided_at !== null;
    }

    public function isLinked(): bool
    {
        if ($this->relationLoaded('payment')) {
            return $this->payment !== null;
        }

        return $this->payment()->exists();
    }

    /**
     * Derived due status for UI: voided|overdue|due_today|upcoming
     */
    public function dueStatus(?Carbon $today = null): string
    {
        if ($this->isVoided()) {
            return 'voided';
        }

        $today ??= now()->startOfDay();
        $due = $this->due_date?->copy()->startOfDay();

        if ($due === null) {
            return 'upcoming';
        }

        if ($due->lt($today)) {
            return 'overdue';
        }

        if ($due->equalTo($today)) {
            return 'due_today';
        }

        return 'upcoming';
    }

    /**
     * @return array<string, mixed>
     */
    public function toArrayPayload(): array
    {
        $payment = $this->relationLoaded('payment') ? $this->payment : null;
        $order = $payment?->relationLoaded('purchasedOrder') ? $payment->purchasedOrder : null;
        $supplier = $order?->relationLoaded('supplier') ? $order->supplier : null;

        return [
            'id' => $this->id,
            'bank_account_id' => $this->bank_account_id,
            'bank_account_name' => $this->bankAccount?->name,
            'check_number' => $this->check_number,
            'amount' => $this->amount,
            'due_date' => $this->due_date?->toDateString(),
            'issued_by' => $this->issued_by,
            'notes' => $this->notes,
            'voided_at' => $this->voided_at?->toIso8601String(),
            'due_status' => $this->dueStatus(),
            'is_linked' => $this->isLinked(),
            'purchased_order_id' => $order?->id,
            'purchased_order_reference' => $order?->reference,
            'supplier_id' => $supplier?->id ?? $order?->supplier_id,
        ];
    }
}
