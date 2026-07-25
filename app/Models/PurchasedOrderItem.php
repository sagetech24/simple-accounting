<?php

namespace App\Models;

use Database\Factories\PurchasedOrderItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'purchased_order_id',
    'product_id',
    'buying_price',
    'quantity',
    'subtotal',
])]
class PurchasedOrderItem extends Model
{
    /** @use HasFactory<PurchasedOrderItemFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'buying_price' => 'decimal:2',
            'quantity' => 'integer',
            'subtotal' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<PurchasedOrder, $this>
     */
    public function purchasedOrder(): BelongsTo
    {
        return $this->belongsTo(PurchasedOrder::class);
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
    public function toArrayPayload(): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'buying_price' => $this->buying_price,
            'quantity' => $this->quantity,
            'subtotal' => $this->subtotal,
        ];
    }

    public static function calculateSubtotal(float|string $buyingPrice, int $quantity): string
    {
        return number_format((float) $buyingPrice * $quantity, 2, '.', '');
    }
}
