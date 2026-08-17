<?php

namespace App\Models;

use App\Enums\SalesOrderDiscountType;
use Database\Factories\SalesOrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable([
    'reference',
    'customer_id',
    'customer_name',
    'subtotal',
    'discount_type',
    'discount_value',
    'discount_amount',
    'grand_total',
    'notes',
])]
class SalesOrder extends Model
{
    /** @use HasFactory<SalesOrderFactory> */
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (SalesOrder $order): void {
            if (blank($order->reference)) {
                $order->reference = (string) Str::uuid();
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_type' => SalesOrderDiscountType::class,
            'discount_value' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    /**
     * @return HasMany<SalesOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    /**
     * @return HasMany<SalesOrderPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(SalesOrderPayment::class)->orderByDesc('paid_at')->orderByDesc('id');
    }

    public function amountPaid(): string
    {
        $sum = $this->relationLoaded('payments')
            ? $this->payments->sum(fn (SalesOrderPayment $payment) => (float) $payment->amount)
            : (float) $this->payments()->sum('amount');

        return number_format($sum, 2, '.', '');
    }

    public function balanceDue(): string
    {
        $balance = (float) $this->grand_total - (float) $this->amountPaid();

        return number_format(max(0, $balance), 2, '.', '');
    }

    public function paymentStatus(): string
    {
        $hasPayments = $this->relationLoaded('payments')
            ? $this->payments->isNotEmpty()
            : $this->payments()->exists();

        if (! $hasPayments) {
            return (float) $this->grand_total <= 0 ? 'paid' : 'unpaid';
        }

        return (float) $this->balanceDue() > 0 ? 'partial' : 'paid';
    }

    public function canAddPayment(): bool
    {
        return $this->deleted_at === null && (float) $this->balanceDue() > 0;
    }

    public function canVoid(): bool
    {
        if ($this->deleted_at !== null) {
            return false;
        }

        return $this->relationLoaded('payments')
            ? $this->payments->isEmpty()
            : $this->payments()->doesntExist();
    }

    /**
     * @return array<string, mixed>
     */
    public function toArrayPayload(): array
    {
        $amountPaid = $this->amountPaid();
        $balanceDue = $this->balanceDue();

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'customer_id' => $this->customer_id,
            'customer_name' => $this->customer?->name ?? $this->customer_name,
            'subtotal' => $this->subtotal,
            'discount_type' => $this->discount_type->value,
            'discount_value' => $this->discount_value,
            'discount_amount' => $this->discount_amount,
            'grand_total' => $this->grand_total,
            'amount_paid' => $amountPaid,
            'balance_due' => $balanceDue,
            'payment_status' => $this->paymentStatus(),
            'notes' => $this->notes,
            'item_count' => $this->relationLoaded('items')
                ? $this->items->count()
                : $this->items()->count(),
            'items' => $this->relationLoaded('items')
                ? $this->items->map(fn (SalesOrderItem $item) => $item->toArrayPayload())->values()->all()
                : [],
            'payments' => $this->relationLoaded('payments')
                ? $this->payments->map(fn (SalesOrderPayment $payment) => $payment->toArrayPayload())->values()->all()
                : [],
            'can_void' => $this->canVoid(),
            'can_add_payment' => $this->canAddPayment(),
            'can_restore' => $this->deleted_at !== null,
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array{
     *     subtotal: string,
     *     discount_type: SalesOrderDiscountType,
     *     discount_value: string,
     *     discount_amount: string,
     *     grand_total: string
     * }
     */
    public static function calculateHeaderTotals(
        string $subtotal,
        ?string $discountType,
        mixed $discountValue,
    ): array {
        $type = SalesOrderDiscountType::tryFrom((string) $discountType)
            ?? SalesOrderDiscountType::None;
        $value = is_numeric($discountValue) ? (float) $discountValue : 0.0;

        if ($value <= 0) {
            $type = SalesOrderDiscountType::None;
            $value = 0.0;
        }

        $subtotalAmount = (float) $subtotal;
        $discountAmount = match ($type) {
            SalesOrderDiscountType::None => 0.0,
            SalesOrderDiscountType::Percent => round($subtotalAmount * ($value / 100), 2),
            SalesOrderDiscountType::Amount => round($value, 2),
        };

        return [
            'subtotal' => number_format($subtotalAmount, 2, '.', ''),
            'discount_type' => $type,
            'discount_value' => number_format($value, 2, '.', ''),
            'discount_amount' => number_format($discountAmount, 2, '.', ''),
            'grand_total' => number_format(max(0, $subtotalAmount - $discountAmount), 2, '.', ''),
        ];
    }
}
