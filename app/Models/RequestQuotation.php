<?php

namespace App\Models;

use App\Enums\RequestQuotationStatus;
use Database\Factories\RequestQuotationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'reference',
    'supplier_id',
    'status',
    'grand_total',
    'notes',
])]
class RequestQuotation extends Model
{
    /** @use HasFactory<RequestQuotationFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (RequestQuotation $quotation): void {
            if (blank($quotation->reference)) {
                $quotation->reference = (string) Str::uuid();
            }

            if ($quotation->status === null) {
                $quotation->status = RequestQuotationStatus::Draft;
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => RequestQuotationStatus::class,
            'grand_total' => 'decimal:2',
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
     * @return HasMany<RequestQuotationItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(RequestQuotationItem::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArrayPayload(): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier?->name,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'grand_total' => $this->grand_total,
            'notes' => $this->notes,
            'item_count' => $this->relationLoaded('items')
                ? $this->items->count()
                : $this->items()->count(),
            'items' => $this->relationLoaded('items')
                ? $this->items->map(fn (RequestQuotationItem $item) => $item->toArrayPayload())->values()->all()
                : [],
            'next_action' => match ($this->status) {
                RequestQuotationStatus::Draft => 'submit',
                RequestQuotationStatus::Pending => 'approve',
                RequestQuotationStatus::Approved => null,
            },
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * Order by pending → approved → draft, then newest first.
     *
     * @param  Builder<RequestQuotation>  $query
     * @return Builder<RequestQuotation>
     */
    public function scopeOrderedByWorkflow(Builder $query): Builder
    {
        return $query
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'draft' THEN 2 ELSE 3 END")
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }
}
