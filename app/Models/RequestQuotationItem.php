<?php

namespace App\Models;

use Database\Factories\RequestQuotationItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'request_quotation_id',
    'product_id',
    'buying_price',
    'quantity',
    'subtotal',
])]
class RequestQuotationItem extends Model
{
    /** @use HasFactory<RequestQuotationItemFactory> */
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
     * @return BelongsTo<RequestQuotation, $this>
     */
    public function requestQuotation(): BelongsTo
    {
        return $this->belongsTo(RequestQuotation::class);
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
