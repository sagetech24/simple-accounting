<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'product_id',
    'previous_price',
    'new_price',
    'note',
    'created_by',
])]
class ProductSellingPriceHistory extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'previous_price' => 'decimal:2',
            'new_price' => 'decimal:2',
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
     * @return array<string, mixed>
     */
    public function toInventoryArray(): array
    {
        return [
            'id' => $this->id,
            'previous_price' => $this->previous_price,
            'new_price' => $this->new_price,
            'note' => $this->note,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
