<?php

namespace App\Services;

use App\Enums\StockMovementType;
use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class StockService
{
    /**
     * Apply a signed quantity change and append an immutable stock movement.
     *
     * @throws InvalidArgumentException When the resulting on-hand quantity would be negative.
     */
    public function apply(
        Product $product,
        StockMovementType $type,
        int $quantityDelta,
        ?string $unitCost = null,
        ?Model $reference = null,
        ?string $notes = null,
        ?string $createdBy = null,
    ): StockMovement {
        if ($quantityDelta === 0) {
            throw new InvalidArgumentException('Stock movement quantity delta cannot be zero.');
        }

        return DB::transaction(function () use ($product, $type, $quantityDelta, $unitCost, $reference, $notes, $createdBy): StockMovement {
            $locked = Product::query()
                ->withTrashed()
                ->whereKey($product->id)
                ->lockForUpdate()
                ->firstOrFail();

            $quantityAfter = $locked->quantity + $quantityDelta;

            if ($quantityAfter < 0) {
                throw new InvalidArgumentException(
                    "Stock for {$locked->name} cannot go below zero.",
                );
            }

            $locked->update(['quantity' => $quantityAfter]);

            return StockMovement::query()->create([
                'product_id' => $locked->id,
                'type' => $type,
                'quantity_delta' => $quantityDelta,
                'quantity_after' => $quantityAfter,
                'unit_cost' => $unitCost,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'notes' => $notes,
                'created_by' => $createdBy,
            ]);
        });
    }

    /**
     * Post receipt movements for each line on a received purchase order.
     *
     * Caller must ensure the PO is being received exactly once (status gate).
     */
    public function receiveFromPurchasedOrder(PurchasedOrder $order, string $createdBy): void
    {
        $order->loadMissing('items.product');

        foreach ($order->items as $item) {
            $this->apply(
                product: $item->product,
                type: StockMovementType::Receipt,
                quantityDelta: $item->quantity,
                unitCost: (string) $item->buying_price,
                reference: $order,
                notes: null,
                createdBy: $createdBy,
            );
        }
    }

    /**
     * Set absolute on-hand quantity via an adjustment movement (no-op when unchanged).
     */
    public function setQuantity(
        Product $product,
        int $newQuantity,
        string $createdBy,
        ?string $notes = null,
    ): ?StockMovement {
        if ($newQuantity < 0) {
            throw new InvalidArgumentException('On-hand quantity cannot be negative.');
        }

        $delta = $newQuantity - $product->quantity;

        if ($delta === 0) {
            return null;
        }

        return $this->apply(
            product: $product,
            type: StockMovementType::Adjustment,
            quantityDelta: $delta,
            unitCost: null,
            reference: null,
            notes: $notes,
            createdBy: $createdBy,
        );
    }

    /**
     * Record opening balance when a product is created with non-zero quantity.
     */
    public function recordOpeningBalance(Product $product, string $createdBy): ?StockMovement
    {
        if ($product->quantity <= 0) {
            return null;
        }

        return StockMovement::query()->create([
            'product_id' => $product->id,
            'type' => StockMovementType::Adjustment,
            'quantity_delta' => $product->quantity,
            'quantity_after' => $product->quantity,
            'unit_cost' => null,
            'reference_type' => null,
            'reference_id' => null,
            'notes' => 'Opening balance',
            'created_by' => $createdBy,
        ]);
    }
}
