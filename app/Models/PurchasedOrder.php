<?php

namespace App\Models;

use App\Enums\PurchasedOrderStatus;
use Database\Factories\PurchasedOrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable([
    'reference',
    'supplier_id',
    'request_quotation_id',
    'status',
    'grand_total',
    'notes',
    'meta',
])]
class PurchasedOrder extends Model
{
    /** @use HasFactory<PurchasedOrderFactory> */
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (PurchasedOrder $order): void {
            if (blank($order->reference)) {
                $order->reference = (string) Str::uuid();
            }

            if ($order->status === null) {
                $order->status = PurchasedOrderStatus::Draft;
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => PurchasedOrderStatus::class,
            'grand_total' => 'decimal:2',
            'meta' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class)->withTrashed();
    }

    /**
     * @return BelongsTo<RequestQuotation, $this>
     */
    public function requestQuotation(): BelongsTo
    {
        return $this->belongsTo(RequestQuotation::class)->withTrashed();
    }

    /**
     * @return HasMany<PurchasedOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchasedOrderItem::class);
    }

    /**
     * @return HasMany<PurchasedOrderPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(PurchasedOrderPayment::class)->orderByDesc('paid_at')->orderByDesc('id');
    }

    public function isEditable(): bool
    {
        return $this->status === PurchasedOrderStatus::Draft;
    }

    public function amountPaid(): string
    {
        $sum = $this->relationLoaded('payments')
            ? $this->payments->sum(fn (PurchasedOrderPayment $payment) => (float) $payment->amount)
            : (float) $this->payments()->sum('amount');

        return number_format($sum, 2, '.', '');
    }

    public function balanceDue(): string
    {
        $balance = (float) $this->grand_total - (float) $this->amountPaid();

        return number_format(max(0, $balance), 2, '.', '');
    }

    public function canAddPrepayment(): bool
    {
        return in_array($this->status, [
            PurchasedOrderStatus::Ordered,
            PurchasedOrderStatus::Received,
        ], true)
            && $this->deleted_at === null
            && (float) $this->balanceDue() > 0;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArrayPayload(bool $includeRelated = true): array
    {
        $requestQuotation = $this->relationLoaded('requestQuotation')
            ? $this->requestQuotation
            : null;

        if ($includeRelated && $requestQuotation === null && $this->request_quotation_id !== null) {
            $requestQuotation = $this->requestQuotation()
                ->with(['supplier', 'items.product'])
                ->first();
        }

        $amountPaid = $this->amountPaid();
        $balanceDue = $this->balanceDue();

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier?->name,
            'request_quotation_id' => $this->request_quotation_id,
            'request_quotation_reference' => $requestQuotation?->reference ?? $this->requestQuotation?->reference,
            'request_quotation' => $includeRelated && $requestQuotation !== null
                ? $requestQuotation->toArrayPayload(includeRelated: false)
                : null,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'grand_total' => $this->grand_total,
            'amount_paid' => $amountPaid,
            'balance_due' => $balanceDue,
            'notes' => $this->notes,
            'meta' => $this->meta,
            'item_count' => $this->relationLoaded('items')
                ? $this->items->count()
                : $this->items()->count(),
            'items' => $this->relationLoaded('items')
                ? $this->items->map(fn (PurchasedOrderItem $item) => $item->toArrayPayload())->values()->all()
                : [],
            'payments' => $this->relationLoaded('payments')
                ? $this->payments->map(fn (PurchasedOrderPayment $payment) => $payment->toArrayPayload())->values()->all()
                : [],
            'next_action' => match ($this->status) {
                PurchasedOrderStatus::Draft => 'mark_ordered',
                PurchasedOrderStatus::Ordered => 'mark_received',
                PurchasedOrderStatus::Received => null,
            },
            'can_edit' => $this->isEditable() && $this->deleted_at === null,
            'can_add_prepayment' => $this->canAddPrepayment(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * Order by ordered → draft → received, then newest first.
     *
     * @param  Builder<PurchasedOrder>  $query
     * @return Builder<PurchasedOrder>
     */
    public function scopeOrderedByWorkflow(Builder $query): Builder
    {
        return $query
            ->orderByRaw("CASE status WHEN 'ordered' THEN 0 WHEN 'draft' THEN 1 WHEN 'received' THEN 2 ELSE 3 END")
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }
}
