<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\PurchasedOrder;
use App\Models\PurchasedOrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchasedOrderItem>
 */
class PurchasedOrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $buyingPrice = fake()->randomFloat(2, 5, 250);
        $quantity = fake()->numberBetween(1, 20);

        return [
            'purchased_order_id' => PurchasedOrder::factory(),
            'product_id' => Product::factory()->available(),
            'buying_price' => $buyingPrice,
            'quantity' => $quantity,
            'subtotal' => PurchasedOrderItem::calculateSubtotal($buyingPrice, $quantity),
        ];
    }
}
