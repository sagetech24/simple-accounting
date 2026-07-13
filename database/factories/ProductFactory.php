<?php

namespace Database\Factories;

use App\Enums\ProductStatus;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $purchasePrice = fake()->randomFloat(2, 5, 250);

        return [
            'name' => fake()->unique()->words(3, true),
            'description' => fake()->optional(0.85)->paragraph(),
            'quantity' => fake()->numberBetween(0, 200),
            'purchase_price' => $purchasePrice,
            'selling_price' => round($purchasePrice * fake()->randomFloat(2, 1.15, 1.85), 2),
            'status' => fake()->randomElement(ProductStatus::cases()),
        ];
    }

    public function available(): static
    {
        return $this->state(fn () => [
            'status' => ProductStatus::Available,
            'quantity' => fake()->numberBetween(1, 150),
        ]);
    }

    public function unavailable(): static
    {
        return $this->state(fn () => [
            'status' => ProductStatus::Unavailable,
            'quantity' => 0,
        ]);
    }

    public function discontinued(): static
    {
        return $this->state(fn () => [
            'status' => ProductStatus::Discontinued,
            'quantity' => fake()->numberBetween(0, 5),
        ]);
    }
}
