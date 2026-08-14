<?php

namespace App\Models;

use App\Enums\SalesOrderPaymentMethod;
use Database\Factories\SalesOrderPaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'sales_order_id',
    'method',
    'amount',
    'notes',
    'platform',
    'reference_number',
    'bank_name',
    'bank_check_id',
    'recorded_by',
    'paid_at',
])]
class SalesOrderPayment extends Model
{
    /** @use HasFactory<SalesOrderPaymentFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'method' => SalesOrderPaymentMethod::class,
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<SalesOrder, $this>
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /**
     * @return BelongsTo<BankCheck, $this>
     */
    public function bankCheck(): BelongsTo
    {
        return $this->belongsTo(BankCheck::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArrayPayload(): array
    {
        $bankCheck = $this->relationLoaded('bankCheck') ? $this->bankCheck : null;

        if ($bankCheck !== null && ! $bankCheck->relationLoaded('bankAccount')) {
            $bankCheck->load('bankAccount');
        }

        return [
            'id' => $this->id,
            'sales_order_id' => $this->sales_order_id,
            'method' => $this->method->value,
            'method_label' => $this->method->label(),
            'amount' => $this->amount,
            'notes' => $this->notes,
            'platform' => $this->platform,
            'reference_number' => $this->reference_number,
            'bank_name' => $this->bank_name,
            'bank_check_id' => $this->bank_check_id,
            'bank_check' => $bankCheck?->toArrayPayload(),
            'recorded_by' => $this->recorded_by,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
