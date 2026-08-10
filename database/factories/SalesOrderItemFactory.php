<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalesOrderItem>
 */
class SalesOrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $sellingPrice = fake()->randomFloat(2, 5, 250);
        $quantity = fake()->numberBetween(1, 20);

        return [
            'sales_order_id' => SalesOrder::factory(),
            'product_id' => Product::factory()->available(),
            'selling_price' => $sellingPrice,
            'quantity' => $quantity,
            'subtotal' => SalesOrderItem::calculateSubtotal($sellingPrice, $quantity),
        ];
    }
}
