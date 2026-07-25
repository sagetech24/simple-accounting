<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\RequestQuotation;
use App\Models\RequestQuotationItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RequestQuotationItem>
 */
class RequestQuotationItemFactory extends Factory
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
            'request_quotation_id' => RequestQuotation::factory(),
            'product_id' => Product::factory()->available(),
            'buying_price' => $buyingPrice,
            'quantity' => $quantity,
            'subtotal' => RequestQuotationItem::calculateSubtotal($buyingPrice, $quantity),
        ];
    }
}
