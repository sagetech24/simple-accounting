<?php

namespace App\Models;

use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

#[Fillable([
    'product_id',
    'type',
    'quantity_delta',
    'quantity_after',
    'unit_cost',
    'reference_type',
    'reference_id',
    'notes',
    'created_by',
])]
class StockMovement extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => StockMovementType::class,
            'quantity_delta' => 'integer',
            'quantity_after' => 'integer',
            'unit_cost' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class)->withTrashed();
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @return array<string, mixed>
     */
    public function toInventoryArray(): array
    {
        $reference = null;

        if ($this->reference instanceof PurchasedOrder) {
            $reference = [
                'type' => 'purchased_order',
                'id' => $this->reference->id,
                'label' => $this->reference->reference,
                'purchased_order' => $this->reference->toArrayPayload(),
            ];
        } elseif ($this->reference instanceof SalesOrder) {
            $reference = [
                'type' => 'sales_order',
                'id' => $this->reference->id,
                'label' => $this->reference->reference,
                'sales_order' => $this->reference->toArrayPayload(),
            ];
        } elseif ($this->reference_type !== null) {
            $reference = [
                'type' => $this->reference_type,
                'id' => $this->reference_id,
                'label' => null,
            ];
        }

        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'product_unit' => $this->product?->unit,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'quantity_delta' => $this->quantity_delta,
            'quantity_after' => $this->quantity_after,
            'unit_cost' => $this->unit_cost,
            'reference' => $reference,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
