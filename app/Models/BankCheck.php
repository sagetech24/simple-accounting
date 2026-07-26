<?php

namespace App\Models;

use Database\Factories\BankCheckFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'bank_account_id',
    'check_number',
    'amount',
    'due_date',
    'issued_by',
    'notes',
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

    /**
     * @return array<string, mixed>
     */
    public function toArrayPayload(): array
    {
        return [
            'id' => $this->id,
            'bank_account_id' => $this->bank_account_id,
            'bank_account_name' => $this->bankAccount?->name,
            'check_number' => $this->check_number,
            'amount' => $this->amount,
            'due_date' => $this->due_date?->toDateString(),
            'issued_by' => $this->issued_by,
            'notes' => $this->notes,
        ];
    }
}
